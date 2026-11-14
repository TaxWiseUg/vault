import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CategoryGoal, CategoryId, SavingsEntry, UserProfile, ExpenseEntry, DebtGoal, DebtPaymentEntry } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_OFFICE_DEBT } from './constants';

const metaEnv = ((import.meta as unknown) as { env: Record<string, string> }).env || {};

const effectiveConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const firestoreDbId = metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId;

const app = getApps().length === 0 ? initializeApp(effectiveConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firestoreDbId || undefined);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Format raw Firebase errors into clear, friendly messages for mobile & desktop users
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = error.code || '';
  const message = error.message || '';

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('closing') ||
    message.includes('hidden') ||
    message.includes('popup')
  ) {
    return 'Google sign-in popup was closed or interrupted by your mobile browser. You can retry Google, or use Email/Password or 1-Tap Guest below.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup blocked by browser. Please enable popups or use Email/Password.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/requires-recent-login') {
    return 'For security, deleting your account requires a recent sign-in. Please sign in again and retry.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  return message || 'Authentication failed. Please try again.';
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName: displayName.trim() });
    }
    return result.user;
  } catch (error: any) {
    console.error('Error registering with email:', error);
    throw error;
  }
}

export async function loginAnonymously() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// LocalStorage backup keys
const LOCAL_CATEGORIES_KEY = 'ugx_budget_categories_v1';
const LOCAL_ENTRIES_KEY = 'ugx_budget_entries_v1';
const LOCAL_EXPENSES_KEY = 'ugx_budget_expenses_v1';
const LOCAL_DEBT_GOAL_KEY = 'ugx_office_debt_goal_v1';
const LOCAL_DEBT_PAYMENTS_KEY = 'ugx_office_debt_payments_v1';
const LOCAL_OWNER_KEY = 'ugx_budget_owner_uid_v1';
const LOCAL_DATA_KEYS = [
  LOCAL_CATEGORIES_KEY,
  LOCAL_ENTRIES_KEY,
  LOCAL_EXPENSES_KEY,
  LOCAL_DEBT_GOAL_KEY,
  LOCAL_DEBT_PAYMENTS_KEY,
] as const;

function saveActiveLocalDataForOwner(userId: string) {
  LOCAL_DATA_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) localStorage.setItem(`${key}:${userId}`, value);
    localStorage.removeItem(key);
  });
  localStorage.removeItem(LOCAL_OWNER_KEY);
}

export function prepareLocalDataForUser(userId: string) {
  const owner = localStorage.getItem(LOCAL_OWNER_KEY);
  if (owner === userId) return;
  if (owner) saveActiveLocalDataForOwner(owner);

  const hasAccountCache = LOCAL_DATA_KEYS.some((key) => localStorage.getItem(`${key}:${userId}`) !== null);
  if (hasAccountCache) {
    LOCAL_DATA_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      const value = localStorage.getItem(`${key}:${userId}`);
      if (value !== null) localStorage.setItem(key, value);
    });
  }
  localStorage.setItem(LOCAL_OWNER_KEY, userId);
}

export function clearOwnedLocalData() {
  const owner = localStorage.getItem(LOCAL_OWNER_KEY);
  if (owner) saveActiveLocalDataForOwner(owner);
}

export function getLocalCategories(): Record<CategoryId, CategoryGoal> {
  try {
    const saved = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CATEGORIES,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to read local categories', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveLocalCategories(categories: Record<CategoryId, CategoryGoal>) {
  try {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save local categories', e);
  }
}

export function getLocalEntries(): SavingsEntry[] {
  try {
    const saved = localStorage.getItem(LOCAL_ENTRIES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to read local entries', e);
  }
  return [];
}

export function saveLocalEntries(entries: SavingsEntry[]) {
  try {
    localStorage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save local entries', e);
  }
}

export function getLocalExpenses(): ExpenseEntry[] {
  try {
    const saved = localStorage.getItem(LOCAL_EXPENSES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to read local expenses', e);
  }
  return [];
}

export function saveLocalExpenses(expenses: ExpenseEntry[]) {
  try {
    localStorage.setItem(LOCAL_EXPENSES_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.error('Failed to save local expenses', e);
  }
}

export function getLocalDebtGoal(): DebtGoal {
  try {
    const saved = localStorage.getItem(LOCAL_DEBT_GOAL_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_OFFICE_DEBT,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to read local debt goal', e);
  }
  return DEFAULT_OFFICE_DEBT;
}

export function saveLocalDebtGoal(debt: DebtGoal) {
  try {
    localStorage.setItem(LOCAL_DEBT_GOAL_KEY, JSON.stringify(debt));
  } catch (e) {
    console.error('Failed to save local debt goal', e);
  }
}

export function getLocalDebtPayments(): DebtPaymentEntry[] {
  try {
    const saved = localStorage.getItem(LOCAL_DEBT_PAYMENTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to read local debt payments', e);
  }
  return [];
}

export function saveLocalDebtPayments(payments: DebtPaymentEntry[]) {
  try {
    localStorage.setItem(LOCAL_DEBT_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (e) {
    console.error('Failed to save local debt payments', e);
  }
}

export function clearLocalData() {
  try {
    const owner = localStorage.getItem(LOCAL_OWNER_KEY);
    localStorage.removeItem(LOCAL_CATEGORIES_KEY);
    localStorage.removeItem(LOCAL_ENTRIES_KEY);
    localStorage.removeItem(LOCAL_EXPENSES_KEY);
    localStorage.removeItem(LOCAL_DEBT_GOAL_KEY);
    localStorage.removeItem(LOCAL_DEBT_PAYMENTS_KEY);
    localStorage.removeItem(LOCAL_OWNER_KEY);
    if (owner) LOCAL_DATA_KEYS.forEach((key) => localStorage.removeItem(`${key}:${owner}`));
  } catch (e) {
    console.error('Failed to clear local data', e);
  }
}

// ==================== FIRESTORE REAL-TIME MULTI-DEVICE SUBSCRIBERS ====================

export function subscribeToUserCategories(
  userId: string,
  callback: (categories: Record<CategoryId, CategoryGoal>) => void
) {
  const categoriesRef = collection(db, 'users', userId, 'categories');
  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      if (snapshot.empty) {
        initializeUserCategories(userId, getLocalCategories()).then(() => {
          callback(getLocalCategories());
        });
        return;
      }
      const loaded: Partial<Record<CategoryId, CategoryGoal>> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CategoryGoal;
        const catId = docSnap.id as CategoryId;
        const defaultCat = DEFAULT_CATEGORIES[catId] || DEFAULT_CATEGORIES.home_rent;
        loaded[catId] = {
          ...defaultCat,
          ...data,
          id: catId,
        };
      });
      const fullResult: Record<CategoryId, CategoryGoal> = {
        home_rent: loaded.home_rent || DEFAULT_CATEGORIES.home_rent,
        internet: loaded.internet || DEFAULT_CATEGORIES.internet,
        work_rent: loaded.work_rent || DEFAULT_CATEGORIES.work_rent,
      };
      saveLocalCategories(fullResult);
      callback(fullResult);
    },
    (error) => {
      console.warn('Firestore categories subscription error, fallback to local', error);
      callback(getLocalCategories());
    }
  );
}

export async function initializeUserCategories(
  userId: string,
  currentCategories: Record<CategoryId, CategoryGoal>
) {
  try {
    const batch = writeBatch(db);
    for (const [key, category] of Object.entries(currentCategories)) {
      const catRef = doc(db, 'users', userId, 'categories', key);
      batch.set(
        catRef,
        {
          id: category.id,
          name: category.name,
          targetAmount: category.targetAmount,
          currentAmount: category.currentAmount || 0,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    await batch.commit();
  } catch (e) {
    console.error('Error initializing user categories in Firestore:', e);
  }
}

export function subscribeToUserEntries(
  userId: string,
  callback: (entries: SavingsEntry[]) => void
) {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      // If Firestore is empty but we have local entries, migrate local entries to Firestore!
      if (snapshot.empty) {
        const localEntries = getLocalEntries();
        if (localEntries.length > 0) {
          syncLocalDataToFirestore(userId).then(() => {
            callback(localEntries);
          }).catch((error) => {
            console.error('Could not migrate local savings entries:', error);
            callback(getLocalEntries());
          });
          return;
        }
      }

      const entries: SavingsEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push({ ...(docSnap.data() as SavingsEntry), id: docSnap.id });
      });
      saveLocalEntries(entries);
      callback(entries);
    },
    (error) => {
      console.warn('Firestore entries subscription error, fallback to local', error);
      callback(getLocalEntries());
    }
  );
}

export function subscribeToUserExpenses(
  userId: string,
  callback: (expenses: ExpenseEntry[]) => void
) {
  const expensesRef = collection(db, 'users', userId, 'expenses');
  const q = query(expensesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const localExpenses = getLocalExpenses();
        if (localExpenses.length > 0) {
          syncLocalDataToFirestore(userId).then(() => {
            callback(localExpenses);
          }).catch((error) => {
            console.error('Could not migrate local expenses:', error);
            callback(getLocalExpenses());
          });
          return;
        }
      }

      const expenses: ExpenseEntry[] = [];
      snapshot.forEach((docSnap) => {
        expenses.push({ ...(docSnap.data() as ExpenseEntry), id: docSnap.id });
      });
      saveLocalExpenses(expenses);
      callback(expenses);
    },
    (error) => {
      console.warn('Firestore expenses subscription error, fallback to local', error);
      callback(getLocalExpenses());
    }
  );
}

// ==================== OFFICE DEBT SUBSCRIBERS & CRUD ====================

export function subscribeToUserDebtGoal(
  userId: string,
  callback: (debt: DebtGoal) => void
) {
  const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
  return onSnapshot(
    debtRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        const localDebt = getLocalDebtGoal();
        setDoc(
          debtRef,
          {
            ...localDebt,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(console.error);
        callback(localDebt);
        return;
      }
      const data = snapshot.data() as DebtGoal;
      const fullDebt: DebtGoal = {
        ...DEFAULT_OFFICE_DEBT,
        ...data,
        id: 'office_debt',
      };
      saveLocalDebtGoal(fullDebt);
      callback(fullDebt);
    },
    (error) => {
      console.warn('Firestore debt goal subscription error, fallback to local', error);
      callback(getLocalDebtGoal());
    }
  );
}

export function subscribeToUserDebtPayments(
  userId: string,
  callback: (payments: DebtPaymentEntry[]) => void
) {
  const paymentsRef = collection(db, 'users', userId, 'debt_payments');
  const q = query(paymentsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        const localPayments = getLocalDebtPayments();
        if (localPayments.length > 0) {
          const batch = writeBatch(db);
          localPayments.forEach((p) => {
            batch.set(doc(db, 'users', userId, 'debt_payments', p.id), { ...p, userId }, { merge: true });
          });
          batch.commit().catch(console.error);
          callback(localPayments);
          return;
        }
      }

      const payments: DebtPaymentEntry[] = [];
      snapshot.forEach((docSnap) => {
        payments.push({ ...(docSnap.data() as DebtPaymentEntry), id: docSnap.id });
      });
      saveLocalDebtPayments(payments);
      callback(payments);
    },
    (error) => {
      console.warn('Firestore debt payments subscription error, fallback to local', error);
      callback(getLocalDebtPayments());
    }
  );
}

export async function addDebtPaymentToDb(
  userId: string | null,
  payment: Omit<DebtPaymentEntry, 'id'>,
  currentDebt: DebtGoal,
  currentCategories?: Record<CategoryId, CategoryGoal>
): Promise<DebtPaymentEntry> {
  const newId = `debt_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullPayment: DebtPaymentEntry = {
    ...payment,
    id: newId,
    userId: userId || undefined,
  };

  // 1. Update local cache immediately
  const currentPayments = getLocalDebtPayments();
  const updatedPayments = [fullPayment, ...currentPayments];
  saveLocalDebtPayments(updatedPayments);

  const updatedDebt: DebtGoal = {
    ...currentDebt,
    paidAmount: (currentDebt.paidAmount || 0) + payment.amount,
    updatedAt: new Date().toISOString(),
  };
  saveLocalDebtGoal(updatedDebt);

  let updatedCategories: Record<CategoryId, CategoryGoal> | undefined;
  if (
    payment.deductFromVault &&
    payment.sourceAccount &&
    payment.sourceAccount !== 'general_wallet' &&
    currentCategories &&
    currentCategories[payment.sourceAccount as CategoryId]
  ) {
    const catId = payment.sourceAccount as CategoryId;
    const cat = currentCategories[catId];
    updatedCategories = {
      ...currentCategories,
      [catId]: {
        ...cat,
        currentAmount: Math.max(0, (cat.currentAmount || 0) - payment.amount),
        updatedAt: new Date().toISOString(),
      },
    };
    saveLocalCategories(updatedCategories);
  }

  // 2. Broadcast to Firestore
  if (userId) {
    try {
      const batch = writeBatch(db);
      const payRef = doc(db, 'users', userId, 'debt_payments', newId);
      batch.set(payRef, fullPayment);

      const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
      batch.set(debtRef, updatedDebt, { merge: true });

      if (updatedCategories && payment.sourceAccount && payment.sourceAccount !== 'general_wallet') {
        const catId = payment.sourceAccount as CategoryId;
        const catRef = doc(db, 'users', userId, 'categories', catId);
        batch.set(catRef, updatedCategories[catId], { merge: true });
      }

      await batch.commit();
    } catch (e) {
      console.error('Failed to sync debt payment to Firestore:', e);
    }
  }

  return fullPayment;
}

export async function updateDebtPaymentInDb(
  userId: string | null,
  updatedPayment: DebtPaymentEntry,
  oldPayment: DebtPaymentEntry,
  currentDebt: DebtGoal,
  currentCategories?: Record<CategoryId, CategoryGoal>
): Promise<DebtPaymentEntry> {
  const diff = updatedPayment.amount - oldPayment.amount;

  const currentPayments = getLocalDebtPayments();
  const updatedPayments = currentPayments.map((p) => (p.id === updatedPayment.id ? updatedPayment : p));
  saveLocalDebtPayments(updatedPayments);

  const updatedDebt: DebtGoal = {
    ...currentDebt,
    paidAmount: Math.max(0, (currentDebt.paidAmount || 0) + diff),
    updatedAt: new Date().toISOString(),
  };
  saveLocalDebtGoal(updatedDebt);

  let updatedCategories: Record<CategoryId, CategoryGoal> | undefined;
  if (
    updatedPayment.deductFromVault &&
    updatedPayment.sourceAccount &&
    updatedPayment.sourceAccount !== 'general_wallet' &&
    currentCategories &&
    currentCategories[updatedPayment.sourceAccount as CategoryId]
  ) {
    const catId = updatedPayment.sourceAccount as CategoryId;
    const cat = currentCategories[catId];
    updatedCategories = {
      ...currentCategories,
      [catId]: {
        ...cat,
        currentAmount: Math.max(0, (cat.currentAmount || 0) - diff),
        updatedAt: new Date().toISOString(),
      },
    };
    saveLocalCategories(updatedCategories);
  }

  if (userId) {
    try {
      const batch = writeBatch(db);
      const payRef = doc(db, 'users', userId, 'debt_payments', updatedPayment.id);
      batch.set(payRef, updatedPayment, { merge: true });

      const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
      batch.set(debtRef, updatedDebt, { merge: true });

      if (updatedCategories && updatedPayment.sourceAccount && updatedPayment.sourceAccount !== 'general_wallet') {
        const catId = updatedPayment.sourceAccount as CategoryId;
        const catRef = doc(db, 'users', userId, 'categories', catId);
        batch.set(catRef, updatedCategories[catId], { merge: true });
      }

      await batch.commit();
    } catch (e) {
      console.error('Failed to update debt payment in Firestore:', e);
    }
  }

  return updatedPayment;
}

export async function deleteDebtPaymentFromDb(
  userId: string | null,
  paymentId: string,
  payment: DebtPaymentEntry,
  currentDebt: DebtGoal,
  currentCategories?: Record<CategoryId, CategoryGoal>
): Promise<void> {
  const currentPayments = getLocalDebtPayments();
  const updatedPayments = currentPayments.filter((p) => p.id !== paymentId);
  saveLocalDebtPayments(updatedPayments);

  const updatedDebt: DebtGoal = {
    ...currentDebt,
    paidAmount: Math.max(0, (currentDebt.paidAmount || 0) - payment.amount),
    updatedAt: new Date().toISOString(),
  };
  saveLocalDebtGoal(updatedDebt);

  let updatedCategories: Record<CategoryId, CategoryGoal> | undefined;
  if (
    payment.deductFromVault &&
    payment.sourceAccount &&
    payment.sourceAccount !== 'general_wallet' &&
    currentCategories &&
    currentCategories[payment.sourceAccount as CategoryId]
  ) {
    const catId = payment.sourceAccount as CategoryId;
    const cat = currentCategories[catId];
    updatedCategories = {
      ...currentCategories,
      [catId]: {
        ...cat,
        currentAmount: (cat.currentAmount || 0) + payment.amount,
        updatedAt: new Date().toISOString(),
      },
    };
    saveLocalCategories(updatedCategories);
  }

  if (userId) {
    try {
      const batch = writeBatch(db);
      const payRef = doc(db, 'users', userId, 'debt_payments', paymentId);
      batch.delete(payRef);

      const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
      batch.set(debtRef, updatedDebt, { merge: true });

      if (updatedCategories && payment.sourceAccount && payment.sourceAccount !== 'general_wallet') {
        const catId = payment.sourceAccount as CategoryId;
        const catRef = doc(db, 'users', userId, 'categories', catId);
        batch.set(catRef, updatedCategories[catId], { merge: true });
      }

      await batch.commit();
    } catch (e) {
      console.error('Failed to delete debt payment in Firestore:', e);
    }
  }
}

export async function updateDebtGoalConfigInDb(
  userId: string | null,
  updatedFields: Partial<DebtGoal>,
  currentDebt: DebtGoal
): Promise<DebtGoal> {
  const updatedDebt: DebtGoal = {
    ...currentDebt,
    ...updatedFields,
    id: 'office_debt',
    updatedAt: new Date().toISOString(),
  };
  saveLocalDebtGoal(updatedDebt);

  if (userId) {
    try {
      const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
      await setDoc(debtRef, updatedDebt, { merge: true });
    } catch (e) {
      console.error('Failed to update debt goal config in Firestore:', e);
    }
  }

  return updatedDebt;
}

export async function resetDebtPaidProgressInDb(
  userId: string | null,
  currentDebt: DebtGoal
): Promise<DebtGoal> {
  const updatedDebt: DebtGoal = {
    ...currentDebt,
    paidAmount: 0,
    updatedAt: new Date().toISOString(),
  };
  saveLocalDebtGoal(updatedDebt);

  if (userId) {
    try {
      const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
      await setDoc(debtRef, updatedDebt, { merge: true });
    } catch (e) {
      console.error('Failed to reset debt progress in Firestore:', e);
    }
  }

  return updatedDebt;
}

// ==================== EXPENSE ENTRIES CRUD (REALTIME MULTI-DEVICE SYNC) ====================

export async function addExpenseEntryToDb(
  userId: string | null,
  expense: Omit<ExpenseEntry, 'id'>
): Promise<ExpenseEntry> {
  const newId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullExpense: ExpenseEntry = {
    ...expense,
    id: newId,
    userId: userId || undefined,
  };

  // 1. Update local cache immediately
  const currentExpenses = getLocalExpenses();
  const updatedExpenses = [fullExpense, ...currentExpenses];
  saveLocalExpenses(updatedExpenses);

  // 2. Broadcast to Firestore
  if (userId) {
    try {
      const expRef = doc(db, 'users', userId, 'expenses', newId);
      await setDoc(expRef, fullExpense);
    } catch (e) {
      console.error('Failed to save expense to Firestore:', e);
    }
  }

  return fullExpense;
}

export async function updateExpenseEntryInDb(
  userId: string | null,
  updatedExpense: ExpenseEntry
): Promise<ExpenseEntry> {
  // 1. Update local cache
  const currentExpenses = getLocalExpenses();
  const updatedExpenses = currentExpenses.map((e) => (e.id === updatedExpense.id ? updatedExpense : e));
  saveLocalExpenses(updatedExpenses);

  // 2. Sync to Firestore
  if (userId) {
    try {
      const expRef = doc(db, 'users', userId, 'expenses', updatedExpense.id);
      await setDoc(expRef, updatedExpense, { merge: true });
    } catch (e) {
      console.error('Failed to update expense in Firestore:', e);
    }
  }

  return updatedExpense;
}

export async function deleteExpenseEntryFromDb(
  userId: string | null,
  expenseId: string
): Promise<void> {
  // 1. Update local cache
  const currentExpenses = getLocalExpenses();
  const updatedExpenses = currentExpenses.filter((e) => e.id !== expenseId);
  saveLocalExpenses(updatedExpenses);

  // 2. Sync to Firestore
  if (userId) {
    try {
      const expRef = doc(db, 'users', userId, 'expenses', expenseId);
      await deleteDoc(expRef);
    } catch (e) {
      console.error('Failed to delete expense from Firestore:', e);
    }
  }
}

// ==================== SAVINGS ENTRIES CRUD (REALTIME MULTI-DEVICE SYNC) ====================

export async function addMultipleSavingsEntriesToDb(
  userId: string | null,
  entries: Array<Omit<SavingsEntry, 'id'>>,
  currentCategories: Record<CategoryId, CategoryGoal>
): Promise<SavingsEntry[]> {
  if (entries.length === 0) return [];

  const timestamp = Date.now();
  const createdEntries: SavingsEntry[] = entries.map((entry, idx) => ({
    ...entry,
    id: `entry_${timestamp}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || undefined,
  }));

  // 1. Immediately update local cache for zero-latency UI
  const currentEntries = getLocalEntries();
  const updatedEntries = [...createdEntries, ...currentEntries];
  saveLocalEntries(updatedEntries);

  const updatedCategories: Record<CategoryId, CategoryGoal> = { ...currentCategories };
  for (const entry of createdEntries) {
    const cat = updatedCategories[entry.categoryId] || DEFAULT_CATEGORIES[entry.categoryId];
    updatedCategories[entry.categoryId] = {
      ...cat,
      currentAmount: (cat.currentAmount || 0) + entry.amount,
      updatedAt: new Date().toISOString(),
    };
  }
  saveLocalCategories(updatedCategories);

  // 2. Broadcast to Firestore for all other devices signed into the same account
  if (userId) {
    try {
      const batch = writeBatch(db);
      for (const entry of createdEntries) {
        const entryRef = doc(db, 'users', userId, 'entries', entry.id);
        batch.set(entryRef, entry);
      }

      const touchedCatIds = Array.from(new Set(createdEntries.map((e) => e.categoryId)));
      for (const catId of touchedCatIds) {
        const cat = updatedCategories[catId];
        const catRef = doc(db, 'users', userId, 'categories', catId);
        batch.set(
          catRef,
          {
            id: catId,
            name: cat.name,
            targetAmount: cat.targetAmount,
            currentAmount: cat.currentAmount,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      await batch.commit();
    } catch (e) {
      console.error('Failed to sync batch entries to Firestore:', e);
    }
  }

  return createdEntries;
}

export async function addSavingsEntryToDb(
  userId: string | null,
  entry: Omit<SavingsEntry, 'id'>,
  currentCategories: Record<CategoryId, CategoryGoal>
): Promise<SavingsEntry> {
  const newId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullEntry: SavingsEntry = {
    ...entry,
    id: newId,
    userId: userId || undefined,
  };

  // 1. Immediately update local cache for zero-latency UI
  const currentEntries = getLocalEntries();
  const updatedEntries = [fullEntry, ...currentEntries];
  saveLocalEntries(updatedEntries);

  const cat = currentCategories[entry.categoryId] || DEFAULT_CATEGORIES[entry.categoryId];
  const updatedCategories: Record<CategoryId, CategoryGoal> = {
    ...currentCategories,
    [entry.categoryId]: {
      ...cat,
      currentAmount: (cat.currentAmount || 0) + entry.amount,
      updatedAt: new Date().toISOString(),
    },
  };
  saveLocalCategories(updatedCategories);

  // 2. Broadcast to Firestore for all other devices signed into the same account
  if (userId) {
    try {
      const batch = writeBatch(db);
      const entryRef = doc(db, 'users', userId, 'entries', newId);
      batch.set(entryRef, fullEntry);

      const catRef = doc(db, 'users', userId, 'categories', entry.categoryId);
      batch.set(
        catRef,
        {
          id: entry.categoryId,
          name: cat.name,
          targetAmount: cat.targetAmount,
          currentAmount: updatedCategories[entry.categoryId].currentAmount,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      await batch.commit();
    } catch (e) {
      console.error('Failed to sync new entry to Firestore:', e);
    }
  }

  return fullEntry;
}

export async function updateSavingsEntryInDb(
  userId: string | null,
  updatedEntry: SavingsEntry,
  oldEntry: SavingsEntry,
  currentCategories: Record<CategoryId, CategoryGoal>
): Promise<SavingsEntry> {
  // 1. Update local cache
  const currentEntries = getLocalEntries();
  const updatedEntries = currentEntries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e));
  saveLocalEntries(updatedEntries);

  // Recalculate categories amounts
  const updatedCategories: Record<CategoryId, CategoryGoal> = { ...currentCategories };

  if (updatedEntry.categoryId === oldEntry.categoryId) {
    const cat = updatedCategories[updatedEntry.categoryId] || DEFAULT_CATEGORIES[updatedEntry.categoryId];
    const diff = updatedEntry.amount - oldEntry.amount;
    const newCurrent = Math.max(0, (cat.currentAmount || 0) + diff);
    updatedCategories[updatedEntry.categoryId] = {
      ...cat,
      currentAmount: newCurrent,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Old category reduced
    const oldCat = updatedCategories[oldEntry.categoryId] || DEFAULT_CATEGORIES[oldEntry.categoryId];
    const oldCatCurrent = Math.max(0, (oldCat.currentAmount || 0) - oldEntry.amount);
    updatedCategories[oldEntry.categoryId] = {
      ...oldCat,
      currentAmount: oldCatCurrent,
      updatedAt: new Date().toISOString(),
    };

    // New category increased
    const newCat = updatedCategories[updatedEntry.categoryId] || DEFAULT_CATEGORIES[updatedEntry.categoryId];
    const newCatCurrent = (newCat.currentAmount || 0) + updatedEntry.amount;
    updatedCategories[updatedEntry.categoryId] = {
      ...newCat,
      currentAmount: newCatCurrent,
      updatedAt: new Date().toISOString(),
    };
  }

  saveLocalCategories(updatedCategories);

  // 2. Sync to Firestore
  if (userId) {
    try {
      const batch = writeBatch(db);
      const entryRef = doc(db, 'users', userId, 'entries', updatedEntry.id);
      batch.set(entryRef, updatedEntry, { merge: true });

      if (updatedEntry.categoryId === oldEntry.categoryId) {
        const catRef = doc(db, 'users', userId, 'categories', updatedEntry.categoryId);
        batch.set(
          catRef,
          {
            currentAmount: updatedCategories[updatedEntry.categoryId].currentAmount,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } else {
        const oldCatRef = doc(db, 'users', userId, 'categories', oldEntry.categoryId);
        batch.set(
          oldCatRef,
          {
            currentAmount: updatedCategories[oldEntry.categoryId].currentAmount,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        const newCatRef = doc(db, 'users', userId, 'categories', updatedEntry.categoryId);
        batch.set(
          newCatRef,
          {
            currentAmount: updatedCategories[updatedEntry.categoryId].currentAmount,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      await batch.commit();
    } catch (e) {
      console.error('Failed to update entry in Firestore:', e);
    }
  }

  return updatedEntry;
}

export async function deleteSavingsEntryFromDb(
  userId: string | null,
  entry: SavingsEntry,
  currentCategories: Record<CategoryId, CategoryGoal>
) {
  // 1. Update local cache
  const currentEntries = getLocalEntries();
  const updatedEntries = currentEntries.filter((e) => e.id !== entry.id);
  saveLocalEntries(updatedEntries);

  const cat = currentCategories[entry.categoryId] || DEFAULT_CATEGORIES[entry.categoryId];
  const newCurrent = Math.max(0, (cat.currentAmount || 0) - entry.amount);
  const updatedCategories: Record<CategoryId, CategoryGoal> = {
    ...currentCategories,
    [entry.categoryId]: {
      ...cat,
      currentAmount: newCurrent,
      updatedAt: new Date().toISOString(),
    },
  };
  saveLocalCategories(updatedCategories);

  // 2. Sync to Firestore
  if (userId) {
    try {
      const batch = writeBatch(db);
      const entryRef = doc(db, 'users', userId, 'entries', entry.id);
      batch.delete(entryRef);

      const catRef = doc(db, 'users', userId, 'categories', entry.categoryId);
      batch.set(
        catRef,
        {
          currentAmount: newCurrent,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      await batch.commit();
    } catch (e) {
      console.error('Failed to delete entry from Firestore:', e);
    }
  }
}

export async function updateCategoryTargetInDb(
  userId: string | null,
  categoryId: CategoryId,
  newTarget: number,
  currentCategories: Record<CategoryId, CategoryGoal>
) {
  const cat = currentCategories[categoryId] || DEFAULT_CATEGORIES[categoryId];
  const updatedCategories: Record<CategoryId, CategoryGoal> = {
    ...currentCategories,
    [categoryId]: {
      ...cat,
      targetAmount: newTarget,
      updatedAt: new Date().toISOString(),
    },
  };
  saveLocalCategories(updatedCategories);

  if (userId) {
    try {
      const catRef = doc(db, 'users', userId, 'categories', categoryId);
      await setDoc(
        catRef,
        {
          targetAmount: newTarget,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to update category target in Firestore:', e);
    }
  }
}

export async function resetCategoryProgressInDb(
  userId: string | null,
  categoryId: CategoryId,
  currentCategories: Record<CategoryId, CategoryGoal>
) {
  const cat = currentCategories[categoryId] || DEFAULT_CATEGORIES[categoryId];
  const updatedCategories: Record<CategoryId, CategoryGoal> = {
    ...currentCategories,
    [categoryId]: {
      ...cat,
      currentAmount: 0,
      updatedAt: new Date().toISOString(),
    },
  };
  saveLocalCategories(updatedCategories);

  if (userId) {
    try {
      const catRef = doc(db, 'users', userId, 'categories', categoryId);
      await setDoc(
        catRef,
        {
          currentAmount: 0,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to reset category in Firestore:', e);
    }
  }
}

export async function syncLocalDataToFirestore(userId: string) {
  const owner = localStorage.getItem(LOCAL_OWNER_KEY);
  if (owner && owner !== userId) {
    throw new Error('Local data belongs to another account and cannot be synced.');
  }

  try {
    const localCategories = getLocalCategories();
    const localEntries = getLocalEntries();
    const localExpenses = getLocalExpenses();
    const localDebtGoal = getLocalDebtGoal();
    const localDebtPayments = getLocalDebtPayments();

    const writes: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];

    for (const [key, category] of Object.entries(localCategories)) {
      const catRef = doc(db, 'users', userId, 'categories', key);
      writes.push((batch) => batch.set(
        catRef,
        {
          id: category.id,
          name: category.name,
          targetAmount: category.targetAmount,
          currentAmount: category.currentAmount || 0,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ));
    }

    for (const entry of localEntries) {
      const entryRef = doc(db, 'users', userId, 'entries', entry.id);
      writes.push((batch) => batch.set(
        entryRef,
        {
          ...entry,
          userId,
        },
        { merge: true }
      ));
    }

    for (const expense of localExpenses) {
      const expRef = doc(db, 'users', userId, 'expenses', expense.id);
      writes.push((batch) => batch.set(
        expRef,
        {
          ...expense,
          userId,
        },
        { merge: true }
      ));
    }

    // Sync office debt
    const debtRef = doc(db, 'users', userId, 'debt', 'office_debt');
    writes.push((batch) => batch.set(
      debtRef,
      {
        ...localDebtGoal,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    ));

    for (const payment of localDebtPayments) {
      const payRef = doc(db, 'users', userId, 'debt_payments', payment.id);
      writes.push((batch) => batch.set(
        payRef,
        {
          ...payment,
          userId,
        },
        { merge: true }
      ));
    }

    for (let offset = 0; offset < writes.length; offset += 450) {
      const batch = writeBatch(db);
      writes.slice(offset, offset + 450).forEach((write) => write(batch));
      await batch.commit();
    }
    localStorage.setItem(LOCAL_OWNER_KEY, userId);
  } catch (e) {
    console.error('Error syncing local data to Firestore:', e);
    throw e;
  }
}

/**
 * Permanently deletes the user's Firestore data, local data, and Firebase auth account.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const collections = ['categories', 'entries', 'expenses', 'debt_payments'] as const;
  const refs = [];

  for (const name of collections) {
    const snapshot = await getDocs(collection(db, 'users', userId, name));
    snapshot.forEach((item) => refs.push(item.ref));
  }

  refs.push(doc(db, 'users', userId, 'debt', 'office_debt'));
  refs.push(doc(db, 'users', userId));

  for (let offset = 0; offset < refs.length; offset += 450) {
    const batch = writeBatch(db);
    refs.slice(offset, offset + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  if (auth.currentUser?.uid === userId) {
    await deleteUser(auth.currentUser);
  }

  clearLocalData();
}
