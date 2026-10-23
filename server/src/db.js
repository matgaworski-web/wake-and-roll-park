import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'wakeandroll.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Inicjalizacja schematu bazy danych
db.exec(`
  -- 1. Ustawienia globalne (w tym dane bankowe i tryb testowy)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. Rodzaje karnetów w ofercie
  CREATE TABLE IF NOT EXISTS pass_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    season TEXT NOT NULL DEFAULT '2027',
    price_regular REAL NOT NULL,
    price_promo REAL,
    promo_badge TEXT,
    entries_count INTEGER NOT NULL,      -- np. 5, 10, lub 999 dla nielimitowanego
    validity_days INTEGER NOT NULL,      -- ważność w dniach od aktywacji
    includes_equipment INTEGER DEFAULT 0, -- 1 jeśli z deską
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
  );

  -- 3. Zamówienia karnetów (płatność tradycyjnym przelewem)
  CREATE TABLE IF NOT EXISTS pass_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,    -- np. WARP-2027-8492
    pass_type_id TEXT NOT NULL REFERENCES pass_types(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount REAL NOT NULL,
    transfer_title TEXT NOT NULL,         -- unikalny tytuł do wpłaty
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    admin_notes TEXT,
    is_test_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME
  );

  -- 4. Aktywowane karnety (kod wydawany po zaksięgowaniu wpłaty przez admina)
  CREATE TABLE IF NOT EXISTS active_passes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pass_code TEXT UNIQUE NOT NULL,       -- np. KARNET-WARP-7392-AB
    order_id INTEGER REFERENCES pass_orders(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    pass_type_id TEXT NOT NULL,
    total_entries INTEGER NOT NULL,
    used_entries INTEGER DEFAULT 0,
    valid_until DATE NOT NULL,
    is_active INTEGER DEFAULT 1,
    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 5. Rezerwacje toru (wyciąg 2.0 i SUP)
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_code TEXT UNIQUE NOT NULL,     -- np. REZ-9281
    booking_date TEXT NOT NULL,            -- YYYY-MM-DD
    time_slot TEXT NOT NULL,               -- HH:MM (np. '14:00')
    category TEXT NOT NULL,                -- 'cable_regular', 'cable_exclusive', 'sup'
    participants_count INTEGER DEFAULT 1,  -- max 4 dla cable_regular
    board_rental_count INTEGER DEFAULT 0,  -- +20 zł/szt
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total_price REAL NOT NULL,
    payment_method TEXT DEFAULT 'onsite',  -- 'onsite' (na molo/w kasie), 'bank_transfer', 'pass_credit'
    pass_code_used TEXT,
    status TEXT DEFAULT 'confirmed',       -- 'confirmed', 'cancelled', 'completed'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 6. Zablokowane sloty (np. pogoda, serwis, event)
  CREATE TABLE IF NOT EXISTS blocked_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_date TEXT NOT NULL,               -- YYYY-MM-DD
    time_slot TEXT NOT NULL,               -- HH:MM lub 'ALL_DAY'
    reason TEXT NOT NULL,                  -- 'Burza / Pogoda', 'Serwis wyciągu', 'Impreza zamknięta'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 7. Administratorzy i sesje
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    admin_id INTEGER REFERENCES admin_users(id),
    expires_at DATETIME NOT NULL
  );
`);

// Funkcja pomocnicza do haszowania haseł
export function hashPassword(password, salt = null) {
  if (!salt) {
    salt = randomBytes(16).toString('hex');
  }
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return { hash, salt };
}

// Inicjalizacja domyślnych danych
function seedInitialData() {
  // Domyślne ustawienia bankowe w trybie roboczym
  const checkSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  
  if (!checkSetting.get('bank_configured')) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('bank_configured', '0');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('is_test_mode', '1');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('recipient_name', 'WAKE & ROLL PARK S.C.');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('recipient_address', 'ul. Patriotyczna 3, 93-452 Łódź');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('bank_name', 'Oczekuje na wprowadzenie w panelu');
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('account_number', 'OCZEKUJE_NA_UZUPELNIENIE_W_PANELU');
  }

  // Domyślny administrator: admin / WakeRollPark2027!
  const checkAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?');
  if (!checkAdmin.get('admin')) {
    const { hash, salt } = hashPassword('WakeRollPark2027!');
    db.prepare('INSERT INTO admin_users (username, password_hash, salt) VALUES (?, ?, ?)')
      .run('admin', hash, salt);
    console.log('[DB] Zainicjalizowano domyslne konto administratora (admin)');
  }

  // Domyślne rodzaje karnetów na Sezon 2027
  const checkPass = db.prepare('SELECT id FROM pass_types LIMIT 1');
  if (!checkPass.get()) {
    const passTypes = [
      {
        id: 'pass_5_regular',
        name: 'Karnet 5 Sesji (Sprzęt Własny)',
        description: 'Pakiet 5 pojedynczych godzinnych sesji na wyciągu Sesitec 2.0. Obowiązuje od poniedziałku do niedzieli w sezonie 2027.',
        season: '2027',
        price_regular: 220.00,
        price_promo: null,
        promo_badge: null,
        entries_count: 5,
        validity_days: 120,
        includes_equipment: 0,
        sort_order: 1
      },
      {
        id: 'pass_10_regular',
        name: 'Karnet 10 Sesji (Sprzęt Własny)',
        description: 'Pakiet 10 sesji na wyciągu 2.0. Najpopularniejszy wybór dla regularnie pływających ridersów.',
        season: '2027',
        price_regular: 420.00,
        price_promo: null,
        promo_badge: 'Bestseller',
        entries_count: 10,
        validity_days: 150,
        includes_equipment: 0,
        sort_order: 2
      },
      {
        id: 'pass_5_full',
        name: 'Karnet 5 Sesji (Z Wypożyczeniem Deski)',
        description: '5 sesji wraz z kompletnym sprzętem (deska wakeboardowa z wiązaniami, kask i kamizelka w cenie).',
        season: '2027',
        price_regular: 310.00,
        price_promo: null,
        promo_badge: null,
        entries_count: 5,
        validity_days: 120,
        includes_equipment: 1,
        sort_order: 3
      },
      {
        id: 'pass_vip_season',
        name: 'Karnet Sezonowy VIP 2027',
        description: 'Nielimitowane wejścia na wyciąg przez cały sezon 2027 + pierwszeństwo rezerwacji i zniżka w Beach Barze.',
        season: '2027',
        price_regular: 2490.00,
        price_promo: null,
        promo_badge: 'Edycja Limitowana',
        entries_count: 999,
        validity_days: 180,
        includes_equipment: 0,
        sort_order: 4
      }
    ];

    const insertPass = db.prepare(`
      INSERT INTO pass_types 
      (id, name, description, season, price_regular, price_promo, promo_badge, entries_count, validity_days, includes_equipment, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of passTypes) {
      insertPass.run(
        p.id, p.name, p.description, p.season, p.price_regular, p.price_promo,
        p.promo_badge, p.entries_count, p.validity_days, p.includes_equipment, p.sort_order
      );
    }
    console.log('[DB] Zainicjalizowano rodzaje karnetow na Sezon 2027');
  }
}

seedInitialData();

export default db;
