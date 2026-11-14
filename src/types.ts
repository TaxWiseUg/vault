export type CategoryId = 'home_rent' | 'internet' | 'work_rent';

export type ExpenseSourceAccount = 'general_wallet' | CategoryId;

export type ExpenseCategoryId =
  | 'food_dining'
  | 'transport_fuel'
  | 'utilities_bills'
  | 'shopping_groceries'
  | 'health_medical'
  | 'leisure_personal'
  | 'business_work'
  | 'family_gifts'
  | 'other';

export type PaymentMethod =
  | 'mtn_momo'
  | 'airtel_money'
  | 'cash'
  | 'bank_card'
  | 'other';

export interface ExpenseCategoryMeta {
  id: ExpenseCategoryId;
  name: string;
  iconName: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  textDark: string;
  borderColor: string;
}

export interface ExpenseEntry {
  id: string;
  amount: number; // in UGX
  category: ExpenseCategoryId;
  sourceAccount?: ExpenseSourceAccount; // 'home_rent' | 'internet' | 'work_rent' | 'general_wallet'
  deductFromVault?: boolean; // If true, amount reduces the vault savings balance
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: number; // epoch ms
  userId?: string;
}

export interface CategoryGoal {
  id: CategoryId;
  name: string;
  targetAmount: number; // in UGX
  currentAmount: number; // in UGX
  color: string;
  badgeBg: string;
  badgeBorder: string;
  progressBarColor: string;
  gradientFrom: string;
  gradientTo: string;
  iconName: 'home' | 'wifi' | 'briefcase';
  dueDay: number; // e.g. 1st or 30th of month
  description: string;
  updatedAt?: string;
}

export interface SavingsEntry {
  id: string;
  categoryId: CategoryId;
  amount: number; // in UGX
  date: string; // YYYY-MM-DD
  note: string;
  createdAt: number; // epoch ms
  userId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface BudgetOverview {
  totalTarget: number;
  totalSaved: number;
  totalRemaining: number;
  overallPercentage: number;
  dailyAverageSaved: number;
  streakDays: number;
  daysLeftInMonth: number;
  requiredDailyRateTotal: number;
}

export interface AICoachResponse {
  headline: string;
  pacingAssessment: 'ahead' | 'on_track' | 'needs_attention' | 'critical';
  pacingSummary: string;
  categoryBreakdown: {
    categoryId: CategoryId;
    status: string;
    remaining: number;
    recommendedDailyUGX: number;
    tip: string;
  }[];
  quickMilestones: string[];
  smartMoneyTips: string[];
}

export interface DebtGoal {
  id: string;
  name: string;
  totalDebt: number; // e.g. 720000 UGX
  paidAmount: number; // accumulated paid sum
  dailyMinimum: number; // at least 2000 UGX
  creditorName?: string;
  description?: string;
  startDate?: string;
  updatedAt?: string;
}

export interface DebtPaymentEntry {
  id: string;
  amount: number; // in UGX
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  note: string;
  sourceAccount?: ExpenseSourceAccount;
  deductFromVault?: boolean;
  createdAt: number; // epoch ms
  userId?: string;
}

export type NotificationType = 'milestone' | 'daily_reminder' | 'streak' | 'pace_warning' | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  categoryId?: CategoryId;
  actionTab?: 'overview' | CategoryId | 'expenses' | 'debt' | 'history' | 'ai';
}

export interface NotificationPreferences {
  dailyReminder: boolean;
  reminderTime: string; // e.g. "20:00"
  milestones: boolean;
  streakAlerts: boolean;
  paceAlerts: boolean;
  browserNotifications: boolean;
}

