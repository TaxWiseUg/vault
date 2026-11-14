import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  TrendingDown,
  Calendar,
  Search,
  Filter,
  Download,
  UtensilsCrossed,
  Bike,
  Zap,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  Briefcase,
  Users,
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowDownRight,
  PieChart as PieChartIcon,
  CreditCard,
  Smartphone,
  Banknote,
  DollarSign,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Home,
  Wifi,
  Wallet,
  Sparkle,
} from 'lucide-react';
import {
  CategoryGoal,
  CategoryId,
  ExpenseCategoryId,
  ExpenseEntry,
  ExpenseSourceAccount,
  PaymentMethod,
} from '../types';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_SOURCE_ACCOUNTS,
  PAYMENT_METHODS,
  QUICK_EXPENSE_PRESETS,
  formatUGX,
  formatUGXShort,
} from '../lib/constants';

interface ExpensesViewProps {
  expenses: ExpenseEntry[];
  totalSavedMonth: number;
  categories?: Record<CategoryId, CategoryGoal>;
  onOpenAddExpense: (category?: ExpenseCategoryId) => void;
  onOpenEditExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORY_ICON_MAP: Record<ExpenseCategoryId, React.ComponentType<{ className?: string }>> = {
  food_dining: UtensilsCrossed,
  transport_fuel: Bike,
  utilities_bills: Zap,
  shopping_groceries: ShoppingBag,
  health_medical: HeartPulse,
  leisure_personal: Sparkles,
  business_work: Briefcase,
  family_gifts: Users,
  other: MoreHorizontal,
};

const ACCOUNT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  wifi: Wifi,
  briefcase: Briefcase,
  wallet: Wallet,
};

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  totalSavedMonth,
  categories,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ExpenseCategoryId | 'all'>('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<ExpenseSourceAccount | 'all'>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'month' | 'today' | 'week' | 'all'>('month');

  // Dates for current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${currentMonth}`;
  const todayStr = now.toISOString().split('T')[0];

  // Filtered expenses based on time and search
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Time filter
      if (timeFilter === 'month' && !item.date.startsWith(currentMonthPrefix)) {
        return false;
      }
      if (timeFilter === 'today' && item.date !== todayStr) {
        return false;
      }
      if (timeFilter === 'week') {
        const itemDate = new Date(item.date);
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (itemDate < weekAgo) return false;
      }

      // Account filter
      if (selectedAccountFilter !== 'all') {
        const acc = item.sourceAccount || 'general_wallet';
        if (acc !== selectedAccountFilter) return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
        return false;
      }

      // Payment method filter
      if (selectedPaymentFilter !== 'all' && item.paymentMethod !== selectedPaymentFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catName = EXPENSE_CATEGORIES[item.category]?.name.toLowerCase() || '';
        const accName = item.sourceAccount
          ? EXPENSE_SOURCE_ACCOUNTS[item.sourceAccount]?.name.toLowerCase()
          : '';
        const note = (item.note || '').toLowerCase();
        const amtStr = item.amount.toString();
        return catName.includes(q) || (accName && accName.includes(q)) || note.includes(q) || amtStr.includes(q);
      }

      return true;
    });
  }, [
    expenses,
    timeFilter,
    selectedAccountFilter,
    selectedCategoryFilter,
    selectedPaymentFilter,
    searchQuery,
    currentMonthPrefix,
    todayStr,
  ]);

  // Overall Stats
  const thisMonthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(currentMonthPrefix));
  }, [expenses, currentMonthPrefix]);

  const totalSpentThisMonth = useMemo(() => {
    return thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [thisMonthExpenses]);

  const todaySpent = useMemo(() => {
    return expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const dayOfMonth = now.getDate();
  const dailyAverageSpent = dayOfMonth > 0 ? Math.round(totalSpentThisMonth / dayOfMonth) : 0;

  // Account breakdown calculations
  const accountStats = useMemo(() => {
    const map: Record<ExpenseSourceAccount, { amount: number; count: number }> = {
      home_rent: { amount: 0, count: 0 },
      internet: { amount: 0, count: 0 },
      work_rent: { amount: 0, count: 0 },
      general_wallet: { amount: 0, count: 0 },
    };

    thisMonthExpenses.forEach((exp) => {
      const acc = exp.sourceAccount || 'general_wallet';
      if (map[acc]) {
        map[acc].amount += exp.amount;
        map[acc].count += 1;
      }
    });

    return (Object.keys(EXPENSE_SOURCE_ACCOUNTS) as ExpenseSourceAccount[])
      .map((accKey) => {
        const meta = EXPENSE_SOURCE_ACCOUNTS[accKey];
        const data = map[accKey];
        return {
          id: accKey,
          meta,
          amount: data.amount,
          count: data.count,
          percentage: totalSpentThisMonth > 0 ? (data.amount / totalSpentThisMonth) * 100 : 0,
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses, totalSpentThisMonth]);

  // Category breakdown calculations
  const categoryStats = useMemo(() => {
    const map: Record<ExpenseCategoryId, { amount: number; count: number }> = {
      food_dining: { amount: 0, count: 0 },
      transport_fuel: { amount: 0, count: 0 },
      utilities_bills: { amount: 0, count: 0 },
      shopping_groceries: { amount: 0, count: 0 },
      health_medical: { amount: 0, count: 0 },
      leisure_personal: { amount: 0, count: 0 },
      business_work: { amount: 0, count: 0 },
      family_gifts: { amount: 0, count: 0 },
      other: { amount: 0, count: 0 },
    };

    thisMonthExpenses.forEach((exp) => {
      if (map[exp.category]) {
        map[exp.category].amount += exp.amount;
        map[exp.category].count += 1;
      }
    });

    return Object.entries(map)
      .map(([id, data]) => ({
        id: id as ExpenseCategoryId,
        meta: EXPENSE_CATEGORIES[id as ExpenseCategoryId],
        amount: data.amount,
        count: data.count,
        percentage: totalSpentThisMonth > 0 ? (data.amount / totalSpentThisMonth) * 100 : 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses, totalSpentThisMonth]);

  // Payment method breakdown
  const paymentStats = useMemo(() => {
    const map: Record<PaymentMethod, number> = {
      mtn_momo: 0,
      airtel_money: 0,
      cash: 0,
      bank_card: 0,
      other: 0,
    };

    thisMonthExpenses.forEach((exp) => {
      map[exp.paymentMethod] = (map[exp.paymentMethod] || 0) + exp.amount;
    });

    return PAYMENT_METHODS.map((pm) => ({
      ...pm,
      amount: map[pm.id],
      percentage: totalSpentThisMonth > 0 ? (map[pm.id] / totalSpentThisMonth) * 100 : 0,
    })).filter((pm) => pm.amount > 0);
  }, [thisMonthExpenses, totalSpentThisMonth]);

  // Group filtered expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: { [date: string]: ExpenseEntry[] } = {};
    filteredExpenses.forEach((exp) => {
      if (!groups[exp.date]) {
        groups[exp.date] = [];
      }
      groups[exp.date].push(exp);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({
        date,
        totalForDay: groups[date].reduce((sum, item) => sum + item.amount, 0),
        items: groups[date].sort((a, b) => b.createdAt - a.createdAt),
      }));
  }, [filteredExpenses]);

  // Export to CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) return;

    const headers = ['Date', 'Category', 'Deducted From Account', 'Payment Method', 'Amount (UGX)', 'Vault Deducted', 'Note'];
    const rows = expenses.map((e) => [
      e.date,
      EXPENSE_CATEGORIES[e.category]?.name || e.category,
      EXPENSE_SOURCE_ACCOUNTS[e.sourceAccount || 'general_wallet']?.name || 'General Pocket',
      PAYMENT_METHODS.find((p) => p.id === e.paymentMethod)?.name || e.paymentMethod,
      e.amount,
      e.deductFromVault ? 'Yes' : 'No',
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vault_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const netCashflow = totalSavedMonth - totalSpentThisMonth;

  return (
    <div id="expenses-view-container" className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Top Banner & Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Spent Card */}
        <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Spent ({now.toLocaleString('default', { month: 'short' })})
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black font-mono-num text-rose-600 dark:text-rose-400 tracking-tight">
              {formatUGX(totalSpentThisMonth)}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
              {thisMonthExpenses.length} transactions logged this month
            </p>
          </div>
        </div>

        {/* Today's Spend */}
        <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Today's Spending
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black font-mono-num text-slate-900 dark:text-white tracking-tight">
              {formatUGX(todaySpent)}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
              Avg {formatUGX(dailyAverageSpent)} / day this month
            </p>
          </div>
        </div>

        {/* Savings vs Spending Balance */}
        <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Monthly Cashflow
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                netCashflow >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              {netCashflow >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl sm:text-3xl font-black font-mono-num tracking-tight ${
                netCashflow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {netCashflow >= 0 ? `+${formatUGX(netCashflow)}` : `-${formatUGX(Math.abs(netCashflow))}`}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
              Saved {formatUGXShort(totalSavedMonth)} vs Spent {formatUGXShort(totalSpentThisMonth)}
            </p>
          </div>
        </div>

        {/* Quick Action Box */}
        <div className="p-5 rounded-[28px] bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              New Expense
            </span>
            <Receipt className="w-5 h-5 text-rose-200" />
          </div>
          <div className="mt-3">
            <p className="text-xs text-rose-100 mb-3 font-medium">
              Record payments with home rent, wifi, or work rent accounts.
            </p>
            <button
              id="open-record-expense-btn"
              onClick={() => onOpenAddExpense()}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-rose-50 text-rose-700 font-black text-xs uppercase tracking-wider shadow active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics: Deducted Account Sources + Categories + Channels */}
      {thisMonthExpenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Deducted From Account Breakdown */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Deducted From Accounts
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {accountStats.length} active
              </span>
            </div>

            <div className="space-y-3">
              {(Object.keys(EXPENSE_SOURCE_ACCOUNTS) as ExpenseSourceAccount[]).map((accKey) => {
                const accMeta = EXPENSE_SOURCE_ACCOUNTS[accKey];
                const accStat = accountStats.find((s) => s.id === accKey);
                const AccIcon = ACCOUNT_ICON_MAP[accMeta.icon] || Wallet;
                const amt = accStat ? accStat.amount : 0;
                const pct = accStat ? accStat.percentage : 0;

                return (
                  <div
                    key={accKey}
                    className={`p-3 rounded-2xl border transition-all ${
                      amt > 0
                        ? `${accMeta.badgeBg} ${accMeta.badgeDarkBg} ${accMeta.borderColor} ${accMeta.borderDarkColor}`
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl ${accMeta.badgeBg} ${accMeta.textColor} flex items-center justify-center`}>
                          <AccIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {accMeta.shortName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {accStat ? `${accStat.count} transactions` : 'No spend this month'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {formatUGX(amt)}
                        </div>
                        {amt > 0 && (
                          <div className="text-[10px] text-slate-500 font-bold">
                            {pct.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spend by Category */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <PieChartIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Spending Categories
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {categoryStats.length} active
              </span>
            </div>

            <div className="space-y-3">
              {categoryStats.slice(0, 4).map((item) => {
                const IconComp = CATEGORY_ICON_MAP[item.id] || Receipt;
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-lg ${item.meta.bgLight} ${item.meta.bgDark} ${item.meta.textLight} ${item.meta.textDark} flex items-center justify-center`}
                        >
                          <IconComp className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.meta.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatUGX(item.amount)}
                        </span>
                        <span className="text-[11px] text-slate-400 w-8 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method Channels */}
          <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Payment Channels</h4>
              </div>
            </div>

            <div className="space-y-3">
              {paymentStats.map((pm) => (
                <div
                  key={pm.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${pm.accentDot}`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {pm.name}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatUGX(pm.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {pm.percentage.toFixed(0)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Header */}
      <div className="p-5 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="expense-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by note, account, category or amount..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
            />
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(
              [
                { id: 'month', label: 'This Month' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: '7 Days' },
                { id: 'all', label: 'All Time' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeFilter === t.id
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          {expenses.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              title="Download expense history as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {/* Account Filter Row */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Filter by Account / Fund
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedAccountFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedAccountFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Accounts
            </button>

            {(Object.keys(EXPENSE_SOURCE_ACCOUNTS) as ExpenseSourceAccount[]).map((accKey) => {
              const accMeta = EXPENSE_SOURCE_ACCOUNTS[accKey];
              const isSelected = selectedAccountFilter === accKey;
              const AccIcon = ACCOUNT_ICON_MAP[accMeta.icon] || Wallet;

              return (
                <button
                  key={accKey}
                  onClick={() => setSelectedAccountFilter(accKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-sm'
                      : `${accMeta.badgeBg} ${accMeta.textColor} hover:opacity-80 border ${accMeta.borderColor}`
                  }`}
                >
                  <AccIcon className="w-3 h-3" />
                  <span>{accMeta.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Filter by Category
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>

            {Object.values(EXPENSE_CATEGORIES).map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expense Ledger Feed */}
      <div className="space-y-4">
        {groupedExpenses.length === 0 ? (
          <div className="p-12 text-center rounded-[32px] bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Receipt className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto space-y-1.5">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {searchQuery || selectedCategoryFilter !== 'all' || selectedAccountFilter !== 'all'
                  ? 'No matching expenses found'
                  : 'No expenses recorded yet'}
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {searchQuery || selectedCategoryFilter !== 'all' || selectedAccountFilter !== 'all'
                  ? 'Try clearing your search query or filters to see more entries.'
                  : 'Start tracking your daily expenses and which accounts (Home Rent, Wifi, Work Rent, or Pocket) they are deducted from.'}
              </p>
            </div>
            <button
              onClick={() => onOpenAddExpense()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Record First Expense</span>
            </button>
          </div>
        ) : (
          groupedExpenses.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center justify-between px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>
                  {group.date === todayStr
                    ? 'Today'
                    : new Date(group.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  Total: {formatUGX(group.totalForDay)}
                </span>
              </div>

              {/* Transactions in Date */}
              <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden transition-colors">
                {group.items.map((item) => {
                  const catMeta = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
                  const IconComp = CATEGORY_ICON_MAP[item.category] || Receipt;
                  const pm = PAYMENT_METHODS.find((p) => p.id === item.paymentMethod) || PAYMENT_METHODS[0];
                  const accMeta = EXPENSE_SOURCE_ACCOUNTS[item.sourceAccount || 'general_wallet'];
                  const AccIcon = ACCOUNT_ICON_MAP[accMeta.icon] || Wallet;

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-2xl ${catMeta.bgLight} ${catMeta.bgDark} ${catMeta.textLight} ${catMeta.textDark} flex items-center justify-center shrink-0 shadow-inner`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {catMeta.name}
                            </span>

                            {/* Account Badge */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${accMeta.badgeBg} ${accMeta.badgeDarkBg} ${accMeta.textColor} ${accMeta.textDarkColor} border ${accMeta.borderColor} ${accMeta.borderDarkColor}`}
                            >
                              <AccIcon className="w-2.5 h-2.5" />
                              <span>{accMeta.shortName}</span>
                            </span>

                            {/* Payment Channel Badge */}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${pm.badgeBg} ${pm.textColor} border ${pm.borderColor}`}
                            >
                              {pm.shortName}
                            </span>

                            {/* Vault deduction tag */}
                            {item.deductFromVault && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                Vault Deducted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.note || 'No description'}
                          </p>
                        </div>
                      </div>

                      {/* Right amount & actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black font-mono-num text-rose-600 dark:text-rose-400">
                            -{formatUGX(item.amount)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onOpenEditExpense(item)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(item.id)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
