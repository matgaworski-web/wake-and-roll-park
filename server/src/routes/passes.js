import { Router } from 'express';
import db from '../db.js';
import { randomBytes } from 'node:crypto';

const router = Router();

// Pobierz dostępne rodzaje karnetów na sezon
router.get('/types', (req, res) => {
  try {
    const passTypes = db.prepare(`
      SELECT id, name, description, season, price_regular, price_promo, promo_badge, 
             entries_count, validity_days, includes_equipment 
      FROM pass_types 
      WHERE is_active = 1 
      ORDER BY sort_order ASC
    `).all();

    // Pobierz status konfiguracji bankowej
    const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
    const isTestMode = getSetting.get('is_test_mode')?.value === '1';
    const bankConfigured = getSetting.get('bank_configured')?.value === '1';

    res.json({
      success: true,
      data: passTypes,
      paymentInfo: {
        isTestMode,
        bankConfigured,
        notice: !bankConfigured 
          ? 'Sprzedaż w trybie roboczym – oficjalne dane rachunku bankowego oczekują na zatwierdzenie przez właściciela.' 
          : 'Płatność tradycyjnym przelewem bankowym. Karnet aktywowany jest po zaksięgowaniu wpłaty.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Złóż zamówienie na karnet z płatnością przelewem bankowym
router.post('/order', (req, res) => {
  try {
    const { passTypeId, customerName, customerEmail, customerPhone, notes } = req.body;

    if (!passTypeId || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Proszę wypełnić wszystkie wymagane pola: rodzaj karnetu, imię i nazwisko, e-mail oraz numer telefonu.'
      });
    }

    // Walidacja e-mail i telefonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ success: false, error: 'Niepoprawny format adresu e-mail.' });
    }

    const cleanPhone = customerPhone.replace(/[\s-]/g, '');
    if (cleanPhone.length < 9) {
      return res.status(400).json({ success: false, error: 'Niepoprawny numer telefonu (minimum 9 cyfr).' });
    }

    // Pobierz karnet
    const passType = db.prepare('SELECT * FROM pass_types WHERE id = ? AND is_active = 1').get(passTypeId);
    if (!passType) {
      return res.status(404).json({ success: false, error: 'Wybrany karnet nie istnieje lub jest niedostępny.' });
    }

    // Ustal kwotę (promocyjna jeśli ustawiona, w przeciwnym razie regularna)
    const finalAmount = passType.price_promo ? passType.price_promo : passType.price_regular;

    // Generowanie unikalnego numeru zamówienia: np. WARP-2027-X4892
    const randomHex = randomBytes(2).toString('hex').toUpperCase();
    const orderNumber = `WARP-${passType.season}-${Date.now().toString().slice(-4)}${randomHex}`;

    // Tytuł przelewu: "Karnet [NUMER_ZAMÓWIENIA] [NAZWISKO]"
    const lastName = customerName.trim().split(' ').slice(-1)[0] || 'KLIENT';
    const transferTitle = `Karnet ${orderNumber} ${lastName}`.toUpperCase();

    // Pobierz ustawienia bankowe
    const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
    const isTestMode = getSetting.get('is_test_mode')?.value === '1';
    const bankConfigured = getSetting.get('bank_configured')?.value === '1';
    const recipientName = getSetting.get('recipient_name')?.value || 'WAKE & ROLL PARK S.C.';
    const recipientAddress = getSetting.get('recipient_address')?.value || 'ul. Patriotyczna 3, 93-452 Łódź';
    const bankName = getSetting.get('bank_name')?.value || 'Santander Bank Polska';
    const accountNumber = getSetting.get('account_number')?.value || 'OCZEKUJE_NA_WPROWADZENIE_W_PANELU';

    // Zapisz zamówienie ze statusem 'pending' (oczekuje na wpłatę)
    const insertOrder = db.prepare(`
      INSERT INTO pass_orders 
      (order_number, pass_type_id, customer_name, customer_email, customer_phone, amount, transfer_title, status, is_test_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    const result = insertOrder.run(
      orderNumber, passTypeId, customerName.trim(), customerEmail.trim().toLowerCase(),
      cleanPhone, finalAmount, transferTitle, isTestMode ? 1 : 0
    );

    res.status(201).json({
      success: true,
      order: {
        id: result.lastInsertRowid,
        orderNumber,
        status: 'pending',
        passName: passType.name,
        amount: finalAmount,
        currency: 'PLN',
        paymentDetails: {
          recipientName,
          recipientAddress,
          accountNumber,
          bankName,
          transferTitle,
          amountDue: `${finalAmount.toFixed(2)} PLN`,
          isTestMode,
          bankConfigured,
          instruction: bankConfigured
            ? `Prosimy o wykonanie przelewu w kwocie ${finalAmount.toFixed(2)} PLN na powyższy numer konta. W tytule przelewu koniecznie wpisz: "${transferTitle}". Po zaksięgowaniu wpłaty przez administratora otrzymasz e-mail z aktywnym kodem karnetu.`
            : `Zamówienie zostało zapisane w trybie roboczym (testowym). Po uzupełnieniu danych rachunku przez administratora otrzymasz oficjalne dane do wpłaty na adres ${customerEmail}.`
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Sprawdź status zamówienia / karnetu po numerze zamówienia
router.get('/order/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = db.prepare(`
      SELECT o.*, p.name as pass_name, p.entries_count, p.validity_days 
      FROM pass_orders o
      JOIN pass_types p ON o.pass_type_id = p.id
      WHERE o.order_number = ?
    `).get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Zamówienie nie zostało odnalezione.' });
    }

    // Jeśli opłacone, pobierz powiązany aktywny karnet
    let activePass = null;
    if (order.status === 'paid') {
      activePass = db.prepare('SELECT * FROM active_passes WHERE order_id = ?').get(order.id);
    }

    res.json({
      success: true,
      order: {
        orderNumber: order.order_number,
        status: order.status,
        customerName: order.customer_name,
        passName: order.pass_name,
        amount: order.amount,
        transferTitle: order.transfer_title,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        activePass: activePass ? {
          passCode: activePass.pass_code,
          totalEntries: activePass.total_entries,
          usedEntries: activePass.used_entries,
          remainingEntries: activePass.total_entries - activePass.used_entries,
          validUntil: activePass.valid_until
        } : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
