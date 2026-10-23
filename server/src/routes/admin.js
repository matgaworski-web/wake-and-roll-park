import { Router } from 'express';
import db, { hashPassword } from '../db.js';
import { randomBytes } from 'node:crypto';

const router = Router();

// Middleware uwierzytelniania administratora
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Brak autoryzacji. Zaloguj się do panelu administratora.' });
  }

  const token = authHeader.substring(7);
  const session = db.prepare(`
    SELECT s.*, u.username 
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Sesja wygasła lub jest niepoprawna. Zaloguj się ponownie.' });
  }

  req.admin = session;
  next();
}

// Logowanie administratora
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Podaj login i hasło.' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Błędny login lub hasło.' });
    }

    const { hash } = hashPassword(password, user.salt);
    if (hash !== user.password_hash) {
      return res.status(401).json({ success: false, error: 'Błędny login lub hasło.' });
    }

    // Utwórz sesję ważną 7 dni
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (?, ?, ?)')
      .run(token, user.id, expiresAt);

    res.json({
      success: true,
      token,
      username: user.username,
      expiresAt
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pobierz statystyki pulpitu (Dashboard Summary)
router.get('/dashboard-stats', requireAdmin, (req, res) => {
  try {
    const pendingOrdersCount = db.prepare("SELECT COUNT(*) as count FROM pass_orders WHERE status = 'pending'").get().count;
    const paidOrdersCount = db.prepare("SELECT COUNT(*) as count FROM pass_orders WHERE status = 'paid'").get().count;
    const totalPassRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM pass_orders WHERE status = 'paid'").get().total;
    const todayBookingsCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE booking_date = date('now') AND status != 'cancelled'").get().count;

    res.json({
      success: true,
      stats: {
        pendingOrdersCount,
        paidOrdersCount,
        totalPassRevenue,
        todayBookingsCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pobierz wszystkie zamówienia karnetów
router.get('/orders', requireAdmin, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, p.name as pass_name, p.entries_count,
             a.pass_code as active_pass_code
      FROM pass_orders o
      JOIN pass_types p ON o.pass_type_id = p.id
      LEFT JOIN active_passes a ON a.order_id = o.id
      ORDER BY o.created_at DESC
    `).all();

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Potwierdź wpłatę przelewu i aktywuj karnet (Wymagane przez specyfikację: administrator ręcznie sprawdza wyciąg!)
router.post('/orders/:id/confirm-payment', requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    const order = db.prepare('SELECT * FROM pass_orders WHERE id = ?').get(orderId);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Zamówienie nie istnieje.' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ success: false, error: 'Zamówienie zostało już wcześniej oznaczone jako opłacone.' });
    }

    const passType = db.prepare('SELECT * FROM pass_types WHERE id = ?').get(order.pass_type_id);

    // 1. Oznacz zamówienie jako opłacone
    const now = new Date().toISOString();
    db.prepare("UPDATE pass_orders SET status = 'paid', paid_at = ? WHERE id = ?").run(now, orderId);

    // 2. Wygeneruj unikalny kod aktywnego karnetu: KARNET-WARP-XXXX
    const passCode = `KARNET-${order.order_number.replace('WARP-', '')}-${randomBytes(2).toString('hex').toUpperCase()}`;
    const validUntilDate = new Date(Date.now() + passType.validity_days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 3. Utwórz aktywny karnet
    db.prepare(`
      INSERT INTO active_passes 
      (pass_code, order_id, customer_name, customer_email, customer_phone, pass_type_id, total_entries, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      passCode, order.id, order.customer_name, order.customer_email, order.customer_phone,
      passType.id, passType.entries_count, validUntilDate
    );

    res.json({
      success: true,
      message: `Płatność potwierdzona! Aktywowano karnet o kodzie: ${passCode}`,
      passCode,
      validUntil: validUntilDate
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Anuluj zamówienie karnetu
router.post('/orders/:id/cancel', requireAdmin, (req, res) => {
  try {
    const orderId = req.params.id;
    db.prepare("UPDATE pass_orders SET status = 'cancelled' WHERE id = ?").run(orderId);
    res.json({ success: true, message: 'Zamówienie zostało anulowane.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pobierz rezerwacje na dany dzień dla managera
router.get('/bookings', requireAdmin, (req, res) => {
  try {
    const { date } = req.query;
    const filterDate = date || new Date().toISOString().split('T')[0];

    const bookings = db.prepare(`
      SELECT * FROM bookings 
      WHERE booking_date = ? 
      ORDER BY time_slot ASC, created_at ASC
    `).all(filterDate);

    const blocked = db.prepare('SELECT * FROM blocked_slots WHERE slot_date = ?').all(filterDate);

    res.json({
      success: true,
      date: filterDate,
      bookings,
      blockedSlots: blocked
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Zablokuj slot (np. burza, serwis, event firmowy)
router.post('/slots/block', requireAdmin, (req, res) => {
  try {
    const { date, timeSlot, reason } = req.body;
    if (!date || !timeSlot || !reason) {
      return res.status(400).json({ success: false, error: 'Data, godzina i powód blokady są wymagane.' });
    }

    db.prepare('INSERT INTO blocked_slots (slot_date, time_slot, reason) VALUES (?, ?, ?)')
      .run(date, timeSlot, reason);

    res.status(201).json({ success: true, message: `Zablokowano slot ${timeSlot} w dniu ${date} (${reason}).` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Odblokuj slot
router.delete('/slots/block/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM blocked_slots WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Slot został odblokowany.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pobierz konfigurację ustawień
router.get('/settings', requireAdmin, (req, res) => {
  try {
    const all = db.prepare('SELECT key, value FROM settings').all();
    const map = {};
    for (const item of all) {
      map[item.key] = item.value;
    }
    res.json({ success: true, settings: map });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Zapisz konfigurację bankową i tryb sprzedaży
router.post('/settings', requireAdmin, (req, res) => {
  try {
    const { recipient_name, recipient_address, bank_name, account_number, is_test_mode, bank_configured } = req.body;

    const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))');

    if (recipient_name !== undefined) upsert.run('recipient_name', recipient_name);
    if (recipient_address !== undefined) upsert.run('recipient_address', recipient_address);
    if (bank_name !== undefined) upsert.run('bank_name', bank_name);
    if (account_number !== undefined) upsert.run('account_number', account_number);
    if (is_test_mode !== undefined) upsert.run('is_test_mode', is_test_mode ? '1' : '0');
    if (bank_configured !== undefined) upsert.run('bank_configured', bank_configured ? '1' : '0');

    res.json({ success: true, message: 'Ustawienia zostały pomyślnie zapisane.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Edytuj ceny i promocje karnetów (zgodnie z wymogiem edytowalnych pól promocji)
router.post('/passes/types/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { price_regular, price_promo, promo_badge, is_active } = req.body;

    db.prepare(`
      UPDATE pass_types 
      SET price_regular = COALESCE(?, price_regular),
          price_promo = ?,
          promo_badge = ?,
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(price_regular, price_promo || null, promo_badge || null, is_active, id);

    res.json({ success: true, message: 'Dane karnetu i promocja zostały zaktualizowane.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
