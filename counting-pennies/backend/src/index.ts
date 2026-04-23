import express from "express";
import cors from "cors";
import categoriesRouter from "./routes/categories";
import transactionsRouter from "./routes/transactions";
import investmentsRouter from "./routes/investments";
import savingsRouter from "./routes/savings";
import settingsRouter from "./routes/settings";
import dashboardRouter from "./routes/dashboard";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/categories", categoriesRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/investments", investmentsRouter);
app.use("/api/savings", savingsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Counting Pennies API running on port ${PORT}`);
});
