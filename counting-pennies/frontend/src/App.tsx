import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import { settingsApi } from "./lib/api";
import type { Settings } from "./types";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Investments from "./pages/Investments";
import Savings from "./pages/Savings";
import Budgets from "./pages/Budgets";
import SettingsPage from "./pages/Settings";

const DEFAULT_SETTINGS: Settings = {
  currency: "GBP", currency_symbol: "£",
  date_format: "DD/MM/YYYY", theme: "dark", week_start: "monday",
};

export default function App() {
  const { theme, toggle } = useTheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    settingsApi.get().then(s => setSettings(s)).catch(() => {});
  }, []);

  const sharedProps = { theme, onToggleTheme: toggle, settings };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard {...sharedProps} />} />
        <Route path="/transactions" element={<Transactions {...sharedProps} />} />
        <Route path="/investments" element={<Investments {...sharedProps} />} />
        <Route path="/savings" element={<Savings {...sharedProps} />} />
        <Route path="/budgets" element={<Budgets {...sharedProps} />} />
        <Route path="/settings" element={<SettingsPage {...sharedProps} onSettingsChange={setSettings} />} />
      </Routes>
    </BrowserRouter>
  );
}
