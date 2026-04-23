import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DB_PATH || path.join(__dirname, "../../../data/finance.db");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    color TEXT NOT NULL DEFAULT '#6366f1',
    icon TEXT NOT NULL DEFAULT 'tag',
    budget_amount REAL NOT NULL DEFAULT 0,
    is_subscription INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_interval TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'stock',
    symbol TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    purchase_price REAL NOT NULL,
    current_price REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    target_date TEXT,
    color TEXT NOT NULL DEFAULT '#10b981',
    icon TEXT NOT NULL DEFAULT 'piggy-bank',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function seedIfEmpty() {
  const count = (db.prepare("SELECT COUNT(*) as c FROM categories").get() as { c: number }).c;
  if (count > 0) return;

  const insertCategory = db.prepare(
    "INSERT INTO categories (name, type, color, icon, budget_amount, is_subscription, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const defaultCategories = [
    ["Salary",          "income",   "#10b981", "briefcase",      0,    0, 1],
    ["Freelance",       "income",   "#34d399", "laptop",         0,    0, 2],
    ["Other Income",    "income",   "#6ee7b7", "plus-circle",    0,    0, 3],
    ["Food & Grocery",  "expense",  "#f59e0b", "shopping-cart",  400,  0, 4],
    ["Eating Out",      "expense",  "#fbbf24", "utensils",       150,  0, 5],
    ["Gas & Fuel",      "expense",  "#ef4444", "fuel",           120,  0, 6],
    ["Electricity",     "expense",  "#f97316", "zap",            80,   0, 7],
    ["Broadband",       "expense",  "#3b82f6", "wifi",           50,   1, 8],
    ["Mobile Phone",    "expense",  "#60a5fa", "smartphone",     40,   1, 9],
    ["Netflix",         "expense",  "#e50914", "tv",             18,   1, 10],
    ["Sky TV",          "expense",  "#0047ab", "tv-2",           60,   1, 11],
    ["Apple TV+",       "expense",  "#555555", "apple",          9,    1, 12],
    ["Amazon Prime",    "expense",  "#00a8e0", "package",        9,    1, 13],
    ["Spotify",         "expense",  "#1db954", "music",          10,   1, 14],
    ["Disney+",         "expense",  "#113ccf", "film",           8,    1, 15],
    ["Rent / Mortgage", "expense",  "#8b5cf6", "home",           1200, 0, 16],
    ["Insurance",       "expense",  "#a78bfa", "shield",         100,  1, 17],
    ["Transport",       "expense",  "#6b7280", "car",            80,   0, 18],
    ["Health",          "expense",  "#ec4899", "heart",          50,   0, 19],
    ["Clothing",        "expense",  "#d946ef", "shirt",          60,   0, 20],
    ["Entertainment",   "expense",  "#14b8a6", "gamepad-2",      60,   0, 21],
    ["Savings",         "expense",  "#0ea5e9", "piggy-bank",     200,  0, 22],
    ["Other Expense",   "expense",  "#9ca3af", "tag",            0,    0, 23],
  ];

  const insertMany = db.transaction((cats: (string | number)[][]) => {
    for (const c of cats) insertCategory.run(...c);
  });
  insertMany(defaultCategories);

  const insertSetting = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  insertSetting.run("currency", "GBP");
  insertSetting.run("currency_symbol", "£");
  insertSetting.run("date_format", "DD/MM/YYYY");
  insertSetting.run("theme", "dark");
  insertSetting.run("week_start", "monday");
}

seedIfEmpty();

export default db;
