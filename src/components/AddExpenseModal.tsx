import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  CreditCard,
  Tag,
  FileText,
  UtensilsCrossed,
  Bike,
  Zap,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  Briefcase,
  Users,
  MoreHorizontal,
  Smartphone,
  Banknote,
  Receipt,
  Home,
  Wifi,
  Wallet,
  Check,
  AlertCircle,
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
} from '../lib/constants';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (expense: Omit<ExpenseEntry, 'id'>) => Promise<void> | void;
  initialCategory?: ExpenseCategoryId;
  initialSourceAccount?: ExpenseSourceAccount;
  categories?: Record<CategoryId, CategoryGoal>;
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

const NOTE_SUGGESTIONS = [
  'Boda ride to town',
  'Lunch / Rolex',
  'Airtime / Data Bundle',
  'Market groceries',
  'Fuel top-up',
  'Yaka electricity token',
  'Water bill',
  'Pharmacy / Medicine',
  'Snacks & Drinks',
  'Client meeting transport',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSaveExpense,
  initialCategory = 'food_dining',
  initialSourceAccount = 'general_wallet',
  categories,
}) => {
  useLockBodyScroll(isOpen);

  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryId>(initialCategory);
  const [sourceAccount, setSourceAccount] = useState<ExpenseSourceAccount>(initialSourceAccount);
  const [deductFromVault, setDeductFromVault] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountStr('');
      setCategory(initialCategory);
      setSourceAccount(initialSourceAccount);
      setDeductFromVault(true);
      setPaymentMethod('cash');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialCategory, initialSourceAccount]);

  // Keyboard shortcut: Escape to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsedAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
    setAmountStr((current + addValue).toLocaleString('en-US'));
  };

  const handleApplyPreset = (preset: { label: string; amount: number; category: ExpenseCategoryId }) => {
    setAmountStr(preset.amount.toLocaleString('en-US'));
    setCategory(preset.category);
    setNote(preset.label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSaveExpense({
        amount: parsedAmount,
        category,
        sourceAccount,
        deductFromVault: sourceAccount !== 'general_wallet' ? deductFromVault : false,
        paymentMethod,
        date,
        note: note.trim(),
        createdAt: Date.now(),
      });
      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = EXPENSE_CATEGORIES[category];
  const SelectedCatIcon = CATEGORY_ICON_MAP[category] || Receipt;

  const isVaultAccount = sourceAccount !== 'general_wallet';
  const selectedVaultCategory = isVaultAccount && categories ? categories[sourceAccount as CategoryId] : null;
  const currentVaultBalance = selectedVaultCategory ? (selectedVaultCategory.currentAmount || 0) : 0;
  const projectedVaultBalance = Math.max(0, currentVaultBalance - parsedAmount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-expense-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors overflow-hidden"
      >
        {/* Header - Always visible at top */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <Receipt className="w-5 h-5 pointer-events-none" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Expense</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Log spending & track which account it was deducted from
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-add-expense-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 overflow-y-auto space-y-5 flex-1">
            {/* Quick Presets Row */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <span>Quick Presets</span>
                <span className="text-[10px] text-indigo-500 lowercase font-normal">tap to prefill</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {QUICK_EXPENSE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0 transition-all active:scale-95"
                  >
                    <span>{preset.label}</span>
                    <span className="ml-1 text-slate-400 font-mono">({formatUGX(preset.amount)})</span>
                  </button>
                ))}
              </div>
            </div>
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Amount (UGX) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold font-mono text-sm">
                UGX
              </span>
              <input
                id="expense-amount-input"
                type="text"
                required
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val ? parseInt(val, 10).toLocaleString('en-US') : '');
                }}
                placeholder="5,000"
                className="w-full pl-16 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono-num text-xl font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-colors shadow-inner"
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAddAmount(amt)}
                  className="py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono-num transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
                >
                  +{amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Deducted From Account Selection (Home Rent, Wifi, Work Rent, General) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Deducted From Account / Vault <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Select deduction source</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(EXPENSE_SOURCE_ACCOUNTS) as ExpenseSourceAccount[]).map((accKey) => {
                const accMeta = EXPENSE_SOURCE_ACCOUNTS[accKey];
                const isSelected = sourceAccount === accKey;
                const AccIcon = ACCOUNT_ICON_MAP[accMeta.icon] || Wallet;
                const vaultCat = accMeta.vaultCategoryId && categories ? categories[accMeta.vaultCategoryId] : null;

                return (
                  <button
                    key={accKey}
                    type="button"
                    onClick={() => setSourceAccount(accKey)}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? `${accMeta.badgeBg} ${accMeta.badgeDarkBg} border-rose-500 shadow-sm ring-2 ring-rose-500/20`
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <AccIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {accMeta.shortName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {vaultCat
                            ? `${formatUGX(vaultCat.currentAmount || 0)} saved`
                            : 'Out-of-pocket'}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vault Balance Deduction Toggle Indicator */}
            {isVaultAccount && selectedVaultCategory && (
              <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductFromVault}
                    onChange={(e) => setDeductFromVault(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-amber-300 dark:border-amber-700"
                  />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Deduct {parsedAmount > 0 ? formatUGX(parsedAmount) : 'amount'} from {selectedVaultCategory.name} vault balance
                  </span>
                </label>

                {deductFromVault && (
                  <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90 flex items-center justify-between font-mono pt-1 border-t border-amber-200/60 dark:border-amber-900/60">
                    <span>Balance after deduction:</span>
                    <span className="font-bold">
                      {formatUGX(currentVaultBalance)} &rarr; {formatUGX(projectedVaultBalance)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expense Category Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(EXPENSE_CATEGORIES).map((cat) => {
                const isSelected = category === cat.id;
                const IconComponent = CATEGORY_ICON_MAP[cat.id] || Receipt;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] truncate leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${pm.accentDot}`} />
                    <span>{pm.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="expense-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Note Input with Contextual Suggestion Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Description / Note (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="expense-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Boda ride to work, lunch at Cafe Javas..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {NOTE_SUGGESTIONS.slice(0, 5).map((sugg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(sugg)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  +{sugg}
                </button>
              ))}
            </div>
          </div>

          </div>

          {/* Sticky Footer: Action Buttons */}
          <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm shrink-0 flex items-center gap-3">
            <button
              type="button"
              id="cancel-add-expense-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-1/3 py-3 rounded-2xl bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>

            <button
              id="submit-save-expense-btn"
              type="submit"
              disabled={parsedAmount <= 0 || isSubmitting}
              className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3] pointer-events-none" />
              <span>{isSubmitting ? 'Recording...' : `Record ${parsedAmount > 0 ? formatUGX(parsedAmount) : 'Expense'}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

