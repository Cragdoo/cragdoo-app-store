import { Router, Request, Response } from "express";
import db from "../database/db";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM investments ORDER BY name").all();
  res.json(rows);
});

router.get("/summary", (_req: Request, res: Response) => {
  const rows = db.prepare("SELECT * FROM investments").all() as any[];
  const totalCost = rows.reduce((s, r) => s + r.purchase_price * r.quantity, 0);
  const totalValue = rows.reduce((s, r) => s + r.current_price * r.quantity, 0);
  const gainLoss = totalValue - totalCost;
  const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

  const byType = rows.reduce((acc: Record<string, number>, r) => {
    acc[r.type] = (acc[r.type] || 0) + r.current_price * r.quantity;
    return acc;
  }, {});

  res.json({ totalCost, totalValue, gainLoss, gainLossPct, count: rows.length, byType });
});

router.post("/", (req: Request, res: Response) => {
  const { name, type, symbol, quantity, purchase_price, current_price, purchase_date, notes } = req.body;
  if (!name || !purchase_price || !current_price || !purchase_date) {
    return res.status(400).json({ error: "name, purchase_price, current_price and purchase_date are required" });
  }
  const result = db.prepare(
    "INSERT INTO investments (name, type, symbol, quantity, purchase_price, current_price, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(name, type || "stock", symbol || null, quantity || 1, purchase_price, current_price, purchase_date, notes || null);
  const row = db.prepare("SELECT * FROM investments WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put("/:id", (req: Request, res: Response) => {
  const existing = db.prepare("SELECT * FROM investments WHERE id = ?").get(req.params.id) as any;
  if (!existing) return res.status(404).json({ error: "Investment not found" });
  const { name, type, symbol, quantity, purchase_price, current_price, purchase_date, notes } = req.body;
  db.prepare(
    "UPDATE investments SET name=?, type=?, symbol=?, quantity=?, purchase_price=?, current_price=?, purchase_date=?, notes=? WHERE id=?"
  ).run(
    name ?? existing.name,
    type ?? existing.type,
    symbol ?? existing.symbol,
    quantity ?? existing.quantity,
    purchase_price ?? existing.purchase_price,
    current_price ?? existing.current_price,
    purchase_date ?? existing.purchase_date,
    notes ?? existing.notes,
    req.params.id
  );
  const row = db.prepare("SELECT * FROM investments WHERE id = ?").get(req.params.id);
  res.json(row);
});

router.delete("/:id", (req: Request, res: Response) => {
  const result = db.prepare("DELETE FROM investments WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Investment not found" });
  res.json({ success: true });
});

export default router;
