import React, { useState } from 'react';
import {
  X,
  Bell,
  BellRing,
  BellOff,
  CheckCheck,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  Send,
  Sliders,
  Check,
  ChevronRight,
  Shield,
  Smartphone,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { AppNotification, CategoryId } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenQuickAdd: (categoryId?: CategoryId) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenQuickAdd,
}) => {
  useLockBodyScroll(isOpen);

  const {
    notifications,
    unreadCount,
    preferences,
    permissionStatus,
    requestPermission,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    sendTestNotification,
  } = useNotifications();

  const [activeSubTab, setActiveSubTab] = useState<'inbox' | 'settings'>('inbox');
  const [requestingPerm, setRequestingPerm] = useState(false);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setRequestingPerm(true);
    await requestPermission();
    setRequestingPerm(false);
  };

  const getNotifIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'milestone':
        return <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'daily_reminder':
        return <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'streak':
        return <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'pace_warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="notification-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-[40px] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center relative shadow-sm">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center font-mono-num shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications & Alerts</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Daily savings reminders & budget pacing
              </p>
            </div>
          </div>

          <button
            id="close-notifications-btn"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Tabs: Inbox vs Notification Settings */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
          <button
            id="notif-tab-inbox"
            onClick={() => setActiveSubTab('inbox')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'inbox'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Inbox ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>

          <button
            id="notif-tab-settings"
            onClick={() => setActiveSubTab('settings')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'settings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Alert Preferences</span>
          </button>
        </div>

        {/* Tab 1: Notification Inbox */}
        {activeSubTab === 'inbox' && (
          <div className="space-y-4">
            {/* Actions Bar: Mark all read & Clear */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between text-xs font-bold">
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:opacity-40 flex items-center gap-1 transition-opacity"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all as read</span>
                </button>

                <button
                  onClick={clearAllNotifications}
                  className="text-rose-500 dark:text-rose-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear inbox</span>
                </button>
              </div>
            )}

            {/* Notification List */}
            {notifications.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <BellOff className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No notifications yet
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    You're all caught up on your daily micro-saving targets!
                  </p>
                </div>
                <button
                  onClick={sendTestNotification}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Reminder</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => {
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 rounded-3xl border transition-all relative ${
                        !n.read
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                          {getNotifIcon(n.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {n.title}
                            </h4>
                            <span className="text-[10px] font-mono-num text-slate-400 dark:text-slate-500 shrink-0">
                              {formatTimeAgo(n.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {n.message}
                          </p>

                          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            {n.actionTab && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                  onNavigateTab(n.actionTab);
                                  onClose();
                                }}
                                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                <span>Go to {n.actionTab}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="text-[10px] text-slate-400 hover:text-rose-500 ml-auto flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Notification Preferences & Web Push */}
        {activeSubTab === 'settings' && (
          <div className="space-y-4">
            {/* Native Browser Push Permission Card */}
            <div className="p-4 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Browser & Device Notifications
                  </div>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                    Receive background alerts on your phone or desktop when it's time to log your daily savings.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Status:{' '}
                  <span
                    className={`font-black ${
                      permissionStatus === 'granted'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : permissionStatus === 'denied'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {permissionStatus === 'granted'
                      ? 'Enabled (Active)'
                      : permissionStatus === 'denied'
                      ? 'Blocked by browser'
                      : 'Permission Needed'}
                  </span>
                </span>

                {permissionStatus !== 'granted' ? (
                  <button
                    onClick={handleEnablePush}
                    disabled={requestingPerm}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    {requestingPerm ? 'Enabling...' : 'Enable Alerts'}
                  </button>
                ) : (
                  <button
                    onClick={sendTestNotification}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold shadow-sm transition-all"
                  >
                    Test Alert
                  </button>
                )}
              </div>
            </div>

            {/* In-App Notification Toggles */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-4">
              {/* Daily Reminder */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Daily Deposit Reminders
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Friendly evening nudge to record today's savings
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.dailyReminder}
                  onChange={(e) => updatePreferences({ dailyReminder: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
                />
              </div>

              {/* Milestone & Goal Alerts */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Milestone Celebrations
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Alerts at 25%, 50%, 75%, and 100% of goal targets
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.milestones}
                  onChange={(e) => updatePreferences({ milestones: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
                />
              </div>

              {/* Streak Alerts */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Streak & Habit Protection
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Alerts when you reach savings milestones or risk losing a streak
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.streakAlerts}
                  onChange={(e) => updatePreferences({ streakAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
                />
              </div>

              {/* Pacing Warnings */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Pace Acceleration Alerts
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Warns when remaining days in the cycle require higher daily rates
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.paceAlerts}
                  onChange={(e) => updatePreferences({ paceAlerts: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900 dark:border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Test Trigger Button */}
            <button
              onClick={sendTestNotification}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Sample In-App Notification</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
