import axios from "axios";
import type {
  Category, Transaction, Investment, SavingsGoal,
  Settings, DashboardSummary, TrendPoint, InvestmentSummary,
} from "../types";

const api = axios.create({ baseURL: "/api" });

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories").then(r => r.data),
  create: (data: Partial<Category>) => api.post<Category>("/categories", data).then(r => r.data),
  update: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/categories/${id}`).then(r => r.data),
};

export const transactionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<{ data: Transaction[]; total: number }>("/transactions", { params }).then(r => r.data),
  summary: (params?: Record<string, string | number>) =>
    api.get<{ income: number; expense: number; net: number; byCategory: any[] }>("/transactions/summary", { params }).then(r => r.data),
  create: (data: Partial<Transaction>) => api.post<Transaction>("/transactions", data).then(r => r.data),
  update: (id: number, data: Partial<Transaction>) => api.put<Transaction>(`/transactions/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/transactions/${id}`).then(r => r.data),
};

export const investmentsApi = {
  list: () => api.get<Investment[]>("/investments").then(r => r.data),
  summary: () => api.get<InvestmentSummary>("/investments/summary").then(r => r.data),
  create: (data: Partial<Investment>) => api.post<Investment>("/investments", data).then(r => r.data),
  update: (id: number, data: Partial<Investment>) => api.put<Investment>(`/investments/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/investments/${id}`).then(r => r.data),
};

export const savingsApi = {
  list: () => api.get<SavingsGoal[]>("/savings").then(r => r.data),
  create: (data: Partial<SavingsGoal>) => api.post<SavingsGoal>("/savings", data).then(r => r.data),
  update: (id: number, data: Partial<SavingsGoal>) => api.put<SavingsGoal>(`/savings/${id}`, data).then(r => r.data),
  contribute: (id: number, amount: number) => api.post<SavingsGoal>(`/savings/${id}/contribute`, { amount }).then(r => r.data),
  delete: (id: number) => api.delete(`/savings/${id}`).then(r => r.data),
};

export const settingsApi = {
  get: () => api.get<Settings>("/settings").then(r => r.data),
  update: (data: Partial<Settings>) => api.put<Settings>("/settings", data).then(r => r.data),
};

export const dashboardApi = {
  summary: (year?: string, month?: string) =>
    api.get<DashboardSummary>("/dashboard/summary", { params: { year, month } }).then(r => r.data),
  trends: (months?: number) =>
    api.get<TrendPoint[]>("/dashboard/trends", { params: { months } }).then(r => r.data),
};
