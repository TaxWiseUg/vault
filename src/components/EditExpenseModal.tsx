import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
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
  Save,
  Receipt,
  Home,
  Wifi,
  Wallet,
  Check,
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
  formatUGX,
} from '../lib/constants';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseEntry | null;
  categories?: Record<CategoryId, CategoryGoal>;
  onUpdateExpense: (updated: ExpenseEntry, oldExpense: ExpenseEntry) => Promise<void> | void;
  onDeleteExpense: (expenseId: string) => Promise<void> | void;
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

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  categories,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  useLockBodyScroll(isOpen);

  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryId>('food_dining');
  const [sourceAccount, setSourceAccount] = useState<ExpenseSourceAccount>('general_wallet');
  const [deductFromVault, setDeductFromVault] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn_momo');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (expense) {
      setAmountStr(expense.amount.toLocaleString('en-US'));
      setCategory(expense.category);
      setSourceAccount(expense.sourceAccount || 'general_wallet');
      setDeductFromVault(expense.deductFromVault !== false);
      setPaymentMethod(expense.paymentMethod);
      setDate(expense.date);
      setNote(expense.note || '');
      setShowDeleteConfirm(false);
      setIsSubmitting(false);
    }
  }, [expense]);

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

  if (!isOpen || !expense) return null;

  const parsedAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onUpdateExpense(
        {
          ...expense,
          amount: parsedAmount,
          category,
          sourceAccount,
          deductFromVault: sourceAccount !== 'general_wallet' ? deductFromVault : false,
          paymentMethod,
          date,
          note: note.trim(),
        },
        expense
      );
      onClose();
    } catch (err) {
      console.error('Error updating expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteExpense(expense.id);
      onClose();
    } catch (err) {
      console.error('Error deleting expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVaultAccount = sourceAccount !== 'general_wallet';
  const selectedVaultCategory = isVaultAccount && categories ? categories[sourceAccount as CategoryId] : null;
  const currentVaultBalance = selectedVaultCategory ? (selectedVaultCategory.currentAmount || 0) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-900/60 dark:bg-black/75 p-0 sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-expense-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-surface shadow-floating border border-zinc-100 dark:border-zinc-800 flex flex-col max-h-[90vh] transition-colors overflow-hidden"
      >
        {/* Header - Always visible at top */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-surface bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center ">
              <Receipt className="w-5 h-5 pointer-events-none" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Expense</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Update amount, account deduction or note
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-edit-expense-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
            className="p-2.5 rounded-surface bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 pt-4 overflow-y-auto space-y-5 flex-1">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Amount (UGX) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold font-mono text-sm">
                UGX
              </span>
              <input
                id="edit-expense-amount-input"
                type="text"
                required
                value={amountStr}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val ? parseInt(val, 10).toLocaleString('en-US') : '');
                }}
                placeholder="5,000"
                className="w-full pl-16 pr-4 py-3 rounded-surface border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono-num text-xl font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-colors "
              />
            </div>
          </div>

          {/* Deducted From Account Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Deducted From Account / Vault
            </label>

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
                    className={`p-3 rounded-surface border text-left transition-all relative ${
                      isSelected
                        ? `${accMeta.badgeBg} ${accMeta.badgeDarkBg} border-rose-500  ring-2 ring-rose-500/20`
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-surface flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <AccIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {accMeta.shortName}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
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

            {/* Vault Deduction Toggle for Vault accounts */}
            {isVaultAccount && selectedVaultCategory && (
              <div className="p-3 rounded-surface bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductFromVault}
                    onChange={(e) => setDeductFromVault(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-amber-300 dark:border-amber-700"
                  />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Deduct from {selectedVaultCategory.name} vault balance
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Category Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Expense Category
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
                    className={`p-2.5 rounded-surface border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300  font-bold'
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-surface flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-rose-600 text-white'
                          : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs truncate leading-tight">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
                    className={`py-2 px-3 rounded-surface border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 '
                        : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
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
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -tranzinc-y-1/2" />
              <input
                id="edit-expense-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-surface border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Description / Note
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                id="edit-expense-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Boda ride, lunch..."
                className="w-full pl-10 pr-4 py-2.5 rounded-surface border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm ? (
            <div className="p-3.5 rounded-surface bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                Are you sure you want to delete this expense record?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-surface bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3.5 py-1.5 rounded-surface bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          </div>

          {/* Sticky Footer: Action Buttons */}
          <div className="p-4 sm:px-6 sm:py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0 flex items-center justify-between gap-3">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 rounded-surface bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                title="Delete this expense"
              >
                <Trash2 className="w-4 h-4 pointer-events-none" />
              </button>
            )}

            <div className="flex-1 flex items-center gap-2 justify-end">
              <button
                type="button"
                id="cancel-edit-expense-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-3 rounded-surface bg-zinc-200/80 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
              >
                Cancel
              </button>

              <button
                id="submit-update-expense-btn"
                type="submit"
                disabled={parsedAmount <= 0 || isSubmitting}
                className="px-6 py-3.5 rounded-surface bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider  active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 pointer-events-none" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

