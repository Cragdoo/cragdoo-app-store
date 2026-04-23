import { Router, Request, Response } from "express";
import db from "../database/db";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const { month, year, type, category_id, search, limit, offset } = req.query;

  let sql = `
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (year) {
    sql += ` AND strftime('%Y', t.date) = ?`;
    params.push(String(year));
  }
  if (month) {
    sql += ` AND strftime('%m', t.date) = ?`;
    params.push(String(month).padStart(2, "0"));
  }
  if (type) {
    sql += ` AND t.type = ?`;
    params.push(String(type));
  }
  if (category_id) {
    sql += ` AND t.category_id = ?`;
    params.push(Number(category_id));
  }
  if (search) {
    sql += ` AND (t.description LIKE ? OR c.name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY t.date DESC, t.id DESC`;

  const totalRow = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number };
  const total = totalRow.total;

  if (limit) {
    sql += ` LIMIT ?`;
    params.push(Number(limit));
    if (offset) {
      sql += ` OFFSET ?`;
      params.push(Number(offset));
    }
  }

  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows, total });
});

router.get("/summary", (req: Request, res: Response) => {
  const { month, year } = req.query;
  const params: string[] = [];
  let dateFilter = "WHERE 1=1";
  if (year) { dateFilter += ` AND strftime('%Y', date) = ?`; params.push(String(year)); }
  if (month) { dateFilter += ` AND strftime('%m', date) = ?`; params.push(String(month).padStart(2, "0")); }

  const income = (db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions ${dateFilter} AND type='income'`).get(...params) as { total: number }).total;
  const expense = (db.prepare(`SELECT COALESCE(SUM(amount),0) as total FROM transactions ${dateFilter} AND type='expense'`).get(...params) as { total: number }).total;

  const byCategory = db.prepare(`
    SELECT c.id, c.name, c.color, c.icon, c.budget_amount, t.type,
           COALESCE(SUM(t.amount), 0) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ${dateFilter}
    GROUP BY c.id, t.type
    ORDER BY total DESC
  `).all(...params);

  res.json({ income, expense, net: income - expense, byCategory });
});

router.post("/", (req: Request, res: Response) => {
  const { type, amount, category_id, description, date, is_recurring, recurring_interval, notes } = req.body;
  if (!type || !amount || !category_id || !date) {
    return res.status(400).json({ error: "type, amount, category_id and date are required" });
  }
  const result = db.prepare(
    "INSERT INTO transactions (type, amount, category_id, description, date, is_recurring, recurring_interval, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(type, amount, category_id, description || "", date, is_recurring ? 1 : 0, recurring_interval || null, notes || null);
  const row = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM transactions WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Transaction not found" });
  const { type, amount, category_id, description, date, is_recurring, recurring_interval, notes } = req.body;
  db.prepare(
    "UPDATE transactions SET type=?, amount=?, category_id=?, description=?, date=?, is_recurring=?, recurring_interval=?, notes=? WHERE id=?"
  ).run(
    type ?? existing.type,
    amount ?? existing.amount,
    category_id ?? existing.category_id,
    description ?? existing.description,
    date ?? existing.date,
    is_recurring !== undefined ? (is_recurring ? 1 : 0) : existing.is_recurring,
    recurring_interval ?? existing.recurring_interval,
    notes ?? existing.notes,
    req.params.id
  );
  const row = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.id = ?
  `).get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Transaction not found" });
  res.json({ success: true });
});

export default router;
