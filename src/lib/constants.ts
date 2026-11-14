import { CategoryGoal, CategoryId, DebtGoal, ExpenseCategoryId, ExpenseCategoryMeta, ExpenseSourceAccount, PaymentMethod } from '../types';

export const DEFAULT_OFFICE_DEBT: DebtGoal = {
  id: 'office_debt',
  name: 'Office Debt Payoff',
  totalDebt: 720000, // 720,000 UGX
  paidAmount: 0,
  dailyMinimum: 2000, // at least 2,000 UGX/day
  creditorName: 'Office Space & Workspace Management',
  description: 'Paying off 720,000 UGX office debt with daily installments of at least 2,000 UGX.',
};

export const QUICK_DEBT_PAY_AMOUNTS = [2000, 3000, 5000, 10000, 20000, 50000];

export const DEFAULT_CATEGORIES: Record<CategoryId, CategoryGoal> = {
  home_rent: {
    id: 'home_rent',
    name: 'Home Rent',
    targetAmount: 130000,
    currentAmount: 0,
    color: 'orange',
    badgeBg: 'bg-orange-50 text-orange-600 border border-orange-200',
    badgeBorder: 'border-orange-200',
    progressBarColor: 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.35)]',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
    iconName: 'home',
    dueDay: 30,
    description: 'Monthly accommodation goal',
  },
  internet: {
    id: 'internet',
    name: 'Internet',
    targetAmount: 70000,
    currentAmount: 0,
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-600 border border-blue-200',
    badgeBorder: 'border-blue-200',
    progressBarColor: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.35)]',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-500',
    iconName: 'wifi',
    dueDay: 28,
    description: 'Data & connectivity fund',
  },
  work_rent: {
    id: 'work_rent',
    name: 'Work Rent',
    targetAmount: 100000,
    currentAmount: 0,
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    badgeBorder: 'border-emerald-200',
    progressBarColor: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
    iconName: 'briefcase',
    dueDay: 1,
    description: 'Office space commitment',
  },
};

export const QUICK_ADD_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export const NOTE_PRESETS = [
  'Daily change',
  'Mobile money stash',
  'Side gig earning',
  'Transport savings',
  'Client deposit',
  'Lunch surplus',
  'Daily target deposit',
];

export const EXPENSE_CATEGORIES: Record<ExpenseCategoryId, ExpenseCategoryMeta> = {
  food_dining: {
    id: 'food_dining',
    name: 'Food & Dining',
    iconName: 'UtensilsCrossed',
    color: 'amber',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-950/60',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    borderColor: 'border-amber-200 dark:border-amber-900/60',
  },
  transport_fuel: {
    id: 'transport_fuel',
    name: 'Transport & Boda',
    iconName: 'Bike',
    color: 'sky',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/60',
    textLight: 'text-sky-700',
    textDark: 'dark:text-sky-300',
    borderColor: 'border-sky-200 dark:border-sky-900/60',
  },
  utilities_bills: {
    id: 'utilities_bills',
    name: 'Utilities & Airtime',
    iconName: 'Zap',
    color: 'violet',
    bgLight: 'bg-violet-50',
    bgDark: 'dark:bg-violet-950/60',
    textLight: 'text-violet-700',
    textDark: 'dark:text-violet-300',
    borderColor: 'border-violet-200 dark:border-violet-900/60',
  },
  shopping_groceries: {
    id: 'shopping_groceries',
    name: 'Shopping & Groceries',
    iconName: 'ShoppingBag',
    color: 'emerald',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/60',
    textLight: 'text-emerald-700',
    textDark: 'dark:text-emerald-300',
    borderColor: 'border-emerald-200 dark:border-emerald-900/60',
  },
  health_medical: {
    id: 'health_medical',
    name: 'Health & Pharmacy',
    iconName: 'HeartPulse',
    color: 'rose',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/60',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    borderColor: 'border-rose-200 dark:border-rose-900/60',
  },
  leisure_personal: {
    id: 'leisure_personal',
    name: 'Leisure & Personal',
    iconName: 'Sparkles',
    color: 'fuchsia',
    bgLight: 'bg-fuchsia-50',
    bgDark: 'dark:bg-fuchsia-950/60',
    textLight: 'text-fuchsia-700',
    textDark: 'dark:text-fuchsia-300',
    borderColor: 'border-fuchsia-200 dark:border-fuchsia-900/60',
  },
  business_work: {
    id: 'business_work',
    name: 'Work & Supplies',
    iconName: 'Briefcase',
    color: 'indigo',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/60',
    textLight: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    borderColor: 'border-indigo-200 dark:border-indigo-900/60',
  },
  family_gifts: {
    id: 'family_gifts',
    name: 'Family & Support',
    iconName: 'Users',
    color: 'orange',
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/60',
    textLight: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-900/60',
  },
  other: {
    id: 'other',
    name: 'Other Expenses',
    iconName: 'MoreHorizontal',
    color: 'slate',
    bgLight: 'bg-slate-100',
    bgDark: 'dark:bg-slate-800',
    textLight: 'text-slate-700',
    textDark: 'dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-700',
  },
};

export const PAYMENT_METHODS: {
  id: PaymentMethod;
  name: string;
  shortName: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  accentDot: string;
}[] = [
  {
    id: 'cash',
    name: 'Cash',
    shortName: 'Cash',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    textColor: 'text-emerald-800 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-700/60',
    accentDot: 'bg-emerald-500',
  },
  {
    id: 'mtn_momo',
    name: 'MTN MoMo',
    shortName: 'MoMo',
    badgeBg: 'bg-amber-400/15 dark:bg-amber-400/20',
    textColor: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-700/60',
    accentDot: 'bg-amber-500',
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    shortName: 'Airtel',
    badgeBg: 'bg-rose-500/15 dark:bg-rose-500/20',
    textColor: 'text-rose-800 dark:text-rose-300',
    borderColor: 'border-rose-300 dark:border-rose-700/60',
    accentDot: 'bg-rose-600',
  },
  {
    id: 'bank_card',
    name: 'Bank / Card',
    shortName: 'Card',
    badgeBg: 'bg-blue-500/15 dark:bg-blue-500/20',
    textColor: 'text-blue-800 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-700/60',
    accentDot: 'bg-blue-500',
  },
  {
    id: 'other',
    name: 'Other',
    shortName: 'Other',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-300 dark:border-slate-700',
    accentDot: 'bg-slate-400',
  },
];

export const EXPENSE_SOURCE_ACCOUNTS: Record<
  ExpenseSourceAccount,
  {
    id: ExpenseSourceAccount;
    name: string;
    shortName: string;
    vaultCategoryId?: CategoryId;
    badgeBg: string;
    badgeDarkBg: string;
    textColor: string;
    textDarkColor: string;
    borderColor: string;
    borderDarkColor: string;
    accentDot: string;
    icon: 'home' | 'wifi' | 'briefcase' | 'wallet';
    description: string;
  }
> = {
  home_rent: {
    id: 'home_rent',
    name: 'Home Rent Fund',
    shortName: 'Home Rent',
    vaultCategoryId: 'home_rent',
    badgeBg: 'bg-orange-50',
    badgeDarkBg: 'dark:bg-orange-950/60',
    textColor: 'text-orange-700',
    textDarkColor: 'dark:text-orange-300',
    borderColor: 'border-orange-200',
    borderDarkColor: 'dark:border-orange-900/60',
    accentDot: 'bg-orange-500',
    icon: 'home',
    description: 'Deducted from Home Rent savings vault (130,000 UGX target)',
  },
  internet: {
    id: 'internet',
    name: 'Wifi / Internet Fund',
    shortName: 'Wifi / Net',
    vaultCategoryId: 'internet',
    badgeBg: 'bg-blue-50',
    badgeDarkBg: 'dark:bg-blue-950/60',
    textColor: 'text-blue-700',
    textDarkColor: 'dark:text-blue-300',
    borderColor: 'border-blue-200',
    borderDarkColor: 'dark:border-blue-900/60',
    accentDot: 'bg-blue-500',
    icon: 'wifi',
    description: 'Deducted from Wifi / Internet data bundle fund (70,000 UGX target)',
  },
  work_rent: {
    id: 'work_rent',
    name: 'Work Space Rent Fund',
    shortName: 'Work Rent',
    vaultCategoryId: 'work_rent',
    badgeBg: 'bg-emerald-50',
    badgeDarkBg: 'dark:bg-emerald-950/60',
    textColor: 'text-emerald-700',
    textDarkColor: 'dark:text-emerald-300',
    borderColor: 'border-emerald-200',
    borderDarkColor: 'dark:border-emerald-900/60',
    accentDot: 'bg-emerald-500',
    icon: 'briefcase',
    description: 'Deducted from Work Rent business vault (100,000 UGX target)',
  },
  general_wallet: {
    id: 'general_wallet',
    name: 'Daily Pocket / General',
    shortName: 'General Pocket',
    badgeBg: 'bg-slate-100',
    badgeDarkBg: 'dark:bg-slate-800',
    textColor: 'text-slate-700',
    textDarkColor: 'dark:text-slate-300',
    borderColor: 'border-slate-200',
    borderDarkColor: 'dark:border-slate-700',
    accentDot: 'bg-slate-400',
    icon: 'wallet',
    description: 'Out-of-pocket daily cash or direct business income',
  },
};

export const QUICK_EXPENSE_PRESETS = [
  { label: 'Boda ride', amount: 3000, category: 'transport_fuel' as ExpenseCategoryId },
  { label: 'Lunch / Rolex', amount: 7000, category: 'food_dining' as ExpenseCategoryId },
  { label: 'Airtime', amount: 5000, category: 'utilities_bills' as ExpenseCategoryId },
  { label: 'Groceries', amount: 15000, category: 'shopping_groceries' as ExpenseCategoryId },
  { label: 'Fuel top-up', amount: 30000, category: 'transport_fuel' as ExpenseCategoryId },
  { label: 'Yaka Power', amount: 20000, category: 'utilities_bills' as ExpenseCategoryId },
];

export function formatUGX(amount: number): string {
  const rounded = Math.round(amount || 0);
  return `${rounded.toLocaleString('en-US')} UGX`;
}

export function formatUGXShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M UGX`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k UGX`;
  }
  return `${amount} UGX`;
}

