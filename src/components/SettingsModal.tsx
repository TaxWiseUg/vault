import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Laptop,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Smartphone,
  Check,
  RefreshCw,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile, CategoryGoal, CategoryId, SavingsEntry } from '../types';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { formatUGX } from '../lib/constants';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
  logout,
  syncLocalDataToFirestore,
  getFriendlyAuthErrorMessage,
  deleteUserAccount,
  clearLocalData,
} from '../lib/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  categories: Record<CategoryId, CategoryGoal>;
  entries: SavingsEntry[];
  onAccountDeleted?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  categories,
  entries,
  onAccountDeleted,
}) => {
  useLockBodyScroll(isOpen);

  const { themeMode, resolvedTheme, setThemeMode } = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Delete account / wipe state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const totalSaved =
    (categories.home_rent?.currentAmount || 0) +
    (categories.internet?.currentAmount || 0) +
    (categories.work_rent?.currentAmount || 0);

  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      await loginWithGoogle();
      setSyncStatus('Successfully signed in with Google!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSyncing(true);
      setErrorMessage(null);
      if (authMode === 'email_register') {
        await registerWithEmail(email, password, name);
        setSyncStatus('Account created & signed in!');
      } else {
        await loginWithEmail(email, password);
        setSyncStatus('Successfully signed in!');
      }
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      console.error('Email auth error:', err);
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      await loginAnonymously();
      setSyncStatus('Connected as Cloud Guest!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      console.error('Guest login error:', err);
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsSyncing(true);
      await logout();
      setSyncStatus('Signed out. Local data preserved.');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      setErrorMessage(null);
      await syncLocalDataToFirestore(user.uid);
      setSyncStatus('All categories & entries synced to Firestore!');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      setErrorMessage(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeletingAccount(true);
    setErrorMessage(null);

    try {
      if (user?.uid) {
        await deleteUserAccount(user.uid);
      } else {
        clearLocalData();
      }

      setSyncStatus('Account and all data permanently deleted.');
      setShowDeleteModal(false);
      if (onAccountDeleted) {
        onAccountDeleted();
      }
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setErrorMessage(getFriendlyAuthErrorMessage(err));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['ID', 'Category', 'Amount (UGX)', 'Date', 'Note', 'Timestamp'];
    const rows = entries.map((e) => {
      const cat = categories[e.categoryId]?.name || e.categoryId;
      return [
        e.id,
        `"${cat}"`,
        e.amount,
        e.date,
        `"${(e.note || '').replace(/"/g, '""')}"`,
        new Date(e.createdAt || Date.now()).toISOString(),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vault-savings-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        id="settings-modal"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-5 h-5 pointer-events-none" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settings & Account</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Preferences, cloud backup & data management
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-settings-modal-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close modal"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        {/* Sync / Notification Status Banner */}
        {syncStatus && (
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold text-center animate-in fade-in">
            {syncStatus}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/80 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">
                  Delete Account Permanently
                </h4>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  This action is irreversible and will delete all data.
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-700 dark:text-rose-400/90 leading-relaxed">
              All your savings goals, {entries.length} deposit records, cloud synchronization data, and account profile will be permanently erased.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                Type <span className="font-mono font-black text-rose-600 dark:text-rose-400">DELETE</span> to confirm:
              </label>
              <input
                id="delete-account-confirm-input"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>

              <button
                id="confirm-delete-account-btn"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-600/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingAccount ? 'Deleting Everything...' : 'Delete My Account'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 1: Account & Cloud Backup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Cloud Backup & Sync
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              {user ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5 text-amber-500" />}
              <span>{user ? 'Firestore Active' : 'Local Storage'}</span>
            </span>
          </div>

          {user ? (
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-12 h-12 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                    {user.displayName?.[0]?.toUpperCase() || 'V'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.displayName || 'Vault User'}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {user.isAnonymous ? 'Guest Cloud Member' : user.email}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-num mt-0.5">
                    {entries.length} savings entries stored
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.98]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isSyncing}
                  className="py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              {/* Selector */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-700/60 text-xs font-bold text-slate-600 dark:text-slate-300">
                <button
                  onClick={() => setAuthMode('google')}
                  className={`py-2 rounded-xl transition-all ${
                    authMode === 'google'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Google 1-Tap
                </button>
                <button
                  onClick={() => setAuthMode('email_login')}
                  className={`py-2 rounded-xl transition-all ${
                    authMode !== 'google'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Email / Password
                </button>
              </div>

              {authMode === 'google' ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sign in with Google to sync your Home Rent, Internet, and Work Rent savings across all devices safely.
                  </p>

                  <button
                    id="settings-google-login-btn"
                    onClick={handleGoogleLogin}
                    disabled={isSyncing}
                    className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{isSyncing ? 'Connecting...' : 'Sign In with Google'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setAuthMode('email_login')}
                      className="py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Use Email</span>
                    </button>
                    <button
                      onClick={handleGuestLogin}
                      disabled={isSyncing}
                      className="py-2.5 px-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1-Tap Guest</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                  {authMode === 'email_register' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Partner Name"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. partner@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="•••••••• (min 6 characters)"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isSyncing
                        ? 'Please wait...'
                        : authMode === 'email_register'
                        ? 'Create Free Account'
                        : 'Sign In With Email'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {authMode === 'email_login' ? (
                      <button
                        type="button"
                        onClick={() => setAuthMode('email_register')}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        New user? Create account
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAuthMode('email_login')}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        Have account? Sign In
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAuthMode('google')}
                      className="text-slate-400 dark:text-slate-500 hover:underline text-[11px]"
                    >
                      Use Google
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Appearance & Theme Mode */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Appearance & Theme
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                { id: 'system' as ThemeMode, label: 'Auto (Device)', icon: Laptop },
                { id: 'light' as ThemeMode, label: 'Light', icon: Sun },
                { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
              ] as const
            ).map((t) => {
              const isSelected = themeMode === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  id={`settings-theme-${t.id}`}
                  onClick={() => setThemeMode(t.id)}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Data & Export */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Data & Export
          </div>

          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Export Savings Ledger
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Download all records as a CSV spreadsheet
              </div>
            </div>

            <button
              onClick={exportCSV}
              disabled={entries.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Section 4: Danger Zone - Delete Account */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
            Danger Zone
          </div>

          <div className="p-4 rounded-3xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-rose-900 dark:text-rose-300">
                {user ? 'Delete Account & All Data' : 'Reset Database & Clear All Data'}
              </div>
              <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                Permanently erase all {entries.length} savings entries, targets, and account access
              </div>
            </div>

            <button
              id="open-delete-account-modal-btn"
              onClick={() => setShowDeleteModal(true)}
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{user ? 'Delete Account' : 'Clear All Data'}</span>
            </button>
          </div>
        </div>

        {/* Section 5: Vault App Summary Info */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-indigo-100 dark:border-indigo-900/60">
              <img src="/favicon.svg" alt="Vault Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">Vault UGX</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">v1.2</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Smart Daily Savings & Multi-Device Sync</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between font-medium">
              <span>Total Saved This Cycle:</span>
              <span className="font-mono-num font-bold text-slate-900 dark:text-white">
                {formatUGX(totalSaved)}
              </span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span>Currency:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">UGX (Ugandan Shillings)</span>
            </div>
            <div className="flex items-center justify-between font-medium">
              <span>Categories Tracked:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Home Rent (130k) • Internet (70k) • Work (100k)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
