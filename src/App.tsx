/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  getLocalCategories,
  getLocalEntries,
  getLocalExpenses,
  getLocalDebtGoal,
  getLocalDebtPayments,
  subscribeToUserCategories,
  subscribeToUserEntries,
  subscribeToUserExpenses,
  subscribeToUserDebtGoal,
  subscribeToUserDebtPayments,
  addSavingsEntryToDb,
  addMultipleSavingsEntriesToDb,
  updateSavingsEntryInDb,
  deleteSavingsEntryFromDb,
  addExpenseEntryToDb,
  updateExpenseEntryInDb,
  deleteExpenseEntryFromDb,
  addDebtPaymentToDb,
  updateDebtPaymentInDb,
  deleteDebtPaymentFromDb,
  updateDebtGoalConfigInDb,
  resetDebtPaidProgressInDb,
  updateCategoryTargetInDb,
  resetCategoryProgressInDb,
  clearLocalData,
} from './lib/firebase';
import {
  CategoryGoal,
  CategoryId,
  SavingsEntry,
  UserProfile,
  BudgetOverview,
  ExpenseEntry,
  ExpenseCategoryId,
  DebtGoal,
  DebtPaymentEntry,
} from './types';
import { DEFAULT_CATEGORIES, DEFAULT_OFFICE_DEBT, formatUGX } from './lib/constants';
import { Navbar } from './components/Navbar';
import { CategoryTabs, ActiveTab } from './components/CategoryTabs';
import { DesktopSidebar } from './components/DesktopSidebar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { OverviewView } from './components/OverviewView';
import { CategoryDetailView } from './components/CategoryDetailView';
import { HistoryLedger } from './components/HistoryLedger';
import { ExpensesView } from './components/ExpensesView';
import { OfficeDebtView } from './components/OfficeDebtView';
import { AiCoachView } from './components/AiCoachView';
import { QuickAddModal } from './components/QuickAddModal';
import { EditEntryModal } from './components/EditEntryModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationModal } from './components/NotificationModal';
import { useNotifications } from './context/NotificationContext';
import {
  Plus,
  LayoutDashboard,
  Home,
  Wifi,
  Briefcase,
  History,
  Sparkles,
  Receipt,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const { addNotification } = useNotifications();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Record<CategoryId, CategoryGoal>>(getLocalCategories());
  const [entries, setEntries] = useState<SavingsEntry[]>(getLocalEntries());
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(getLocalExpenses());
  const [debtGoal, setDebtGoal] = useState<DebtGoal>(getLocalDebtGoal());
  const [debtPayments, setDebtPayments] = useState<DebtPaymentEntry[]>(getLocalDebtPayments());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [preselectedCategory, setPreselectedCategory] = useState<CategoryId | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<SavingsEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Expense modals
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [preselectedExpenseCategory, setPreselectedExpenseCategory] = useState<ExpenseCategoryId | undefined>(undefined);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
        };
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Multi-Device synchronization via Firestore or Local Storage
  useEffect(() => {
    if (user?.uid) {
      // Subscribed to User's Firestore account with real-time onSnapshot listeners
      const unsubCategories = subscribeToUserCategories(user.uid, (remoteCategories) => {
        setCategories(remoteCategories);
      });

      const unsubEntries = subscribeToUserEntries(user.uid, (remoteEntries) => {
        setEntries(remoteEntries);
      });

      const unsubExpenses = subscribeToUserExpenses(user.uid, (remoteExpenses) => {
        setExpenses(remoteExpenses);
      });

      const unsubDebtGoal = subscribeToUserDebtGoal(user.uid, (remoteDebt) => {
        setDebtGoal(remoteDebt);
      });

      const unsubDebtPayments = subscribeToUserDebtPayments(user.uid, (remotePayments) => {
        setDebtPayments(remotePayments);
      });

      return () => {
        unsubCategories();
        unsubEntries();
        unsubExpenses();
        unsubDebtGoal();
        unsubDebtPayments();
      };
    } else {
      // Offline / Local storage fallback mode
      setCategories(getLocalCategories());
      setEntries(getLocalEntries());
      setExpenses(getLocalExpenses());
      setDebtGoal(getLocalDebtGoal());
      setDebtPayments(getLocalDebtPayments());
    }
  }, [user?.uid]);

  // Recalculate categories currentAmount from entries if needed or keep synchronized
  const synchronizedCategories = useMemo(() => {
    const result = { ...categories };
    const homeEntriesTotal = entries
      .filter((e) => e.categoryId === 'home_rent')
      .reduce((sum, e) => sum + e.amount, 0);
    const internetEntriesTotal = entries
      .filter((e) => e.categoryId === 'internet')
      .reduce((sum, e) => sum + e.amount, 0);
    const workRentEntriesTotal = entries
      .filter((e) => e.categoryId === 'work_rent')
      .reduce((sum, e) => sum + e.amount, 0);

    result.home_rent = {
      ...result.home_rent,
      currentAmount: Math.max(result.home_rent.currentAmount || 0, homeEntriesTotal),
    };
    result.internet = {
      ...result.internet,
      currentAmount: Math.max(result.internet.currentAmount || 0, internetEntriesTotal),
    };
    result.work_rent = {
      ...result.work_rent,
      currentAmount: Math.max(result.work_rent.currentAmount || 0, workRentEntriesTotal),
    };

    return result;
  }, [categories, entries]);

  // Synchronized Office Debt
  const synchronizedDebt = useMemo(() => {
    const totalPaidFromPayments = debtPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      ...debtGoal,
      paidAmount: Math.max(debtGoal.paidAmount || 0, totalPaidFromPayments),
    };
  }, [debtGoal, debtPayments]);

  // Calculate days left in current month
  const daysLeftInMonth = useMemo(() => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDayOfMonth - now.getDate() + 1);
  }, []);

  // Calculate savings streak
  const streakDays = useMemo(() => {
    if (entries.length === 0) return 0;
    const uniqueDates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const formattedCheck = checkDate.toISOString().split('T')[0];

      if (uniqueDates.includes(formattedCheck)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak || (uniqueDates.length > 0 ? 1 : 0);
  }, [entries]);

  // Compute master overview stats
  const overview: BudgetOverview = useMemo(() => {
    const totalTarget =
      synchronizedCategories.home_rent.targetAmount +
      synchronizedCategories.internet.targetAmount +
      synchronizedCategories.work_rent.targetAmount;

    const totalSaved =
      synchronizedCategories.home_rent.currentAmount +
      synchronizedCategories.internet.currentAmount +
      synchronizedCategories.work_rent.currentAmount;

    const totalRemaining = Math.max(0, totalTarget - totalSaved);
    const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
    const requiredDailyRateTotal = daysLeftInMonth > 0 ? Math.ceil(totalRemaining / daysLeftInMonth) : totalRemaining;
    const dailyAverageSaved = entries.length > 0 ? Math.round(totalSaved / Math.max(1, entries.length)) : 0;

    return {
      totalTarget,
      totalSaved,
      totalRemaining,
      overallPercentage,
      dailyAverageSaved,
      streakDays,
      daysLeftInMonth,
      requiredDailyRateTotal,
    };
  }, [synchronizedCategories, daysLeftInMonth, streakDays, entries.length]);

  const categoriesProgress = useMemo(() => {
    const calc = (cat: CategoryGoal) => {
      const cur = cat.currentAmount || 0;
      const tar = cat.targetAmount;
      return {
        current: cur,
        target: tar,
        pct: Math.min(100, Math.round((cur / tar) * 100)),
      };
    };

    return {
      home_rent: calc(synchronizedCategories.home_rent),
      internet: calc(synchronizedCategories.internet),
      work_rent: calc(synchronizedCategories.work_rent),
    };
  }, [synchronizedCategories]);

  // Handlers
  const handleOpenAddModal = (catId?: CategoryId) => {
    setPreselectedCategory(catId);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (entry: SavingsEntry) => {
    setEditingEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleQuickAdd = async (catId: CategoryId, amount: number) => {
    const cat = synchronizedCategories[catId];
    const willReachGoal = (cat.currentAmount || 0) + amount >= cat.targetAmount;

    if (willReachGoal) {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#F59E0B'],
      });
      addNotification(
        `Goal Completed: ${cat.name}!`,
        `Congratulations! You contributed and completed your ${cat.name} target (${formatUGX(cat.targetAmount)}).`,
        'milestone',
        { categoryId: catId, actionTab: catId }
      );
    }

    await addSavingsEntryToDb(
      user?.uid || null,
      {
        categoryId: catId,
        amount,
        date: new Date().toISOString().split('T')[0],
        note: 'Quick deposit',
        createdAt: Date.now(),
      },
      synchronizedCategories
    );

    showToast(`+${formatUGX(amount)} added to ${cat.name}!`);
  };

  const handleQuickAddMultiple = async (categoryIds: CategoryId[], amountPerCategory: number) => {
    if (categoryIds.length === 0 || amountPerCategory <= 0) return;

    const entriesToCreate: Array<Omit<SavingsEntry, 'id'>> = categoryIds.map((catId) => ({
      categoryId: catId,
      amount: amountPerCategory,
      date: new Date().toISOString().split('T')[0],
      note: `Quick split deposit (${categoryIds.length} accounts)`,
      createdAt: Date.now(),
    }));

    let willCompleteAny = false;
    for (const catId of categoryIds) {
      const cat = synchronizedCategories[catId];
      if ((cat.currentAmount || 0) + amountPerCategory >= cat.targetAmount) {
        willCompleteAny = true;
        addNotification(
          `Goal Completed: ${cat.name}!`,
          `Congratulations! You contributed and completed your ${cat.name} target (${formatUGX(cat.targetAmount)}).`,
          'milestone',
          { categoryId: catId, actionTab: catId }
        );
      }
    }

    if (willCompleteAny) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#06B6D4', '#F59E0B'],
      });
    }

    await addMultipleSavingsEntriesToDb(user?.uid || null, entriesToCreate, synchronizedCategories);
    const totalAdded = amountPerCategory * categoryIds.length;
    showToast(`+${formatUGX(totalAdded)} deposited across ${categoryIds.length} accounts (+${formatUGX(amountPerCategory)} each)!`);
  };

  const handleSaveEntry = async (entry: Omit<SavingsEntry, 'id'>) => {
    const cat = synchronizedCategories[entry.categoryId];
    const willReachGoal = (cat.currentAmount || 0) + entry.amount >= cat.targetAmount;

    if (willReachGoal) {
      addNotification(
        `Goal Completed: ${cat.name}!`,
        `Congratulations! You achieved 100% of your ${cat.name} target (${formatUGX(cat.targetAmount)}).`,
        'milestone',
        { categoryId: entry.categoryId, actionTab: entry.categoryId }
      );
    }

    await addSavingsEntryToDb(user?.uid || null, entry, synchronizedCategories);
    showToast(`+${formatUGX(entry.amount)} saved!`);
  };

  const handleSaveMultipleEntries = async (entriesToSave: Array<Omit<SavingsEntry, 'id'>>) => {
    if (entriesToSave.length === 0) return;

    let willCompleteAny = false;
    let totalSaved = 0;

    for (const entry of entriesToSave) {
      totalSaved += entry.amount;
      const cat = synchronizedCategories[entry.categoryId];
      if ((cat.currentAmount || 0) + entry.amount >= cat.targetAmount) {
        willCompleteAny = true;
        addNotification(
          `Goal Completed: ${cat.name}!`,
          `Congratulations! You achieved 100% of your ${cat.name} target (${formatUGX(cat.targetAmount)}).`,
          'milestone',
          { categoryId: entry.categoryId, actionTab: entry.categoryId }
        );
      }
    }

    if (willCompleteAny) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#F97316', '#3B82F6', '#10B981', '#EC4899'],
      });
    }

    await addMultipleSavingsEntriesToDb(user?.uid || null, entriesToSave, synchronizedCategories);
    showToast(`+${formatUGX(totalSaved)} saved across ${entriesToSave.length} accounts!`);
  };

  const handleUpdateEntry = async (updatedEntry: SavingsEntry, oldEntry: SavingsEntry) => {
    await updateSavingsEntryInDb(user?.uid || null, updatedEntry, oldEntry, synchronizedCategories);
    showToast(`Updated record to ${formatUGX(updatedEntry.amount)}.`);
  };

  const handleDeleteEntry = async (entry: SavingsEntry) => {
    await deleteSavingsEntryFromDb(user?.uid || null, entry, synchronizedCategories);
    showToast(`Removed entry of ${formatUGX(entry.amount)}.`);
  };

  const handleUpdateTarget = async (catId: CategoryId, newTarget: number) => {
    await updateCategoryTargetInDb(user?.uid || null, catId, newTarget, synchronizedCategories);
    showToast(`Target updated to ${formatUGX(newTarget)}.`);
  };

  const handleResetProgress = async (catId: CategoryId) => {
    await resetCategoryProgressInDb(user?.uid || null, catId, synchronizedCategories);
    showToast(`${synchronizedCategories[catId].name} reset for new cycle.`);
  };

  // Expense Handlers
  const handleOpenAddExpenseModal = (catId?: ExpenseCategoryId) => {
    setPreselectedExpenseCategory(catId);
    setIsAddExpenseModalOpen(true);
  };

  const handleOpenEditExpenseModal = (expense: ExpenseEntry) => {
    setEditingExpense(expense);
    setIsEditExpenseModalOpen(true);
  };

  const handleSaveExpense = async (expense: Omit<ExpenseEntry, 'id'>) => {
    await addExpenseEntryToDb(user?.uid || null, expense);
    showToast(`Expense of ${formatUGX(expense.amount)} recorded!`);
  };

  const handleUpdateExpense = async (updatedExpense: ExpenseEntry, _oldExpense: ExpenseEntry) => {
    await updateExpenseEntryInDb(user?.uid || null, updatedExpense);
    showToast(`Updated expense to ${formatUGX(updatedExpense.amount)}.`);
  };

  const handleDeleteExpense = async (expenseOrId: ExpenseEntry | string) => {
    const id = typeof expenseOrId === 'string' ? expenseOrId : expenseOrId.id;
    const target = expenses.find((e) => e.id === id);
    await deleteExpenseEntryFromDb(user?.uid || null, id);
    showToast(target ? `Removed expense of ${formatUGX(target.amount)}.` : 'Removed expense entry.');
  };

  // Office Debt Handlers
  const handleAddDebtPayment = async (payment: Omit<DebtPaymentEntry, 'id'>) => {
    const willCompleteDebt = (synchronizedDebt.paidAmount || 0) + payment.amount >= synchronizedDebt.totalDebt;
    if (willCompleteDebt) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#6366F1'],
      });
      addNotification(
        '🎉 Office Debt Fully Cleared!',
        `Incredible milestone! You have completely paid off the ${formatUGX(synchronizedDebt.totalDebt)} office debt.`,
        'milestone',
        { actionTab: 'debt' }
      );
    }
    await addDebtPaymentToDb(user?.uid || null, payment, synchronizedDebt, synchronizedCategories);
    showToast(`Recorded debt payment of ${formatUGX(payment.amount)}!`);
  };

  const handleUpdateDebtPayment = async (updatedPayment: DebtPaymentEntry, oldPayment: DebtPaymentEntry) => {
    await updateDebtPaymentInDb(user?.uid || null, updatedPayment, oldPayment, synchronizedDebt, synchronizedCategories);
    showToast(`Updated debt payment to ${formatUGX(updatedPayment.amount)}.`);
  };

  const handleDeleteDebtPayment = async (payment: DebtPaymentEntry) => {
    await deleteDebtPaymentFromDb(user?.uid || null, payment.id, payment, synchronizedDebt, synchronizedCategories);
    showToast(`Removed debt payment of ${formatUGX(payment.amount)}.`);
  };

  const handleUpdateDebtConfig = async (updatedDebt: Partial<DebtGoal>) => {
    await updateDebtGoalConfigInDb(user?.uid || null, updatedDebt, synchronizedDebt);
    showToast(`Debt configuration updated.`);
  };

  const handleResetDebtProgress = async () => {
    await resetDebtPaidProgressInDb(user?.uid || null, synchronizedDebt);
    showToast(`Office debt payments reset.`);
  };

  const handleAccountDeleted = () => {
    setUser(null);
    setCategories(DEFAULT_CATEGORIES);
    setEntries([]);
    setExpenses([]);
    setDebtGoal(DEFAULT_OFFICE_DEBT);
    setDebtPayments([]);
    showToast('Account and all data deleted.');
  };

  // Global Desktop Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key dismisses any currently open modal
      if (e.key === 'Escape') {
        if (isAddExpenseModalOpen) {
          setIsAddExpenseModalOpen(false);
          return;
        }
        if (isEditExpenseModalOpen) {
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
          return;
        }
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
          return;
        }
        if (isEditModalOpen) {
          setIsEditModalOpen(false);
          setEditingEntry(null);
          return;
        }
        if (isCommandPaletteOpen) {
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
          return;
        }
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }
        if (isNotificationOpen) {
          setIsNotificationOpen(false);
          return;
        }
      }

      // Cmd + K or Ctrl + K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // If any modal is open, don't trigger background single-key shortcuts
      const isAnyModalOpen =
        isAddExpenseModalOpen ||
        isEditExpenseModalOpen ||
        isAddModalOpen ||
        isEditModalOpen ||
        isAuthModalOpen ||
        isSettingsOpen ||
        isNotificationOpen ||
        isCommandPaletteOpen ||
        isShortcutsOpen;

      if (isAnyModalOpen) return;

      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) return;

      // Single key shortcuts when outside of inputs
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleOpenAddModal();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleOpenAddExpenseModal();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveTab('debt');
      } else if (e.key === '1') {
        setActiveTab('overview');
      } else if (e.key === '2') {
        setActiveTab('home_rent');
      } else if (e.key === '3') {
        setActiveTab('internet');
      } else if (e.key === '4') {
        setActiveTab('work_rent');
      } else if (e.key === '5') {
        setActiveTab('debt');
      } else if (e.key === '6') {
        setActiveTab('expenses');
      } else if (e.key === '7') {
        setActiveTab('history');
      } else if (e.key === '8') {
        setActiveTab('ai');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddExpenseModalOpen,
    isEditExpenseModalOpen,
    isAddModalOpen,
    isEditModalOpen,
    isAuthModalOpen,
    isSettingsOpen,
    isNotificationOpen,
    isCommandPaletteOpen,
    isShortcutsOpen,
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-row font-sans transition-colors">
      {/* Dedicated Desktop Left Sidebar (visible on lg+) */}
      <DesktopSidebar
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        categories={synchronizedCategories}
        debt={synchronizedDebt}
        categoriesProgress={categoriesProgress}
        debtProgress={{
          current: synchronizedDebt.paidAmount,
          total: synchronizedDebt.totalDebt,
          pct: Math.min(100, Math.round((synchronizedDebt.paidAmount / (synchronizedDebt.totalDebt || 1)) * 100)),
        }}
        expenseCount={expenses.length}
        user={user}
        onOpenAddModal={handleOpenAddModal}
        onOpenAddExpenseModal={handleOpenAddExpenseModal}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <Navbar
          user={user}
          activeTab={activeTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAddModal={handleOpenAddModal}
          onOpenAddExpense={handleOpenAddExpenseModal}
        />

        {/* Mobile & Tablet Horizontal Tab Navigation (hidden on lg+) */}
        <CategoryTabs
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          categoriesProgress={categoriesProgress}
          debtProgress={{
            current: synchronizedDebt.paidAmount,
            total: synchronizedDebt.totalDebt,
            pct: Math.min(100, Math.round((synchronizedDebt.paidAmount / (synchronizedDebt.totalDebt || 1)) * 100)),
          }}
          expenseCount={expenses.length}
        />

        {/* Toast Notification Banner */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white text-xs font-bold shadow-2xl border border-slate-800 dark:border-indigo-500"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Views */}
        <main className="flex-1 pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="w-full"
            >
              {activeTab === 'overview' && (
                <OverviewView
                  categories={synchronizedCategories}
                  overview={overview}
                  recentEntries={entries}
                  expenses={expenses}
                  debt={synchronizedDebt}
                  user={user}
                  onOpenAddModal={handleOpenAddModal}
                  onQuickAdd={handleQuickAdd}
                  onQuickAddMultiple={handleQuickAddMultiple}
                  onSelectCategory={(catId) => setActiveTab(catId)}
                  onOpenLedger={() => setActiveTab('history')}
                  onOpenExpenses={() => setActiveTab('expenses')}
                  onOpenAddExpense={() => handleOpenAddExpenseModal()}
                  onOpenDebt={() => setActiveTab('debt')}
                  onEditEntry={handleOpenEditModal}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                />
              )}

              {(activeTab === 'home_rent' || activeTab === 'internet' || activeTab === 'work_rent') && (
                <CategoryDetailView
                  category={synchronizedCategories[activeTab]}
                  entries={entries}
                  daysLeftInMonth={daysLeftInMonth}
                  onBack={() => setActiveTab('overview')}
                  onOpenAddModal={handleOpenAddModal}
                  onQuickAdd={(catId, amt) => handleQuickAdd(catId, amt)}
                  onEditEntry={handleOpenEditModal}
                  onDeleteEntry={handleDeleteEntry}
                  onUpdateTarget={handleUpdateTarget}
                  onResetProgress={handleResetProgress}
                />
              )}

              {activeTab === 'debt' && (
                <OfficeDebtView
                  debt={synchronizedDebt}
                  payments={debtPayments}
                  categories={synchronizedCategories}
                  onAddPayment={handleAddDebtPayment}
                  onUpdatePayment={handleUpdateDebtPayment}
                  onDeletePayment={handleDeleteDebtPayment}
                  onUpdateDebtConfig={handleUpdateDebtConfig}
                  onResetDebtProgress={handleResetDebtProgress}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  totalSavedMonth={overview.totalSaved}
                  categories={synchronizedCategories}
                  onOpenAddExpense={handleOpenAddExpenseModal}
                  onOpenEditExpense={handleOpenEditExpenseModal}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'history' && (
                <HistoryLedger
                  entries={entries}
                  categories={synchronizedCategories}
                  onEditEntry={handleOpenEditModal}
                  onDeleteEntry={handleDeleteEntry}
                />
              )}

              {activeTab === 'ai' && (
                <AiCoachView
                  categories={synchronizedCategories}
                  entries={entries}
                  daysLeftInMonth={daysLeftInMonth}
                  totalSaved={overview.totalSaved}
                  totalTarget={overview.totalTarget}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Fixed Mobile Bottom Action Bar (hidden on desktop) */}
        <nav id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/90 px-3 py-2 sm:hidden shadow-lg transition-colors">
          <div className="max-w-md mx-auto flex items-center justify-around gap-1">
            <button
              id="bottom-nav-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-colors flex-1 ${
                activeTab === 'overview'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Vault</span>
            </button>

            <button
              id="bottom-nav-expenses"
              onClick={() => setActiveTab('expenses')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-colors flex-1 ${
                activeTab === 'expenses'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <Receipt className="w-5 h-5 mb-0.5" />
              <span>Expenses</span>
            </button>

            {/* Floating Central Quick Add Button */}
            <div className="flex-1 flex justify-center -mt-6">
              <button
                id="central-floating-add-btn"
                onClick={() => {
                  if (activeTab === 'expenses') {
                    handleOpenAddExpenseModal();
                  } else {
                    handleOpenAddModal(
                      activeTab !== 'overview' && activeTab !== 'history' && activeTab !== 'ai' && activeTab !== 'debt'
                        ? (activeTab as CategoryId)
                        : undefined
                    );
                  }
                }}
                className="w-13 h-13 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black flex items-center justify-center shadow-xl border-4 border-white dark:border-slate-900 transition-transform active:scale-95"
                title="Record Transaction"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>

            <button
              id="bottom-nav-ledger"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-colors flex-1 ${
                activeTab === 'history'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <History className="w-5 h-5 mb-0.5" />
              <span>Ledger</span>
            </button>

            <button
              id="bottom-nav-ai"
              onClick={() => setActiveTab('ai')}
              className={`flex flex-col items-center justify-center p-1 rounded-xl text-[10px] font-bold transition-colors flex-1 ${
                activeTab === 'ai'
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-5 h-5 mb-0.5" />
              <span>AI Coach</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Quick Add Savings Modal */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={synchronizedCategories}
        initialCategoryId={preselectedCategory || 'home_rent'}
        onSaveEntry={handleSaveEntry}
        onSaveMultipleEntries={handleSaveMultipleEntries}
      />

      {/* Edit Savings Entry Modal */}
      <EditEntryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        categories={synchronizedCategories}
        onUpdateEntry={handleUpdateEntry}
        onDeleteEntry={handleDeleteEntry}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        initialCategory={preselectedExpenseCategory || 'food_dining'}
        onSaveExpense={handleSaveExpense}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={isEditExpenseModalOpen}
        onClose={() => {
          setIsEditExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Firebase Auth & Multi-Device Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        totalEntriesCount={entries.length}
      />

      {/* Settings & Preferences Drawer/Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        categories={synchronizedCategories}
        entries={entries}
        onAccountDeleted={handleAccountDeleted}
      />

      {/* Notifications & Preferences Modal */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenQuickAdd={handleOpenAddModal}
      />

      {/* Desktop Command Palette (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenDeposit={handleOpenAddModal}
        onOpenExpense={handleOpenAddExpenseModal}
        onOpenDebt={() => setActiveTab('debt')}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Desktop Keyboard Shortcuts Modal (?) */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
