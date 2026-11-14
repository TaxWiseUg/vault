import React, { useMemo, useState } from 'react';
import {
  Bike,
  Briefcase,
  CalendarDays,
  CircleDot,
  Download,
  Edit2,
  Gift,
  HeartPulse,
  Home,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Trash2,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type {
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
  formatUGX,
} from '../lib/constants';

interface ExpensesViewProps {
  expenses: ExpenseEntry[];
  totalSavedMonth: number;
  categories?: Record<CategoryId, CategoryGoal>;
  onOpenAddExpense: (category?: ExpenseCategoryId) => void;
  onOpenEditExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORY_ICON_MAP: Record<ExpenseCategoryId, React.ComponentType<LucideProps>> = {
  food_dining: UtensilsCrossed,
  transport_fuel: Bike,
  utilities_bills: Zap,
  shopping_groceries: ShoppingBag,
  health_medical: HeartPulse,
  leisure_personal: CircleDot,
  business_work: Briefcase,
  family_gifts: Gift,
  other: MoreHorizontal,
};

const ACCOUNT_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  home: Home,
  wifi: Wifi,
  briefcase: Briefcase,
  wallet: Wallet,
};

type TimeFilter = 'month' | 'today' | 'week' | 'all';

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  totalSavedMonth,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ExpenseCategoryId | 'all'>('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<ExpenseSourceAccount | 'all'>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];
  const monthLabel = now.toLocaleDateString('en', { month: 'long' });

  const filteredExpenses = useMemo(() => expenses.filter((item) => {
    if (timeFilter === 'month' && !item.date.startsWith(currentMonthPrefix)) return false;
    if (timeFilter === 'today' && item.date !== todayStr) return false;
    if (timeFilter === 'week') {
      const itemDate = new Date(item.date);
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      if (itemDate < weekAgo) return false;
    }

    const accountId = item.sourceAccount || 'general_wallet';
    if (selectedAccountFilter !== 'all' && accountId !== selectedAccountFilter) return false;
    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;
    if (selectedPaymentFilter !== 'all' && item.paymentMethod !== selectedPaymentFilter) return false;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const categoryName = EXPENSE_CATEGORIES[item.category]?.name.toLowerCase() || '';
    const accountName = EXPENSE_SOURCE_ACCOUNTS[accountId]?.name.toLowerCase() || '';
    const paymentName = PAYMENT_METHODS.find((method) => method.id === item.paymentMethod)?.name.toLowerCase() || '';
    return categoryName.includes(query) || accountName.includes(query) || paymentName.includes(query) ||
      (item.note || '').toLowerCase().includes(query) || item.amount.toString().includes(query);
  }), [
    expenses,
    timeFilter,
    currentMonthPrefix,
    todayStr,
    now,
    selectedAccountFilter,
    selectedCategoryFilter,
    selectedPaymentFilter,
    searchQuery,
  ]);

  const thisMonthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.startsWith(currentMonthPrefix)),
    [expenses, currentMonthPrefix],
  );
  const totalSpentThisMonth = useMemo(
    () => thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [thisMonthExpenses],
  );
  const todaySpent = useMemo(
    () => expenses.filter((expense) => expense.date === todayStr).reduce((sum, expense) => sum + expense.amount, 0),
    [expenses, todayStr],
  );
  const dailyAverageSpent = now.getDate() > 0 ? Math.round(totalSpentThisMonth / now.getDate()) : 0;
  const netCashflow = totalSavedMonth - totalSpentThisMonth;
  const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const accountStats = useMemo(() => {
    const totals: Record<ExpenseSourceAccount, { amount: number; count: number }> = {
      home_rent: { amount: 0, count: 0 },
      internet: { amount: 0, count: 0 },
      work_rent: { amount: 0, count: 0 },
      general_wallet: { amount: 0, count: 0 },
    };
    thisMonthExpenses.forEach((expense) => {
      const accountId = expense.sourceAccount || 'general_wallet';
      totals[accountId].amount += expense.amount;
      totals[accountId].count += 1;
    });
    return (Object.keys(EXPENSE_SOURCE_ACCOUNTS) as ExpenseSourceAccount[]).map((id) => ({
      id,
      meta: EXPENSE_SOURCE_ACCOUNTS[id],
      ...totals[id],
      percentage: totalSpentThisMonth > 0 ? (totals[id].amount / totalSpentThisMonth) * 100 : 0,
    }));
  }, [thisMonthExpenses, totalSpentThisMonth]);

  const categoryStats = useMemo(() => {
    const totals: Record<ExpenseCategoryId, { amount: number; count: number }> = {
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
    thisMonthExpenses.forEach((expense) => {
      totals[expense.category].amount += expense.amount;
      totals[expense.category].count += 1;
    });
    return Object.entries(totals)
      .map(([id, total]) => ({
        id: id as ExpenseCategoryId,
        meta: EXPENSE_CATEGORIES[id as ExpenseCategoryId],
        ...total,
        percentage: totalSpentThisMonth > 0 ? (total.amount / totalSpentThisMonth) * 100 : 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonthExpenses, totalSpentThisMonth]);

  const paymentStats = useMemo(() => {
    const totals: Record<PaymentMethod, number> = {
      mtn_momo: 0,
      airtel_money: 0,
      cash: 0,
      bank_card: 0,
      other: 0,
    };
    thisMonthExpenses.forEach((expense) => { totals[expense.paymentMethod] += expense.amount; });
    return PAYMENT_METHODS.map((method) => ({
      ...method,
      amount: totals[method.id],
      percentage: totalSpentThisMonth > 0 ? (totals[method.id] / totalSpentThisMonth) * 100 : 0,
    })).filter((method) => method.amount > 0);
  }, [thisMonthExpenses, totalSpentThisMonth]);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, ExpenseEntry[]> = {};
    filteredExpenses.forEach((expense) => {
      (groups[expense.date] ||= []).push(expense);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({
        date,
        totalForDay: groups[date].reduce((sum, item) => sum + item.amount, 0),
        items: groups[date].sort((a, b) => b.createdAt - a.createdAt),
      }));
  }, [filteredExpenses]);

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date', 'Category', 'Deducted From Account', 'Payment Method', 'Amount (UGX)', 'Vault Deducted', 'Note'];
    const rows = expenses.map((expense) => [
      expense.date,
      EXPENSE_CATEGORIES[expense.category]?.name || expense.category,
      EXPENSE_SOURCE_ACCOUNTS[expense.sourceAccount || 'general_wallet']?.name || 'General Wallet',
      PAYMENT_METHODS.find((method) => method.id === expense.paymentMethod)?.name || expense.paymentMethod,
      expense.amount,
      expense.deductFromVault ? 'Yes' : 'No',
      `"${(expense.note || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `vault_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = Boolean(
    searchQuery || timeFilter !== 'month' || selectedCategoryFilter !== 'all' ||
    selectedAccountFilter !== 'all' || selectedPaymentFilter !== 'all'
  );
  const clearFilters = () => {
    setSearchQuery('');
    setTimeFilter('month');
    setSelectedCategoryFilter('all');
    setSelectedAccountFilter('all');
    setSelectedPaymentFilter('all');
  };

  return (
    <div id="expenses-view-container" className="w-full space-y-5 px-4 pb-8 sm:px-6">
      <section aria-labelledby="expenses-title" className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="expenses-title" className="text-display font-semibold tracking-tight">Expenses</h2>
          <p className="mt-1 text-sm text-muted-foreground">See where your money went and which account covered it.</p>
        </div>
        <button
          id="open-record-expense-btn"
          type="button"
          onClick={() => onOpenAddExpense()}
          className="inline-flex min-h-11 items-center gap-2 rounded-surface bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.8} /> Record expense
        </button>
      </section>

      <section aria-label="Expense summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-surface border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Spent in {monthLabel}</h3>
            <TrendingDown aria-hidden="true" size={18} strokeWidth={1.8} className="text-destructive" />
          </div>
          <p className="mt-3 font-mono-num tabular-nums text-xl font-semibold text-destructive">{formatUGX(totalSpentThisMonth)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{thisMonthExpenses.length} records</p>
        </article>
        <article className="rounded-surface border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Spent today</h3>
            <CalendarDays aria-hidden="true" size={18} strokeWidth={1.8} className="text-muted-foreground" />
          </div>
          <p className="mt-3 font-mono-num tabular-nums text-xl font-semibold">{formatUGX(todaySpent)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Average {formatUGX(dailyAverageSpent)} per day this month</p>
        </article>
        <article className="rounded-surface border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Saved less spent</h3>
            {netCashflow >= 0
              ? <TrendingUp aria-hidden="true" size={18} strokeWidth={1.8} className="text-success" />
              : <TrendingDown aria-hidden="true" size={18} strokeWidth={1.8} className="text-destructive" />}
          </div>
          <p className={`mt-3 font-mono-num tabular-nums text-xl font-semibold ${netCashflow >= 0 ? 'text-success' : 'text-destructive'}`}>
            {netCashflow >= 0 ? '+' : '−'}{formatUGX(Math.abs(netCashflow))}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Savings less this month’s expenses</p>
        </article>
        <article className="rounded-surface border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Filtered records</h3>
            <Receipt aria-hidden="true" size={18} strokeWidth={1.8} className="text-muted-foreground" />
          </div>
          <p className="mt-3 font-mono-num tabular-nums text-xl font-semibold">{formatUGX(filteredTotal)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{filteredExpenses.length} matching expenses</p>
        </article>
      </section>

      {thisMonthExpenses.length > 0 && (
        <section aria-label="Monthly expense breakdowns" className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <article className="space-y-3 rounded-surface border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-semibold"><Wallet aria-hidden="true" size={18} strokeWidth={1.8} /> By account</h3>
              <span className="text-xs text-muted-foreground">{accountStats.filter((item) => item.amount > 0).length} active</span>
            </div>
            <ul className="space-y-3">
              {accountStats.map((item) => {
                const Icon = ACCOUNT_ICON_MAP[item.meta.icon] || Wallet;
                return (
                  <li key={item.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 font-medium"><Icon aria-hidden="true" size={16} strokeWidth={1.8} className="shrink-0 text-muted-foreground" /> <span className="truncate">{item.meta.name}</span></span>
                      <span className="shrink-0 text-right font-mono-num tabular-nums">{formatUGX(item.amount)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-muted">
                      <div className="h-full rounded-pill bg-primary" style={{ width: `${Math.min(100, item.percentage)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.count} records · {item.percentage.toFixed(0)}%</p>
                  </li>
                );
              })}
            </ul>
          </article>

          <article className="space-y-3 rounded-surface border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-semibold"><Receipt aria-hidden="true" size={18} strokeWidth={1.8} /> By category</h3>
              <span className="text-xs text-muted-foreground">{categoryStats.length} active</span>
            </div>
            {categoryStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No spending categories yet.</p>
            ) : (
              <ul className="space-y-3">
                {categoryStats.slice(0, 5).map((item) => {
                  const Icon = CATEGORY_ICON_MAP[item.id] || Receipt;
                  return (
                    <li key={item.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 font-medium"><Icon aria-hidden="true" size={16} strokeWidth={1.8} className="shrink-0 text-muted-foreground" /> <span className="truncate">{item.meta.name}</span></span>
                        <span className="shrink-0 text-right font-mono-num tabular-nums">{formatUGX(item.amount)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-muted">
                        <div className="h-full rounded-pill bg-primary transition-[width] duration-200" style={{ width: `${Math.min(100, item.percentage)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.percentage.toFixed(0)}% of total</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="space-y-3 rounded-surface border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
              <h3 className="flex items-center gap-2 text-base font-semibold"><Smartphone aria-hidden="true" size={18} strokeWidth={1.8} /> By payment method</h3>
            </div>
            {paymentStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment methods used this month.</p>
            ) : (
              <ul className="space-y-3">
                {paymentStats.map((method) => (
                  <li key={method.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{method.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{method.percentage.toFixed(0)}% of total</p>
                    </div>
                    <span className="text-right font-mono-num tabular-nums text-sm">{formatUGX(method.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      )}

      <section aria-label="Search and filter expenses" className="space-y-4 rounded-surface border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="expense-search-input" className="text-sm font-medium">Search expenses</label>
            <div className="relative">
              <Search aria-hidden="true" size={16} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -tranzinc-y-1/2 text-muted-foreground" />
              <input
                id="expense-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search note, account, category, amount, or payment method"
                className="min-h-11 w-full rounded-surface border border-input bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-time-filter" className="text-sm font-medium">Date range</label>
            <select id="expense-time-filter" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)} className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="month">This month</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-account-filter" className="text-sm font-medium">Account</label>
            <select id="expense-account-filter" value={selectedAccountFilter} onChange={(event) => setSelectedAccountFilter(event.target.value as ExpenseSourceAccount | 'all')} className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="all">All accounts</option>
              {(Object.keys(EXPENSE_SOURCE_ACCOUNTS) as ExpenseSourceAccount[]).map((id) => <option key={id} value={id}>{EXPENSE_SOURCE_ACCOUNTS[id].name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-category-filter" className="text-sm font-medium">Category</label>
            <select id="expense-category-filter" value={selectedCategoryFilter} onChange={(event) => setSelectedCategoryFilter(event.target.value as ExpenseCategoryId | 'all')} className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="all">All categories</option>
              {Object.values(EXPENSE_CATEGORIES).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-payment-filter" className="text-sm font-medium">Payment method</label>
            <select id="expense-payment-filter" value={selectedPaymentFilter} onChange={(event) => setSelectedPaymentFilter(event.target.value as PaymentMethod | 'all')} className="min-h-11 w-full rounded-surface border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="all">All payment methods</option>
              {PAYMENT_METHODS.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono-num tabular-nums">{filteredExpenses.length}</span> results ·{' '}
            <span className="font-mono-num tabular-nums font-semibold text-foreground">{formatUGX(filteredTotal)}</span>
          </p>
          <div className="flex items-center gap-2">
            {hasActiveFilters && <button type="button" onClick={clearFilters} className="min-h-11 rounded-surface px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button>}
            <button type="button" onClick={handleExportCSV} disabled={expenses.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title="Download all expenses as CSV">
              <Download aria-hidden="true" size={16} strokeWidth={1.8} /> Export CSV
            </button>
          </div>
        </div>
      </section>

      {groupedExpenses.length === 0 ? (
        <section className="rounded-surface border border-dashed border-border bg-card p-6" aria-live="polite">
          <div className="flex items-start gap-3">
            <Receipt aria-hidden="true" size={20} strokeWidth={1.8} className="mt-0.5 text-muted-foreground" />
            <div>
              <h3 className="text-base font-semibold">{hasActiveFilters ? 'No matching expenses' : 'No expenses recorded yet'}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveFilters ? 'Clear the filters to see more records.' : 'Record a payment to start organizing your spending.'}
              </p>
              {hasActiveFilters ? (
                <button type="button" onClick={clearFilters} className="mt-3 min-h-11 rounded-surface border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button>
              ) : (
                <button type="button" onClick={() => onOpenAddExpense()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-surface bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Plus aria-hidden="true" size={16} strokeWidth={1.8} /> Record expense
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-4">
          {groupedExpenses.map((group) => (
            <section key={group.date} aria-label={`Expenses for ${group.date}`} className="overflow-hidden rounded-surface border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold">
                  {group.date === todayStr ? 'Today' : new Date(group.date).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <span className="font-mono-num tabular-nums text-sm font-medium">{formatUGX(group.totalForDay)}</span>
              </div>
              <ul className="divide-y divide-border">
                {group.items.map((item) => {
                  const category = EXPENSE_CATEGORIES[item.category] || EXPENSE_CATEGORIES.other;
                  const Icon = CATEGORY_ICON_MAP[item.category] || Receipt;
                  const accountId = item.sourceAccount || 'general_wallet';
                  const account = EXPENSE_SOURCE_ACCOUNTS[accountId];
                  const AccountIcon = ACCOUNT_ICON_MAP[account.icon] || Wallet;
                  const payment = PAYMENT_METHODS.find((method) => method.id === item.paymentMethod) || PAYMENT_METHODS[0];
                  return (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-surface bg-muted text-foreground">
                          <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-semibold">{category.name}</h4>
                            <span className="inline-flex min-h-6 items-center gap-1 rounded-pill bg-muted px-2 text-xs text-foreground">
                              <AccountIcon aria-hidden="true" size={12} strokeWidth={1.8} /> {account.shortName}
                            </span>
                            <span className="inline-flex min-h-6 items-center rounded-pill border border-border px-2 text-xs text-muted-foreground">{payment.shortName}</span>
                            {item.deductFromVault && <span className="inline-flex min-h-6 items-center rounded-pill bg-warning/10 px-2 text-xs font-medium text-warning">Vault deducted</span>}
                          </div>
                          <p className="mt-1 break-words text-sm text-muted-foreground">{item.note || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                        <div className="sm:text-right">
                          <p className="font-mono-num tabular-nums text-base font-semibold text-destructive">−{formatUGX(item.amount)}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => onOpenEditExpense(item)} aria-label="Edit expense" title="Edit expense" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <Edit2 aria-hidden="true" size={16} strokeWidth={1.8} />
                          </button>
                          <button type="button" onClick={() => onDeleteExpense(item.id)} aria-label="Delete expense" title="Delete expense" className="inline-flex size-11 items-center justify-center rounded-surface text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
