import { Router, Request, Response } from "express";
import db from "../database/db";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM savings_goals ORDER BY created_at DESC").all();
  res.json(rows);
});

router.post("/", (req: Request, res: Response) => {
  const { name, target_amount, current_amount, target_date, color, icon, notes } = req.body;
  if (!name || !target_amount) {
    return res.status(400).json({ error: "name and target_amount are required" });
  }
  const result = db.prepare(
    "INSERT INTO savings_goals (name, target_amount, current_amount, target_date, color, icon, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(name, target_amount, current_amount || 0, target_date || null, color || "#10b981", icon || "piggy-bank", notes || null);
  const row = db.prepare("SELECT * FROM savings_goals WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM savings_goals WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Savings goal not found" });
  const { name, target_amount, current_amount, target_date, color, icon, notes } = req.body;
  db.prepare(
    "UPDATE savings_goals SET name=?, target_amount=?, current_amount=?, target_date=?, color=?, icon=?, notes=? WHERE id=?"
  ).run(
    name ?? existing.name,
    target_amount ?? existing.target_amount,
    current_amount ?? existing.current_amount,
    target_date ?? existing.target_date,
    color ?? existing.color,
    icon ?? existing.icon,
    notes ?? existing.notes,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM savings_goals WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.post("/:id/contribute", (req: Request, res: Response) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Positive amount required" });
  const existing = db.prepare("SELECT * FROM savings_goals WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Savings goal not found" });
  const newAmount = Math.min(existing.current_amount + Number(amount), existing.target_amount);
  db.prepare("UPDATE savings_goals SET current_amount = ? WHERE id = ?").run(newAmount, req.params.id);
  const row = db.prepare("SELECT * FROM savings_goals WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM savings_goals WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Savings goal not found" });
  res.json({ success: true });
});

export default router;
