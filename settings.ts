import { Router, Request, Response } from "express";
import db from "../database/db";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM categories ORDER BY sort_order, name").all();
  res.json(rows);
});

router.post("/", (req: Request, res: Response) => {
  const { name, type, color, icon, budget_amount, is_subscription } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "name and type are required" });
  }
  const maxOrder = (db.prepare("SELECT MAX(sort_order) as m FROM categories").get() as { m: number | null }).m ?? 0;
  const result = db.prepare(
    "INSERT INTO categories (name, type, color, icon, budget_amount, is_subscription, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(name, type, color || "#6366f1", icon || "tag", budget_amount || 0, is_subscription ? 1 : 0, maxOrder + 1);
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req: Request, res: Response) => {
  const { name, type, color, icon, budget_amount, is_subscription, sort_order } = req.body;
  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Category not found" });

  db.prepare(
    "UPDATE categories SET name=?, type=?, color=?, icon=?, budget_amount=?, is_subscription=?, sort_order=? WHERE id=?"
  ).run(
    name ?? (existing as any).name,
    type ?? (existing as any).type,
    color ?? (existing as any).color,
    icon ?? (existing as any).icon,
    budget_amount ?? (existing as any).budget_amount,
    is_subscription !== undefined ? (is_subscription ? 1 : 0) : (existing as any).is_subscription,
    sort_order ?? (existing as any).sort_order,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req: Request, res: Response) => {
  const used = db.prepare("SELECT COUNT(*) as c FROM transactions WHERE category_id = ?").get(req.params.id) as { c: number };
  if (used.c > 0) {
    return res.status(409).json({ error: "Category is in use by transactions. Reassign them first." });
  }
  db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
