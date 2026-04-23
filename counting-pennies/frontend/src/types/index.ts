export interface Category {
  id: number;
  name: string;
  type: "income" | "expense" | "both";
  color: string;
  icon: string;
  budget_amount: number;
  is_subscription: number;
  sort_order: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category_id: number;
  description: string;
  date: string;
  is_recurring: number;
  recurring_interval?: string;
  notes?: string;
  created_at: string;
  category_name: string;
  category_color: string;
  category_icon: string;
}

export interface Investment {
  id: number;
  name: string;
  type: "stock" | "crypto" | "fund" | "bond" | "property" | "other";
  symbol?: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  notes?: string;
  created_at: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  color: string;
  icon: string;
  notes?: string;
  created_at: string;
}

export interface Settings {
  currency: string;
  currency_symbol: string;
  date_format: string;
  theme: "light" | "dark";
  week_start: "monday" | "sunday";
}

export interface DashboardSummary {
  year: string;
  month: string;
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  expenseByCategory: Array<{
    id: number;
    name: string;
    color: string;
    icon: string;
    budget_amount: number;
    spent: number;
  }>;
  recentTransactions: Transaction[];
  portfolioValue: number;
  portfolioCost: number;
  portfolioGain: number;
  savingsGoals: SavingsGoal[];
}

export interface TrendPoint {
  year: string;
  month: string;
  label: string;
  income: number;
  expense: number;
}

export interface InvestmentSummary {
  totalCost: number;
  totalValue: number;
  gainLoss: number;
  gainLossPct: number;
  count: number;
  byType: Record<string, number>;
}
