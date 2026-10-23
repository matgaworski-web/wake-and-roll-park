import { Router } from 'express';
import db from '../db.js';
import { randomBytes } from 'node:crypto';

const router = Router();

const OPERATING_HOURS = [
  '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00'
];

// Sprawdź wolne sloty na wybrany dzień
router.get('/slots', (req, res) => {
  try {
    const { date } = req.query; // Format YYYY-MM-DD
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, error: 'Wymagana poprawna data w formacie YYYY-MM-DD.' });
    }

    const dayOfWeek = new Date(date).getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6); // 0 = Niedziela, 6 = Sobota

    // Stawki bazowe
    const regularSessionPrice = isWeekend ? 50.00 : 45.00;
    const exclusivePrice = isWeekend ? 200.00 : 180.00;
    const boardRentalPrice = 20.00;
    const supPrice = 40.00;

    // Pobierz zablokowane terminy
    const blockedSlots = db.prepare('SELECT time_slot, reason FROM blocked_slots WHERE slot_date = ?').all(date);
    const blockedMap = new Map();
    for (const b of blockedSlots) {
      blockedMap.set(b.time_slot, b.reason);
    }

    // Pobierz istniejące aktywne rezerwacje na dany dzień
    const existingBookings = db.prepare(`
      SELECT time_slot, category, participants_count, board_rental_count 
      FROM bookings 
      WHERE booking_date = ? AND status != 'cancelled'
    `).all(date);

    // Zagreguj zajętość dla każdego slotu
    const slotStats = new Map();
    for (const b of existingBookings) {
      if (!slotStats.has(b.time_slot)) {
        slotStats.set(b.time_slot, { cableParticipants: 0, hasExclusive: false, supCount: 0 });
      }
      const st = slotStats.get(b.time_slot);
      if (b.category === 'cable_exclusive') {
        st.hasExclusive = true;
      } else if (b.category === 'cable_regular') {
        st.cableParticipants += b.participants_count;
      } else if (b.category === 'sup') {
        st.supCount += b.participants_count;
      }
    }

    const isAllDayBlocked = blockedMap.has('ALL_DAY');

    const resultSlots = OPERATING_HOURS.map(time => {
      const stats = slotStats.get(time) || { cableParticipants: 0, hasExclusive: false, supCount: 0 };
      const blockReason = blockedMap.get(time) || (isAllDayBlocked ? blockedMap.get('ALL_DAY') : null);

      let status = 'available';
      let availableCableSpots = 4 - stats.cableParticipants;

      if (blockReason) {
        status = 'blocked';
        availableCableSpots = 0;
      } else if (stats.hasExclusive) {
        status = 'exclusive_booked';
        availableCableSpots = 0;
      } else if (availableCableSpots <= 0) {
        status = 'full';
        availableCableSpots = 0;
      }

      return {
        time,
        date,
        status,
        blockReason: blockReason || null,
        availableCableSpots,
        maxCableCapacity: 4,
        canBookExclusive: (stats.cableParticipants === 0 && !stats.hasExclusive && !blockReason),
        pricing: {
          regularSession: regularSessionPrice,
          boardRental: boardRentalPrice,
          exclusive1h: exclusivePrice,
          sup1h: supPrice,
          isWeekend
        }
      };
    });

    res.json({
      success: true,
      date,
      isWeekend,
      dayName: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][dayOfWeek],
      slots: resultSlots
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Złóż nową rezerwację wyciągu lub SUP
router.post('/', (req, res) => {
  try {
    const {
      date,
      timeSlot,
      category, // 'cable_regular', 'cable_exclusive', 'sup'
      participantsCount = 1,
      boardRentalCount = 0,
      customerName,
      customerEmail,
      customerPhone,
      passCode,
      notes
    } = req.body;

    if (!date || !timeSlot || !category || !customerName || !customerPhone || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Wszystkie dane rezerwacji (data, godzina, imię, e-mail, telefon) są wymagane.'
      });
    }

    const dayOfWeek = new Date(date).getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    // Sprawdź czy termin nie jest zablokowany
    const isBlocked = db.prepare(`
      SELECT reason FROM blocked_slots 
      WHERE slot_date = ? AND (time_slot = ? OR time_slot = 'ALL_DAY')
    `).get(date, timeSlot);

    if (isBlocked) {
      return res.status(400).json({
        success: false,
        error: `Wybrany termin jest niedostępny z powodu: ${isBlocked.reason}`
      });
    }

    // Sprawdź zajętość wyciągu
    if (category === 'cable_exclusive') {
      const existing = db.prepare(`
        SELECT COUNT(*) as count FROM bookings 
        WHERE booking_date = ? AND time_slot = ? AND status != 'cancelled'
      `).get(date, timeSlot);

      if (existing.count > 0) {
        return res.status(400).json({
          success: false,
          error: 'Na tę godzinę istnieją już rezerwacje – wyciąg na wyłączność można zarezerwować tylko na całkowicie wolny slot.'
        });
      }
    } else if (category === 'cable_regular') {
      const existing = db.prepare(`
        SELECT category, SUM(participants_count) as total 
        FROM bookings 
        WHERE booking_date = ? AND time_slot = ? AND status != 'cancelled'
        GROUP BY category
      `).all(date, timeSlot);

      let currentParticipants = 0;
      for (const e of existing) {
        if (e.category === 'cable_exclusive') {
          return res.status(400).json({ success: false, error: 'W tej godzinie cały wyciąg jest zarezerwowany na wyłączność.' });
        }
        if (e.category === 'cable_regular') {
          currentParticipants += e.total;
        }
      }

      if (currentParticipants + participantsCount > 4) {
        return res.status(400).json({
          success: false,
          error: `Brak wystarczającej liczby miejsc na wyciągu. Dostępne miejsca: ${4 - currentParticipants}.`
        });
      }
    }

    // Kalkulacja ceny
    let totalPrice = 0;
    if (category === 'cable_exclusive') {
      totalPrice = isWeekend ? 200.00 : 180.00;
    } else if (category === 'cable_regular') {
      const basePerPerson = isWeekend ? 50.00 : 45.00;
      totalPrice = (basePerPerson * participantsCount) + (boardRentalCount * 20.00);
    } else if (category === 'sup') {
      totalPrice = 40.00 * participantsCount;
    }

    // Obsługa płatności karnetem (jeśli podano kod karnetu)
    let paymentMethod = 'onsite';
    let verifiedPassCode = null;

    if (passCode) {
      const pass = db.prepare('SELECT * FROM active_passes WHERE pass_code = ? AND is_active = 1').get(passCode.trim().toUpperCase());
      if (pass) {
        if (pass.total_entries - pass.used_entries >= participantsCount) {
          // Pobierz wejścia z karnetu
          db.prepare('UPDATE active_passes SET used_entries = used_entries + ? WHERE id = ?').run(participantsCount, pass.id);
          paymentMethod = 'pass_credit';
          verifiedPassCode = pass.pass_code;
          // Odlicz koszt wejść (dopłata tylko za dodatkową deskę jeśli karnet nie zawiera sprzętu)
          totalPrice = (pass.total_entries === 999) ? 0 : (boardRentalCount * 20.00);
        }
      }
    }

    // Generowanie kodu rezerwacji: REZ-XXXX
    const bookingCode = `REZ-${randomBytes(2).toString('hex').toUpperCase()}`;

    const insertBooking = db.prepare(`
      INSERT INTO bookings 
      (booking_code, booking_date, time_slot, category, participants_count, board_rental_count,
       customer_name, customer_email, customer_phone, total_price, payment_method, pass_code_used, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBooking.run(
      bookingCode, date, timeSlot, category, participantsCount, boardRentalCount,
      customerName.trim(), customerEmail.trim().toLowerCase(), customerPhone.trim(),
      totalPrice, paymentMethod, verifiedPassCode, notes || null
    );

    res.status(201).json({
      success: true,
      booking: {
        bookingCode,
        date,
        timeSlot,
        category,
        participantsCount,
        boardRentalCount,
        customerName,
        totalPrice: `${totalPrice.toFixed(2)} PLN`,
        paymentMethod: paymentMethod === 'pass_credit' ? 'Opłacono z Karnetu' : 'Płatność na miejscu w kasie',
        instruction: 'Zapraszamy 15 minut przed rozpoczęciem sesji na pomost wyciągu (ul. Patriotyczna 3, Stawy Stefańskiego). Kask i kamizelka asekuracyjna są w cenie sesji.'
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
