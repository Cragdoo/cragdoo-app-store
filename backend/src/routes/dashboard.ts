import { Router, Request, Response } from "express";
import db from "../database/db";

const router = Router();

router.get("/summary", (req: Request, res: Response) => {
  const now = new Date();
  const year = req.query.year ? String(req.query.year) : String(now.getFullYear());
  const month = req.query.month ? String(req.query.month).padStart(2, "0") : String(now.getMonth() + 1).padStart(2, "0");

  const income = (db.prepare(
    "SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='income' AND strftime('%Y',date)=? AND strftime('%m',date)=?"
  ).get(year, month) as { v: number }).v;

  const expense = (db.prepare(
    "SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='expense' AND strftime('%Y',date)=? AND strftime('%m',date)=?"
  ).get(year, month) as { v: number }).v;

  const expenseByCategory = db.prepare(`
    SELECT c.id, c.name, c.color, c.icon, c.budget_amount,
           COALESCE(SUM(t.amount), 0) as spent
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.type = 'expense'
      AND strftime('%Y', t.date) = ?
      AND strftime('%m', t.date) = ?
    WHERE c.type = 'expense'
    GROUP BY c.id
    HAVING spent > 0
    ORDER BY spent DESC
  `).all(year, month);

  const recentTransactions = db.prepare(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ORDER BY t.date DESC, t.id DESC
    LIMIT 10
  `).all();

  const investments = db.prepare("SELECT * FROM investments").all() as any[];
  const portfolioValue = investments.reduce((s, i) => s + i.current_price * i.quantity, 0);
  const portfolioCost = investments.reduce((s, i) => s + i.purchase_price * i.quantity, 0);

  const savingsGoals = db.prepare("SELECT * FROM savings_goals ORDER BY created_at DESC LIMIT 4").all();

  res.json({
    year, month,
    income, expense, net: income - expense,
    savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
    expenseByCategory,
    recentTransactions,
    portfolioValue,
    portfolioCost,
    portfolioGain: portfolioValue - portfolioCost,
    savingsGoals,
  });
});

router.get("/trends", (req: Request, res: Response) => {
  const months = Number(req.query.months || 6);
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, "0");

    const income = (db.prepare(
      "SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='income' AND strftime('%Y',date)=? AND strftime('%m',date)=?"
    ).get(y, m) as { v: number }).v;

    const expense = (db.prepare(
      "SELECT COALESCE(SUM(amount),0) as v FROM transactions WHERE type='expense' AND strftime('%Y',date)=? AND strftime('%m',date)=?"
    ).get(y, m) as { v: number }).v;

    result.push({ year: y, month: m, label: `${d.toLocaleString("default", { month: "short" })} ${y}`, income, expense });
  }

  res.json(result);
});

export default router;
