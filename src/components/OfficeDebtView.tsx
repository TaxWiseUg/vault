import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Sparkles,
  RefreshCw,
  Copy,
  Info,
  CalendarCheck,
  BarChart3,
  Layers,
  CalendarDays,
  Target,
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
import { formatUGX, formatUGXShort, PAYMENT_METHODS, EXPENSE_SOURCE_ACCOUNTS, QUICK_DEBT_PAY_AMOUNTS } from '../lib/constants';

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
  const [paymentNote, setPaymentNote] = useState<string>('Daily office debt installment');
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
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Dynamic Payoff Speed Calculator interactive pace selection
  const [calculatorMode, setCalculatorMode] = useState<'pattern' | 'minimum' | 'moderate' | 'turbo' | 'custom'>('pattern');
  const [customPace, setCustomPace] = useState<number>(4000);

  // Collapsible groups state for transaction history
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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
  const todayRemainingForMin = Math.max(0, dailyMin - todayPaidSum);

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
    switch (calculatorMode) {
      case 'pattern':
        return patternAnalysis.dailyPace;
      case 'minimum':
        return dailyMin;
      case 'moderate':
        return 5000;
      case 'turbo':
        return 10000;
      case 'custom':
        return Math.max(500, customPace);
      default:
        return patternAnalysis.dailyPace;
    }
  }, [calculatorMode, patternAnalysis.dailyPace, dailyMin, customPace]);

  // Helper to format remaining duration dynamically into years, months, and days
  const formatPayoffDuration = (dailyVelocity: number, remainingBalance: number) => {
    if (remainingBalance <= 0) {
      return {
        totalDays: 0,
        years: 0,
        months: 0,
        days: 0,
        displayBadge: 'Debt Free! 🎉',
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

  const patternPayoffEstimate = useMemo(() => {
    return formatPayoffDuration(patternAnalysis.dailyPace, remaining);
  }, [patternAnalysis.dailyPace, remaining]);

  const minPacePayoffEstimate = useMemo(() => {
    return formatPayoffDuration(dailyMin, remaining);
  }, [dailyMin, remaining]);

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
        note: paymentNote.trim() || 'Daily office debt installment',
        createdAt: Date.now(),
      });

      // Confetti if fully cleared or completed daily quota
      if (totalPaid + parsedAmount >= totalDebt || (!isTodayCompleted && todayPaidSum + parsedAmount >= dailyMin)) {
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

  // Copy Summary statement
  const handleCopySummary = () => {
    const summary = `🏢 Office Debt Repayment Summary
Principal: ${formatUGX(totalDebt)}
Total Paid: ${formatUGX(totalPaid)} (${progressPct}%)
Remaining Balance: ${formatUGX(remaining)}
Daily Target: At least ${formatUGX(dailyMin)}/day
Today Paid: ${formatUGX(todayPaidSum)} (${isTodayCompleted ? 'Target Met ✓' : `${formatUGX(todayRemainingForMin)} remaining today`})
Pattern Pace: ~${formatUGX(patternAnalysis.dailyPace)}/day (${patternAnalysis.paceLabel})
Time Remaining: ${currentPayoffEstimate.breakdownText} (${currentPayoffEstimate.totalDays} days)
Estimated Debt-Free Date: ${currentPayoffEstimate.finishDate}
Logs Recorded: ${payments.length} installments`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    });
  };

  return (
    <div id="office-debt-view" className="space-y-6 px-4 sm:px-6 pb-28 max-w-4xl mx-auto w-full">
      {/* Header Info with Quick Settings & Copy Share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Office Debt Payoff Commitment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Office Debt (720k)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mandatory daily installments of at least <strong className="text-amber-600 dark:text-amber-400">{formatUGX(dailyMin)}/day</strong> until fully cleared.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="debt-copy-summary-btn"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Copy payoff report to clipboard"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedText ? 'Copied' : 'Share Report'}</span>
          </button>

          <button
            id="debt-settings-btn"
            onClick={() => {
              setConfigTotal(totalDebt.toString());
              setConfigDailyMin(dailyMin.toString());
              setConfigCreditor(debt.creditorName || '');
              setIsConfigOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>Target Config</span>
          </button>
        </div>
      </div>

      {/* Main Metric Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-amber-200/70 dark:border-amber-900/40 relative overflow-hidden transition-colors">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-500/10 dark:bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Remaining Debt Balance
            </span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-mono-num tracking-tight">
                {formatUGX(remaining)}
              </h2>
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                of {formatUGX(totalDebt)} original debt
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Paid Off
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono-num">
                {formatUGX(totalPaid)}
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center font-mono-num font-black text-sm shrink-0">
              <span>{progressPct}%</span>
              <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">Paid</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400">Payoff Completion</span>
            <span className="font-mono-num text-amber-700 dark:text-amber-400">
              {formatUGX(totalPaid)} / {formatUGX(totalDebt)}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.max(3, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Status Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Today's Quota Badge */}
          <div className={`p-3.5 rounded-2xl border transition-colors flex items-center gap-3 ${
            isTodayCompleted
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isTodayCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {isTodayCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                Today's Daily Minimum
              </span>
              <div className="text-xs font-black">
                {isTodayCompleted ? (
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    {formatUGX(todayPaidSum)} paid today ✓
                  </span>
                ) : (
                  <span className="text-amber-800 dark:text-amber-300">
                    {formatUGX(todayPaidSum)} / {formatUGX(dailyMin)} ({formatUGX(todayRemainingForMin)} left)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Daily Streak */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Daily Payoff Streak
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono-num">
                {streakDays} {streakDays === 1 ? 'day' : 'consecutive days'} (≥2k/day)
              </span>
            </div>
          </div>

          {/* Projected Clearance Date */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Debt-Free Target Date
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                {isFullyPaid ? 'Debt 100% Cleared 🎉' : estimatedPayoffDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Payoff Speed Calculator based on deposit pattern */}
      {!isFullyPaid && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[28px] sm:rounded-[36px] p-5 sm:p-7 shadow-xl border border-indigo-900/60 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Calculator Header & Pattern Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-900/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <span>Payoff Speed Calculator</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Dynamic
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Calculates exact remaining time in years, months, and days based on your actual deposit history.
                </p>
              </div>
            </div>

            {/* Current Pattern Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">Active Velocity:</span>
              <strong className="text-amber-300 font-mono-num">
                ~{formatUGX(activeDailyVelocity)}/day
              </strong>
            </div>
          </div>

          {/* Dynamic Countdown Display (Years, Months, Days) */}
          <div className="my-5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-indigo-800/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block mb-3">
              Remaining Payoff Duration ({calculatorMode === 'pattern' ? patternAnalysis.paceLabel : `${formatUGX(activeDailyVelocity)}/day`})
            </span>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
              {/* Years */}
              <div className="bg-slate-900/90 border border-indigo-900/70 rounded-2xl p-3 sm:p-4">
                <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono-num">
                  {currentPayoffEstimate.years}
                </div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {currentPayoffEstimate.years === 1 ? 'Year' : 'Years'}
                </div>
              </div>

              {/* Months */}
              <div className="bg-slate-900/90 border border-indigo-900/70 rounded-2xl p-3 sm:p-4">
                <div className="text-2xl sm:text-4xl font-black text-amber-300 font-mono-num">
                  {currentPayoffEstimate.months}
                </div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {currentPayoffEstimate.months === 1 ? 'Month' : 'Months'}
                </div>
              </div>

              {/* Days */}
              <div className="bg-slate-900/90 border border-indigo-900/70 rounded-2xl p-3 sm:p-4">
                <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono-num">
                  {currentPayoffEstimate.days}
                </div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {currentPayoffEstimate.days === 1 ? 'Day' : 'Days'}
                </div>
              </div>
            </div>

            {/* Detailed summary row below counters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="text-slate-200">
                Total Remaining: <strong className="text-white font-mono-num">~{currentPayoffEstimate.totalDays} days</strong> ({currentPayoffEstimate.breakdownText})
              </div>
              <div className="text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                <span>Projected Completion:</span>
                <strong className="text-amber-300">{currentPayoffEstimate.finishDate}</strong>
              </div>
            </div>
          </div>

          {/* Interactive Pace Selector Buttons */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Compare Payoff Paces:
              </span>
              {patternAnalysis.hasHistory && (
                <span className="text-[11px] text-amber-400">
                  {patternAnalysis.totalDepositCount} past deposits analyzed
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {/* Mode: User Pattern */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setCalculatorMode('pattern')}
                className={`p-2.5 rounded-xl font-bold border transition-all text-left ${
                  calculatorMode === 'pattern'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider">My Pattern</span>
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="text-xs font-black font-mono-num mt-0.5">
                  ~{formatUGX(patternAnalysis.dailyPace)}/d
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {patternPayoffEstimate.displayBadge}
                </div>
              </motion.button>

              {/* Mode: Required Minimum (2,000 UGX) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setCalculatorMode('minimum')}
                className={`p-2.5 rounded-xl font-bold border transition-all text-left ${
                  calculatorMode === 'minimum'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider">Min Target</span>
                  <Target className="w-3 h-3" />
                </div>
                <div className="text-xs font-black font-mono-num mt-0.5">
                  {formatUGX(dailyMin)}/d
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {minPacePayoffEstimate.displayBadge}
                </div>
              </motion.button>

              {/* Mode: Moderate Pace (5,000 UGX) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setCalculatorMode('moderate')}
                className={`p-2.5 rounded-xl font-bold border transition-all text-left ${
                  calculatorMode === 'moderate'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider">Moderate</span>
                  <Zap className="w-3 h-3" />
                </div>
                <div className="text-xs font-black font-mono-num mt-0.5">
                  5,000 UGX/d
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {formatPayoffDuration(5000, remaining).displayBadge}
                </div>
              </motion.button>

              {/* Mode: Turbo Pace (10,000 UGX) */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setCalculatorMode('turbo')}
                className={`p-2.5 rounded-xl font-bold border transition-all text-left ${
                  calculatorMode === 'turbo'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider">Turbo</span>
                  <Flame className="w-3 h-3" />
                </div>
                <div className="text-xs font-black font-mono-num mt-0.5">
                  10,000 UGX/d
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {formatPayoffDuration(10000, remaining).displayBadge}
                </div>
              </motion.button>

              {/* Mode: Custom Slider */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setCalculatorMode('custom')}
                className={`p-2.5 rounded-xl font-bold border transition-all text-left col-span-2 sm:col-span-1 ${
                  calculatorMode === 'custom'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider">Custom</span>
                  <Sliders className="w-3 h-3" />
                </div>
                <div className="text-xs font-black font-mono-num mt-0.5">
                  {formatUGX(customPace)}/d
                </div>
                <div className="text-[10px] opacity-80 truncate mt-0.5">
                  {formatPayoffDuration(customPace, remaining).displayBadge}
                </div>
              </motion.button>
            </div>

            {/* Custom slider interactive control when in custom mode */}
            <AnimatePresence>
              {calculatorMode === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Slide to test daily payment capability:</span>
                      <span className="font-mono-num font-black text-amber-400">{formatUGX(customPace)} / day</span>
                    </div>
                    <input
                      type="range"
                      min={1000}
                      max={30000}
                      step={500}
                      value={customPace}
                      onChange={(e) => setCustomPace(parseInt(e.target.value, 10))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>1,000 UGX</span>
                      <span>15,000 UGX</span>
                      <span>30,000 UGX</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Velocity Insights Callout */}
          <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                <strong>{patternAnalysis.paceLabel}:</strong> {patternAnalysis.paceDescription}
              </p>
              {patternAnalysis.dailyPace > dailyMin ? (
                <p className="text-emerald-300 font-medium">
                  🚀 Your actual deposit velocity will clear this debt ~<strong>{Math.max(0, minPacePayoffEstimate.totalDays - patternPayoffEstimate.totalDays)} days earlier</strong> than the minimum quota!
                </p>
              ) : patternAnalysis.hasHistory ? (
                <p className="text-amber-200">
                  💡 Tip: Increasing your daily deposit to 5,000 UGX/day would cut your payoff duration down to <strong>{formatPayoffDuration(5000, remaining).breakdownText}</strong>.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Log Payment Quick Action Form */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Pay Installment
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Log Office Debt Payment
            </h3>
          </div>
        </div>

        <form onSubmit={handlePaySubmit} className="mt-6 space-y-5">
          {/* Quick Preset Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Select or Enter Installment Amount
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {QUICK_DEBT_PAY_AMOUNTS.map((amt) => {
                const isSelected = quickAmount === amt.toString();
                return (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    key={amt}
                    type="button"
                    onClick={() => setQuickAmount(amt.toString())}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    +{formatUGXShort(amt)}
                    {amt === 2000 && <span className="block text-[9px] font-normal opacity-90">Daily Min</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">
                UGX
              </span>
              <input
                id="debt-payment-amount-input"
                type="text"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="2,000"
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-16 pr-4 py-3.5 text-slate-900 dark:text-white font-mono text-base font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method Selector - Defaults to Cash */}
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Payment Channel (Default: Cash)
              </label>
              <select
                id="debt-payment-method-select"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-slate-900 dark:text-white font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Payment Date
              </label>
              <input
                id="debt-payment-date-input"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-slate-900 dark:text-white font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Optional Note / Receipt Reference */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Note or Receipt Reference (Optional)
            </label>
            <input
              id="debt-payment-note-input"
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="e.g. Daily office debt installment, Cash payment"
              className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            id="debt-save-payment-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Record Debt Payment</span>
          </motion.button>
        </form>
      </div>

      {/* Grouped Transaction History (Collapsible: Today, Yesterday, This Week, Last Week, Earlier This Month, Last Month, Older) */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Transaction History
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Office Debt Payments</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {groupedPayments.every((g) => collapsedGroups[g.key]) ? 'Expand All' : 'Collapse All'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                title="Reset debt cycle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Landmark className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
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
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden transition-all"
                >
                  {/* Collapsible Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isCollapsed ? '-rotate-90 text-slate-400' : 'rotate-0 text-slate-600 dark:text-slate-300'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {group.title}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            • {group.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {group.count} {group.count === 1 ? 'installment' : 'installments'}
                      </span>
                      <span className="text-xs sm:text-sm font-black font-mono-num text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-0.5 rounded-full">
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
                        <div className="border-t border-slate-200/60 dark:border-slate-800/80 divide-y divide-slate-200/60 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                          {group.payments.map((p) => {
                            const methodMeta = PAYMENT_METHODS.find((m) => m.id === p.paymentMethod);

                            return (
                              <div
                                key={p.id}
                                className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <TrendingDown className="w-4 h-4" />
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {p.note || 'Office debt installment'}
                                      </span>
                                      {methodMeta && (
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${methodMeta.badgeBg} ${methodMeta.textColor} ${methodMeta.borderColor}`}
                                        >
                                          {methodMeta.shortName}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block font-mono">
                                      {p.date}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs sm:text-sm font-black font-mono-num text-emerald-600 dark:text-emerald-400">
                                    +{formatUGX(p.amount)}
                                  </span>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(p)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      title="Edit payment"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPaymentToDelete(p)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Debt Payment</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Amount (UGX)</label>
                  <input
                    type="text"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Payment Method</label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Note</label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-white shadow-md shadow-amber-500/20"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Payment Record?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Remove installment of <strong>{formatUGX(paymentToDelete.amount)}</strong> recorded on {paymentToDelete.date}?
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPaymentToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await onDeletePayment(paymentToDelete);
                    setPaymentToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white shadow-md shadow-rose-600/20"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 mx-auto flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Debt Progress?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This will reset all office debt payment records to 0 UGX. Target and config will remain intact.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onResetDebtProgress();
                    setIsResetConfirmOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white shadow-md shadow-rose-600/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Office Debt Target Configuration</h3>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Total Debt Amount (UGX)</label>
                <input
                  type="text"
                  value={configTotal}
                  onChange={(e) => setConfigTotal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Minimum Daily Payment (UGX)</label>
                <input
                  type="text"
                  value={configDailyMin}
                  onChange={(e) => setConfigDailyMin(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Creditor / Office Entity</label>
                <input
                  type="text"
                  value={configCreditor}
                  onChange={(e) => setConfigCreditor(e.target.value)}
                  placeholder="e.g. Office Space Landlord"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-white shadow-md shadow-amber-500/20"
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
