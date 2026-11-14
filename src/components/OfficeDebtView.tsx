import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Landmark,
  Calendar,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Plus,
  Flame,
  Zap,
  Clock,
  Edit3,
  Trash2,
  Sliders,
  Receipt,
  Wallet,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  RefreshCw,
  Copy,
  Info,
  CalendarCheck,
  BarChart3,
  Layers,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DebtGoal,
  DebtPaymentEntry,
  PaymentMethod,
  ExpenseSourceAccount,
  CategoryId,
  CategoryGoal,
} from '../types';
import { formatUGX, PAYMENT_METHODS, EXPENSE_SOURCE_ACCOUNTS, QUICK_DEBT_PAY_AMOUNTS } from '../lib/constants';

interface OfficeDebtViewProps {
  debt: DebtGoal;
  payments: DebtPaymentEntry[];
  categories: Record<CategoryId, CategoryGoal>;
  onAddPayment: (payment: Omit<DebtPaymentEntry, 'id'>) => Promise<void>;
  onUpdatePayment: (updatedPayment: DebtPaymentEntry, oldPayment: DebtPaymentEntry) => Promise<void>;
  onDeletePayment: (payment: DebtPaymentEntry) => Promise<void>;
  onUpdateDebtConfig: (updatedDebt: Partial<DebtGoal>) => Promise<void>;
  onResetDebtProgress: () => Promise<void>;
}

export const OfficeDebtView: React.FC<OfficeDebtViewProps> = ({
  debt,
  payments,
  categories,
  onAddPayment,
  onUpdatePayment,
  onDeletePayment,
  onUpdateDebtConfig,
  onResetDebtProgress,
}) => {
  // Local states for quick pay form (Default payment channel is CASH)
  const [quickAmount, setQuickAmount] = useState<string>('2000');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Edit payment modal state
  const [editingPayment, setEditingPayment] = useState<DebtPaymentEntry | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('cash');
  const [editNote, setEditNote] = useState<string>('');

  // Settings modal state
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [configTotal, setConfigTotal] = useState<string>(debt.totalDebt.toString());
  const [configDailyMin, setConfigDailyMin] = useState<string>(debt.dailyMinimum.toString());
  const [configCreditor, setConfigCreditor] = useState<string>(debt.creditorName || '');

  // Delete confirm state
  const [paymentToDelete, setPaymentToDelete] = useState<DebtPaymentEntry | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Dynamic Payoff Speed Calculator interactive pace selection
  const [calculatorMode, setCalculatorMode] = useState<'pattern' | 'custom'>('pattern');
  const [customPace, setCustomPace] = useState<number>(4000);

  // Collapsible groups state for transaction history
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const reduceMotion = useReducedMotion();

  // Calculation metrics
  const totalDebt = debt.totalDebt || 720000;
  const totalPaid = debt.paidAmount || 0;
  const remaining = Math.max(0, totalDebt - totalPaid);
  const progressPct = Math.min(100, Math.round((totalPaid / (totalDebt || 1)) * 100));
  const isFullyPaid = remaining <= 0;
  const dailyMin = debt.dailyMinimum || 2000;

  // Today's payment metrics
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayPaidSum = useMemo(() => {
    return payments
      .filter((p) => p.date === todayStr)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, todayStr]);

  const isTodayCompleted = todayPaidSum >= dailyMin;

  // Daily streak calculation (consecutive days with at least dailyMin paid)
  const streakDays = useMemo(() => {
    if (payments.length === 0) return 0;
    
    // Group payments by date
    const dateMap: Record<string, number> = {};
    payments.forEach((p) => {
      dateMap[p.date] = (dateMap[p.date] || 0) + p.amount;
    });

    let streak = 0;
    const now = new Date();
    
    // Check backwards day by day
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const sum = dateMap[dateKey] || 0;

      if (i === 0 && sum < dailyMin) {
        // Today hasn't met the quota yet, don't break streak if yesterday was good
        continue;
      }

      if (sum >= dailyMin) {
        streak++;
      } else {
        // Streak broken
        break;
      }
    }
    return streak;
  }, [payments, dailyMin]);

  // User's historical payment pattern analysis
  const patternAnalysis = useMemo(() => {
    if (payments.length === 0) {
      return {
        hasHistory: false,
        dailyPace: dailyMin,
        avgPerDeposit: 0,
        totalDepositCount: 0,
        recent7DaysPace: 0,
        recent30DaysPace: 0,
        allTimeDailyPace: 0,
        daysActive: 0,
        paceLabel: 'Daily Target Minimum',
        paceDescription: `No deposits logged yet. Based on ${formatUGX(dailyMin)}/day minimum target.`,
      };
    }

    const now = new Date();
    // Sort payments chronologically to find first activity
    const sorted = [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDateParts = sorted[0].date.split('-').map(Number);
    const firstDate = new Date(firstDateParts[0], (firstDateParts[1] || 1) - 1, firstDateParts[2] || 1);
    const daysActive = Math.max(1, Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));

    const sumPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const avgPerDeposit = Math.round(sumPaid / payments.length);
    const allTimeDailyPace = Math.round(sumPaid / daysActive);

    // Recent 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const last7Payments = payments.filter((p) => p.date >= sevenDaysAgoStr);
    const last7Total = last7Payments.reduce((acc, p) => acc + p.amount, 0);
    const recent7DaysPace = Math.round(last7Total / 7);

    // Recent 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const last30Payments = payments.filter((p) => p.date >= thirtyDaysAgoStr);
    const last30Total = last30Payments.reduce((acc, p) => acc + p.amount, 0);
    const recent30DaysPace = Math.round(last30Total / 30);

    // Determine the representative daily deposit velocity
    let repPace = dailyMin;
    let paceLabel = 'Your Historical Deposit Pattern';
    let paceDescription = '';

    if (recent7DaysPace > 0) {
      repPace = recent7DaysPace;
      paceLabel = 'Past 7-Day Deposit Pattern';
      paceDescription = `Averaging ${formatUGX(recent7DaysPace)}/day over the last 7 days (${formatUGX(last7Total)} deposited across ${last7Payments.length} payments).`;
    } else if (recent30DaysPace > 0) {
      repPace = recent30DaysPace;
      paceLabel = 'Past 30-Day Deposit Pattern';
      paceDescription = `Averaging ${formatUGX(recent30DaysPace)}/day over the last 30 days (${formatUGX(last30Total)} deposited).`;
    } else if (allTimeDailyPace > 0) {
      repPace = allTimeDailyPace;
      paceLabel = 'All-Time Deposit Pattern';
      paceDescription = `Averaging ${formatUGX(allTimeDailyPace)}/day across ${daysActive} days of activity (${payments.length} deposits totaling ${formatUGX(sumPaid)}).`;
    } else {
      repPace = dailyMin;
      paceLabel = 'Minimum Required Target';
      paceDescription = `Based on mandatory daily target of ${formatUGX(dailyMin)}/day.`;
    }

    return {
      hasHistory: true,
      dailyPace: Math.max(500, repPace),
      avgPerDeposit,
      totalDepositCount: payments.length,
      recent7DaysPace,
      recent30DaysPace,
      allTimeDailyPace,
      daysActive,
      paceLabel,
      paceDescription,
    };
  }, [payments, dailyMin]);

  // Selected active velocity for calculator
  const activeDailyVelocity = useMemo(() => {
    return calculatorMode === 'custom' ? Math.max(500, customPace) : patternAnalysis.dailyPace;
  }, [calculatorMode, patternAnalysis.dailyPace, dailyMin, customPace]);

  // Helper to format remaining duration dynamically into years, months, and days
  const formatPayoffDuration = (dailyVelocity: number, remainingBalance: number) => {
    if (remainingBalance <= 0) {
      return {
        totalDays: 0,
        years: 0,
        months: 0,
        days: 0,
        displayBadge: 'Debt Free! ',
        breakdownText: '0 days — debt fully cleared',
        finishDate: 'Completed',
      };
    }

    const effectiveVelocity = Math.max(100, dailyVelocity);
    const totalDays = Math.ceil(remainingBalance / effectiveVelocity);

    const years = Math.floor(totalDays / 365);
    const remainderAfterYears = totalDays % 365;
    const months = Math.floor(remainderAfterYears / 30);
    const days = Math.round(remainderAfterYears % 30);

    const finishDate = new Date();
    finishDate.setDate(finishDate.getDate() + totalDays);
    const finishDateStr = finishDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const detailedParts: string[] = [];
    if (years > 0) detailedParts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
    if (months > 0) detailedParts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
    if (days > 0 || detailedParts.length === 0) {
      detailedParts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }

    let breakdownText = detailedParts.join(', ');
    if (detailedParts.length === 2) {
      breakdownText = `${detailedParts[0]} and ${detailedParts[1]}`;
    } else if (detailedParts.length === 3) {
      breakdownText = `${detailedParts[0]}, ${detailedParts[1]}, and ${detailedParts[2]}`;
    }

    const shortParts: string[] = [];
    if (years > 0) shortParts.push(`${years}y`);
    if (months > 0) shortParts.push(`${months}m`);
    if (days > 0 || shortParts.length === 0) shortParts.push(`${days}d`);

    return {
      totalDays,
      years,
      months,
      days,
      displayBadge: shortParts.join(' '),
      breakdownText,
      finishDate: finishDateStr,
    };
  };

  const currentPayoffEstimate = useMemo(() => {
    return formatPayoffDuration(activeDailyVelocity, remaining);
  }, [activeDailyVelocity, remaining]);

  // Estimated payoff target date at daily minimum pace for summary
  const estimatedPayoffDate = currentPayoffEstimate.finishDate;

  // Grouped transaction history (Today, Yesterday, This Week, Last Week, Earlier This Month, Last Month, Older)
  const groupedPayments = useMemo(() => {
    if (payments.length === 0) return [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yDate = new Date(now);
    yDate.setDate(now.getDate() - 1);
    const yesterdayStr = yDate.toISOString().split('T')[0];

    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const prevMonthDate = new Date(curYear, curMonth - 1, 1);
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    // Sort newest first
    const sorted = [...payments].sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const groups: Record<
      string,
      {
        key: string;
        title: string;
        subtitle: string;
        order: number;
        payments: DebtPaymentEntry[];
      }
    > = {
      today: { key: 'today', title: 'Today', subtitle: todayStr, order: 1, payments: [] },
      yesterday: { key: 'yesterday', title: 'Yesterday', subtitle: yesterdayStr, order: 2, payments: [] },
      this_week: { key: 'this_week', title: 'This Week', subtitle: 'Past 7 days', order: 3, payments: [] },
      last_week: { key: 'last_week', title: 'Last Week', subtitle: '7 to 14 days ago', order: 4, payments: [] },
      this_month: {
        key: 'this_month',
        title: 'Earlier This Month',
        subtitle: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        order: 5,
        payments: [],
      },
      last_month: {
        key: 'last_month',
        title: 'Last Month',
        subtitle: prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        order: 6,
        payments: [],
      },
      older: { key: 'older', title: 'Older History', subtitle: 'Previous months', order: 7, payments: [] },
    };

    sorted.forEach((p) => {
      if (p.date === todayStr) {
        groups.today.payments.push(p);
        return;
      }
      if (p.date === yesterdayStr) {
        groups.yesterday.payments.push(p);
        return;
      }

      const [py, pm, pd] = p.date.split('-').map(Number);
      const pDate = new Date(py, (pm || 1) - 1, pd || 1);
      const diffDays = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 2 && diffDays <= 7) {
        groups.this_week.payments.push(p);
      } else if (diffDays > 7 && diffDays <= 14) {
        groups.last_week.payments.push(p);
      } else if (py === curYear && pm - 1 === curMonth) {
        groups.this_month.payments.push(p);
      } else if (py === prevMonthYear && pm - 1 === prevMonth) {
        groups.last_month.payments.push(p);
      } else {
        groups.older.payments.push(p);
      }
    });

    return Object.values(groups)
      .filter((g) => g.payments.length > 0)
      .sort((a, b) => a.order - b.order)
      .map((g) => ({
        ...g,
        totalAmount: g.payments.reduce((sum, p) => sum + p.amount, 0),
        count: g.payments.length,
      }));
  }, [payments]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllGroups = () => {
    const allCollapsed = groupedPayments.every((g) => collapsedGroups[g.key]);
    const next: Record<string, boolean> = {};
    groupedPayments.forEach((g) => {
      next[g.key] = !allCollapsed;
    });
    setCollapsedGroups(next);
  };

  // Form submission for new debt payment (Default cash, no vault deduction)
  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(quickAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddPayment({
        amount: parsedAmount,
        date: paymentDate,
        paymentMethod: selectedMethod,
        sourceAccount: 'general_wallet',
        deductFromVault: false,
        note: 'Office debt payment',
        createdAt: Date.now(),
      });

      // Celebrate a debt payoff once, while respecting the user's motion preference.
      if (!reduceMotion && remaining > 0 && parsedAmount >= remaining) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#6366F1'],
        });
      }

      // Reset quick amount to standard minimum
      setQuickAmount('2000');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit modal
  const handleOpenEdit = (payment: DebtPaymentEntry) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditDate(payment.date);
    setEditMethod(payment.paymentMethod || 'cash');
    setEditNote(payment.note || '');
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const parsed = parseInt(editAmount.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed <= 0) return;

    await onUpdatePayment(
      {
        ...editingPayment,
        amount: parsed,
        date: editDate,
        paymentMethod: editMethod,
        note: editNote,
      },
      editingPayment
    );
    setEditingPayment(null);
  };

  // Save Debt Goal Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTotal = parseInt(configTotal.replace(/[^0-9]/g, ''), 10);
    const newDaily = parseInt(configDailyMin.replace(/[^0-9]/g, ''), 10);
    if (isNaN(newTotal) || newTotal <= 0) return;

    await onUpdateDebtConfig({
      totalDebt: newTotal,
      dailyMinimum: isNaN(newDaily) || newDaily <= 0 ? 2000 : newDaily,
      creditorName: configCreditor.trim() || 'Office Management',
    });
    setIsConfigOpen(false);
  };

  return (
    <div id="office-debt-view" className="space-y-6 px-4 sm:px-6 pb-28 max-w-4xl mx-auto w-full">
      {/* Header Info with Quick Settings & Copy Share */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <Landmark className="size-4 shrink-0 text-lime-400" />
          <h1 className="truncate text-xl font-bold tracking-tight text-zinc-100 sm:text-2xl">Office Debt</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            id="debt-settings-btn"
            onClick={() => {
              setConfigTotal(totalDebt.toString());
              setConfigDailyMin(dailyMin.toString());
              setConfigCreditor(debt.creditorName || '');
              setIsConfigOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-surface border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
          >
            <Sliders className="size-3.5 text-lime-400" />
            <span>Target</span>
          </button>
        </div>
      </div>

      {/* Main Metric Hero Card */}
      <div className="relative overflow-hidden rounded-surface border border-lime-900/50 bg-zinc-900/80 p-4 sm:p-6">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-lime-500/10 dark:bg-lime-500/5 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Remaining</span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h2 className="text-2xl font-bold tracking-tight text-white font-mono-num sm:text-3xl">
                {formatUGX(remaining)}
              </h2>
              <span className="text-xs text-zinc-500">
                of {formatUGX(totalDebt)}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Paid</span>
            <span className="font-mono-num text-sm font-bold text-lime-300">{progressPct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-lime-400 transition-all duration-500"
              style={{ width: `${Math.max(3, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Status Highlights Grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
          {/* Today's Quota Badge */}
          <div className="min-w-0 rounded-surface border border-zinc-800 bg-zinc-950/50 p-2">
            <span className="block truncate text-[10px] font-medium text-zinc-500">Today</span>
            <div className="truncate text-xs font-bold text-zinc-100">
                {isTodayCompleted ? (
                  <span className="text-lime-300 flex items-center gap-1">
                    {formatUGX(todayPaidSum)} ✓
                  </span>
                ) : (
                  <span className="text-lime-300">
                    {formatUGX(todayPaidSum)} / {formatUGX(dailyMin)}
                  </span>
                )}
            </div>
          </div>

          {/* Daily Streak */}
          <div className="min-w-0 rounded-surface border border-zinc-800 bg-zinc-950/50 p-2">
            <span className="block truncate text-[10px] font-medium text-zinc-500">Streak</span>
            <span className="truncate text-xs font-bold text-zinc-100 font-mono-num">{streakDays} days</span>
          </div>

          {/* Projected Clearance Date */}
          <div className="min-w-0 rounded-surface border border-zinc-800 bg-zinc-950/50 p-2">
            <span className="block truncate text-[10px] font-medium text-zinc-500">Debt-free</span>
            <span className="truncate text-xs font-bold text-zinc-100">{isFullyPaid ? 'Cleared' : estimatedPayoffDate}</span>
          </div>
        </div>
      </div>

      {!isFullyPaid && (
        <details className="rounded-surface border border-lime-900/50 bg-zinc-900/70 px-4 py-3 text-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold marker:content-none">
            <span>Payoff estimate</span>
            <span className="text-xs font-medium text-lime-300">{currentPayoffEstimate.displayBadge} · {currentPayoffEstimate.finishDate}</span>
          </summary>
          <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
            <span>At {formatUGX(activeDailyVelocity)}/day</span>
            <button type="button" onClick={() => setCalculatorMode((mode) => mode === 'custom' ? 'pattern' : 'custom')} className="font-semibold text-lime-300">
              {calculatorMode === 'custom' ? 'Use actual pace' : 'Adjust pace'}
            </button>
          </div>
          {calculatorMode === 'custom' && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400"><span>Daily amount</span><strong className="text-lime-300">{formatUGX(customPace)}</strong></div>
              <input type="range" min={1000} max={30000} step={500} value={customPace} onChange={(event) => setCustomPace(Number(event.target.value))} className="w-full accent-lime-500" />
            </div>
          )}
        </details>
      )}
      {/* Log Payment Quick Action Form */}
      <div className="rounded-surface border border-zinc-800 bg-zinc-900/70 p-3 sm:p-5">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-surface bg-lime-500 text-zinc-950">
            <Receipt className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-zinc-100">Add payment</h3>
        </div>

        <form onSubmit={handlePaySubmit} className="mt-3 space-y-3">
          {/* Quick Preset Buttons */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Amount</label>
            <div className="mb-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {QUICK_DEBT_PAY_AMOUNTS.map((amt) => {
                const isSelected = quickAmount === amt.toString();
                return (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    key={amt}
                    type="button"
                    onClick={() => setQuickAmount(amt.toString())}
                    className={`rounded-surface border px-1.5 py-2 text-[11px] font-semibold transition-all text-center ${
                      isSelected
                        ? 'bg-lime-500 text-white border-lime-600 '
                        : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    +{formatUGX(amt)}
                    {amt === 2000 && <span className="block text-[9px] font-normal opacity-80">Min</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500">
                UGX
              </span>
              <input
                id="debt-payment-amount-input"
                type="text"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="2,000"
                className="w-full rounded-surface border border-zinc-700 bg-zinc-950/60 py-2.5 pl-12 pr-3 text-sm font-bold text-white font-mono outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Payment Method Selector - Defaults to Cash */}
            <div>
              <label className="mb-1 block text-[10px] font-medium text-zinc-500">Channel</label>
              <select
                id="debt-payment-method-select"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-surface border border-zinc-700 bg-zinc-950/60 px-2 py-2.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-lime-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="mb-1 block text-[10px] font-medium text-zinc-500">Date</label>
              <input
                id="debt-payment-date-input"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-surface border border-zinc-700 bg-zinc-950/60 px-2 py-2.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            id="debt-save-payment-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-surface bg-lime-400 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-lime-300 disabled:opacity-50"
          >
            <span>Record payment</span>
          </motion.button>
        </form>
      </div>

      {/* Grouped Transaction History (Collapsible: Today, Yesterday, This Week, Last Week, Earlier This Month, Last Month, Older) */}
      <div className="rounded-surface border border-zinc-800 bg-zinc-900/70 p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Transaction History
            </span>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Office Debt Payments</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                {payments.length} installments
              </span>
            </h3>
          </div>

          {payments.length > 0 && (
            <div className="flex items-center gap-3">
              {/* Expand / Collapse All Toggle */}
              <button
                type="button"
                onClick={toggleAllGroups}
                className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-surface bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {groupedPayments.every((g) => collapsedGroups[g.key]) ? 'Expand All' : 'Collapse All'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="text-xs font-bold text-zinc-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                title="Reset debt cycle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
            <Landmark className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5]" />
            <p className="text-sm font-semibold">No debt payments logged yet</p>
            <p className="text-xs max-w-sm mx-auto">
              Start logging your daily installments above (at least 2,000 UGX/day) to track your path to being debt free.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {groupedPayments.map((group) => {
              const isCollapsed = !!collapsedGroups[group.key];

              return (
                <div
                  key={group.key}
                  className="rounded-surface border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden transition-all"
                >
                  {/* Collapsible Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-surface bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isCollapsed ? '-rotate-90 text-zinc-400' : 'rotate-0 text-zinc-600 dark:text-zinc-300'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                            {group.title}
                          </h4>
                          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                            • {group.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {group.count} {group.count === 1 ? 'installment' : 'installments'}
                      </span>
                      <span className="text-xs sm:text-sm font-black font-mono-num text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900/60 px-2.5 py-0.5 rounded-full">
                        +{formatUGX(group.totalAmount)}
                      </span>
                    </div>
                  </button>

                  {/* Collapsible Payments List */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        key={`group-payments-${group.key}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-zinc-200/60 dark:border-zinc-800/80 divide-y divide-zinc-200/60 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                          {group.payments.map((p) => {
                            const methodMeta = PAYMENT_METHODS.find((m) => m.id === p.paymentMethod);

                            return (
                              <div
                                key={p.id}
                                className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-surface bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900/60 text-lime-600 dark:text-lime-400 flex items-center justify-center shrink-0">
                                    <TrendingDown className="w-4 h-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                                        {p.note || 'Office debt installment'}
                                      </span>
                                      {methodMeta && (
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full font-bold border ${methodMeta.badgeBg} ${methodMeta.textColor} ${methodMeta.borderColor}`}
                                        >
                                          {methodMeta.shortName}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 block font-mono">
                                      {p.date}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs sm:text-sm font-black font-mono-num text-lime-600 dark:text-lime-400">
                                    +{formatUGX(p.amount)}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(p)}
                                      className="p-1.5 rounded-surface text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                      title="Edit payment"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPaymentToDelete(p)}
                                      className="p-1.5 rounded-surface text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                      title="Delete payment"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Payment Modal */}
      <AnimatePresence>
        {editingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 "
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-zinc-900 rounded-surface p-6 sm:p-7 max-w-md w-full shadow-floating border border-zinc-100 dark:border-zinc-800 space-y-4"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Debt Payment</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Amount (UGX)</label>
                  <input
                    type="text"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Payment Method</label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Note</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-lime-500 text-white "
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {paymentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 "
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-zinc-900 rounded-surface p-6 max-w-sm w-full shadow-floating border border-zinc-100 dark:border-zinc-800 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-surface bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Payment Record?</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Remove installment of <strong>{formatUGX(paymentToDelete.amount)}</strong> recorded on {paymentToDelete.date}?
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPaymentToDelete(null)}
                  className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeletePayment(paymentToDelete);
                    setPaymentToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-rose-600 text-white "
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Debt Progress Confirmation Modal */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 "
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-zinc-900 rounded-surface p-6 max-w-sm w-full shadow-floating border border-zinc-100 dark:border-zinc-800 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-surface bg-lime-100 dark:bg-lime-950 text-lime-600 mx-auto flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Reset Debt Progress?</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  This will reset all office debt payment records to 0 UGX. Target and config will remain intact.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onResetDebtProgress();
                    setIsResetConfirmOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-rose-600 text-white "
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debt Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60  animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-surface p-6 sm:p-7 max-w-md w-full shadow-floating border border-zinc-100 dark:border-zinc-800 space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Office Debt Target Configuration</h3>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Total Debt Amount (UGX)</label>
                <input
                  type="text"
                  value={configTotal}
                  onChange={(e) => setConfigTotal(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Minimum Daily Payment (UGX)</label>
                <input
                  type="text"
                  value={configDailyMin}
                  onChange={(e) => setConfigDailyMin(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Creditor / Office Entity</label>
                <input
                  type="text"
                  value={configCreditor}
                  onChange={(e) => setConfigCreditor(e.target.value)}
                  placeholder="e.g. Office Space Landlord"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-surface px-4 py-2.5 text-zinc-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-surface font-bold text-xs bg-lime-500 text-white "
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
