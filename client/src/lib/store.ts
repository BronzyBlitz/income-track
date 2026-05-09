// Income Track – Core Data Store
// Uses localStorage for persistence, per-user data isolation

export type PackageTier = 'BASIC' | 'DIAMOND' | 'PREMIUM' | 'GOLD' | 'MASTER';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // hashed in real app, plain for mock
  package: PackageTier;
  currency: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'revenue';
  category: string;
  amount: number;
  description: string;
  date: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | null;
  tags?: string[];
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: 'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'mutual_funds' | 'savings' | 'other';
  amount: number;
  currentValue: number;
  expectedReturn: number; // percentage
  startDate: string;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  notes?: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: string; // YYYY-MM
}

export interface AppSession {
  userId: string;
  username: string;
  package: PackageTier;
  currency: string;
  loginTime: string;
}

// ============ PACKAGE FEATURE GATES ============

export const PACKAGE_LIMITS: Record<PackageTier, {
  label: string;
  icon: string;
  color: string;
  transactionLimit: number;
  features: string[];
  price: number;
}> = {
  BASIC: {
    label: 'Basic',
    icon: 'fa-seedling',
    color: '#9ca3af',
    transactionLimit: 5,
    price: 0,
    features: ['income_tracking', 'expense_tracking'],
  },
  DIAMOND: {
    label: 'Diamond',
    icon: 'fa-gem',
    color: '#63b3ed',
    transactionLimit: 50,
    price: 499,
    features: ['income_tracking', 'expense_tracking', 'investments', 'tax_calculator'],
  },
  PREMIUM: {
    label: 'Premium',
    icon: 'fa-crown',
    color: '#a78bfa',
    transactionLimit: 200,
    price: 999,
    features: ['income_tracking', 'expense_tracking', 'investments', 'tax_calculator', 'analytics', 'export_csv', 'budget_alerts'],
  },
  GOLD: {
    label: 'Gold',
    icon: 'fa-star',
    color: '#fbbf24',
    transactionLimit: 500,
    price: 1999,
    features: ['income_tracking', 'expense_tracking', 'investments', 'tax_calculator', 'analytics', 'export_csv', 'budget_alerts', 'recurring', 'multi_currency'],
  },
  MASTER: {
    label: 'Master',
    icon: 'fa-bolt',
    color: '#25D366',
    transactionLimit: Infinity,
    price: 4999,
    features: ['income_tracking', 'expense_tracking', 'investments', 'tax_calculator', 'analytics', 'export_csv', 'budget_alerts', 'recurring', 'multi_currency', 'mpesa_sync', 'ai_tips'],
  },
};

export function hasFeature(pkg: PackageTier, feature: string): boolean {
  return PACKAGE_LIMITS[pkg].features.includes(feature);
}

// ============ STORAGE HELPERS ============

const USERS_KEY = 'it_users';
const SESSION_KEY = 'it_session';
const TRANSACTIONS_KEY = (uid: string) => `it_tx_${uid}`;
const INVESTMENTS_KEY = (uid: string) => `it_inv_${uid}`;
const BUDGETS_KEY = (uid: string) => `it_budget_${uid}`;
const SAVINGS_KEY = (uid: string) => `it_savings_${uid}`;

function getUsers(): User[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): AppSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}
export function saveSession(session: AppSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getTransactions(userId: string): Transaction[] {
  try { return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY(userId)) || '[]'); } catch { return []; }
}
export function saveTransactions(userId: string, txs: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY(userId), JSON.stringify(txs));
}

export function getInvestments(userId: string): Investment[] {
  try { return JSON.parse(localStorage.getItem(INVESTMENTS_KEY(userId)) || '[]'); } catch { return []; }
}
export function saveInvestments(userId: string, invs: Investment[]) {
  localStorage.setItem(INVESTMENTS_KEY(userId), JSON.stringify(invs));
}

export function getBudgets(userId: string): Budget[] {
  try { return JSON.parse(localStorage.getItem(BUDGETS_KEY(userId)) || '[]'); } catch { return []; }
}
export function saveBudgets(userId: string, budgets: Budget[]) {
  localStorage.setItem(BUDGETS_KEY(userId), JSON.stringify(budgets));
}

export function getSavingsGoals(userId: string): SavingsGoal[] {
  try { return JSON.parse(localStorage.getItem(SAVINGS_KEY(userId)) || '[]'); } catch { return []; }
}
export function saveSavingsGoals(userId: string, goals: SavingsGoal[]) {
  localStorage.setItem(SAVINGS_KEY(userId), JSON.stringify(goals));
}

// ============ AUTH ============

export function signUp(username: string, email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  if (users.find(u => u.email === email)) return { success: false, error: 'Email already registered.' };
  if (users.find(u => u.username === username)) return { success: false, error: 'Username taken.' };
  const user: User = {
    id: `u_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    username, email, password,
    package: 'BASIC',
    currency: 'KES',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return { success: true, user };
}

export function login(emailOrUsername: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  const user = users.find(u => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password);
  if (!user) return { success: false, error: 'Invalid credentials.' };
  return { success: true, user };
}

export function updateUserPackage(userId: string, pkg: PackageTier) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx >= 0) {
    users[idx].package = pkg;
    saveUsers(users);
    const session = getSession();
    if (session && session.userId === userId) {
      session.package = pkg;
      saveSession(session);
    }
  }
}

export function getUserById(userId: string): User | null {
  return getUsers().find(u => u.id === userId) || null;
}

// ============ DEMO DATA SEEDER ============

export function seedDemoData(userId: string) {
  const now = new Date();
  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
  
  const transactions: Transaction[] = [
    // May 2026
    { id: 't1', userId, type: 'income', category: 'Salary', amount: 85000, description: 'Monthly Salary – May', date: '2026-05-01', recurring: 'monthly' },
    { id: 't2', userId, type: 'income', category: 'Freelance', amount: 25000, description: 'Web Design Project', date: '2026-05-03' },
    { id: 't3', userId, type: 'expense', category: 'Rent', amount: 18000, description: 'House Rent – May', date: '2026-05-02', recurring: 'monthly' },
    { id: 't4', userId, type: 'expense', category: 'Food & Groceries', amount: 8500, description: 'Naivas Supermarket', date: '2026-05-04' },
    { id: 't5', userId, type: 'expense', category: 'Transport', amount: 3200, description: 'Uber & Matatu', date: '2026-05-05' },
    { id: 't6', userId, type: 'expense', category: 'Utilities', amount: 2800, description: 'KPLC + Water', date: '2026-05-06' },
    { id: 't7', userId, type: 'revenue', category: 'Business', amount: 42000, description: 'Client Invoice – TechCorp', date: '2026-05-07' },
    { id: 't8', userId, type: 'expense', category: 'Entertainment', amount: 1500, description: 'Netflix + Spotify', date: '2026-05-08' },
    { id: 't9', userId, type: 'expense', category: 'Health', amount: 4200, description: 'Pharmacy & Clinic', date: '2026-05-09' },
    // April 2026
    { id: 't10', userId, type: 'income', category: 'Salary', amount: 85000, description: 'Monthly Salary – April', date: '2026-04-01', recurring: 'monthly' },
    { id: 't11', userId, type: 'income', category: 'Dividends', amount: 12000, description: 'Safaricom Dividends', date: '2026-04-15' },
    { id: 't12', userId, type: 'expense', category: 'Rent', amount: 18000, description: 'House Rent – April', date: '2026-04-02' },
    { id: 't13', userId, type: 'expense', category: 'Food & Groceries', amount: 9200, description: 'Carrefour + Quickmart', date: '2026-04-10' },
    { id: 't14', userId, type: 'expense', category: 'Education', amount: 15000, description: 'Online Course – Coursera', date: '2026-04-20' },
    { id: 't15', userId, type: 'revenue', category: 'Business', amount: 38000, description: 'Consulting Fee', date: '2026-04-25' },
    // March 2026
    { id: 't16', userId, type: 'income', category: 'Salary', amount: 85000, description: 'Monthly Salary – March', date: '2026-03-01', recurring: 'monthly' },
    { id: 't17', userId, type: 'expense', category: 'Rent', amount: 18000, description: 'House Rent – March', date: '2026-03-02' },
    { id: 't18', userId, type: 'expense', category: 'Food & Groceries', amount: 7800, description: 'Weekly Groceries', date: '2026-03-08' },
    { id: 't19', userId, type: 'income', category: 'Freelance', amount: 18000, description: 'Logo Design', date: '2026-03-15' },
    { id: 't20', userId, type: 'expense', category: 'Clothing', amount: 6500, description: 'Clothes & Shoes', date: '2026-03-20' },
  ];

  const investments: Investment[] = [
    { id: 'i1', userId, name: 'Safaricom PLC', type: 'stocks', amount: 50000, currentValue: 58500, expectedReturn: 12, startDate: '2025-01-15', notes: 'NSE listed, long-term hold' },
    { id: 'i2', userId, name: 'Treasury Bonds', type: 'bonds', amount: 100000, currentValue: 107200, expectedReturn: 13.5, startDate: '2025-06-01', notes: '2-year government bond' },
    { id: 'i3', userId, name: 'Kilimani Apartment', type: 'real_estate', amount: 3500000, currentValue: 3850000, expectedReturn: 8, startDate: '2024-03-01', notes: 'Rental income KES 25k/month' },
    { id: 'i4', userId, name: 'Bitcoin', type: 'crypto', amount: 25000, currentValue: 31200, expectedReturn: 0, startDate: '2025-11-01', notes: 'High risk, long-term' },
    { id: 'i5', userId, name: 'CIC Money Market', type: 'mutual_funds', amount: 75000, currentValue: 79800, expectedReturn: 10.5, startDate: '2025-04-01', notes: 'Low risk, liquid' },
  ];

  const budgets: Budget[] = [
    { id: 'b1', userId, category: 'Food & Groceries', limit: 10000, month: '2026-05' },
    { id: 'b2', userId, category: 'Transport', limit: 5000, month: '2026-05' },
    { id: 'b3', userId, category: 'Entertainment', limit: 3000, month: '2026-05' },
    { id: 'b4', userId, category: 'Health', limit: 5000, month: '2026-05' },
    { id: 'b5', userId, category: 'Utilities', limit: 4000, month: '2026-05' },
  ];

  const savingsGoals: SavingsGoal[] = [
    { id: 'sg1', userId, name: 'Emergency Fund', targetAmount: 300000, currentAmount: 180000, deadline: '2026-12-31', icon: 'fa-shield-halved', color: '#25D366', notes: '6 months expenses' },
    { id: 'sg2', userId, name: 'New Car', targetAmount: 1500000, currentAmount: 425000, deadline: '2027-06-30', icon: 'fa-car', color: '#63b3ed', notes: 'Toyota Corolla' },
    { id: 'sg3', userId, name: 'Vacation – Maldives', targetAmount: 250000, currentAmount: 95000, deadline: '2026-12-01', icon: 'fa-plane', color: '#fbbf24', notes: 'Family holiday' },
    { id: 'sg4', userId, name: 'Home Down Payment', targetAmount: 2000000, currentAmount: 650000, deadline: '2028-01-01', icon: 'fa-house', color: '#a78bfa', notes: 'Kilimani area' },
    { id: 'sg5', userId, name: 'MacBook Pro', targetAmount: 180000, currentAmount: 180000, deadline: '2026-03-01', icon: 'fa-laptop', color: '#34d399', notes: 'M3 Max chip' },
  ];

  saveTransactions(userId, transactions);
  saveInvestments(userId, investments);
  saveBudgets(userId, budgets);
  saveSavingsGoals(userId, savingsGoals);
}

// ============ GUEST USER ============

export const GUEST_USER: User = {
  id: 'guest',
  username: 'Guest',
  email: 'guest@incometrack.app',
  password: '',
  package: 'MASTER',
  currency: 'KES',
  createdAt: new Date().toISOString(),
};

export function loginAsGuest(): AppSession {
  seedDemoData('guest');
  const session: AppSession = {
    userId: 'guest',
    username: 'Guest',
    package: 'MASTER',
    currency: 'KES',
    loginTime: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}

// ============ ANALYTICS HELPERS ============

export function calcStats(transactions: Transaction[], currency: string = 'KES') {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const revenue = transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIn = income + revenue;
  const netProfit = totalIn - expenses;
  const savingsRate = totalIn > 0 ? ((netProfit / totalIn) * 100) : 0;
  const expenseRatio = totalIn > 0 ? ((expenses / totalIn) * 100) : 0;
  return { income, revenue, expenses, totalIn, netProfit, savingsRate, expenseRatio };
}

export function calcTax(totalIncome: number, rate: number = 15): number {
  return totalIncome * (rate / 100);
}

export function calcInvestmentROI(investments: Investment[]): number {
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);
  if (totalInvested === 0) return 0;
  return ((totalCurrent - totalInvested) / totalInvested) * 100;
}

export const EXPENSE_CATEGORIES = [
  'Rent', 'Food & Groceries', 'Transport', 'Utilities', 'Health',
  'Education', 'Entertainment', 'Clothing', 'Insurance', 'Savings',
  'Loan Repayment', 'Business', 'Travel', 'Personal Care', 'Other'
];

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Dividends', 'Rental Income',
  'Investment Returns', 'Side Hustle', 'Bonus', 'Gift', 'Other'
];

export const CURRENCIES = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
];

export function formatCurrency(amount: number, currency: string = 'KES'): string {
  const cur = CURRENCIES.find(c => c.code === currency);
  const symbol = cur?.symbol || currency;
  return `${symbol} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}
