import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification, NotificationPreferences, CategoryId } from '../types';

const STORAGE_NOTIFICATIONS_KEY = 'vault_notifications_v1';
const STORAGE_PREFS_KEY = 'vault_notification_prefs_v1';

const DEFAULT_PREFS: NotificationPreferences = {
  dailyReminder: true,
  reminderTime: '20:00',
  milestones: true,
  streakAlerts: true,
  paceAlerts: true,
  browserNotifications: false,
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome',
    type: 'system',
    title: 'Welcome to Vault',
    message: 'Track your daily micro-savings for Home Rent (130k), Internet (70k), and Work Rent (100k UGX).',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    read: false,
    actionTab: 'overview',
  },
  {
    id: 'notif-daily-pace',
    type: 'daily_reminder',
    title: 'Daily Budget Target',
    message: 'A micro-saving of ~10,000 UGX today keeps all your commitments fully on track for the month.',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    read: false,
    actionTab: 'overview',
  },
];

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  permissionStatus: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<boolean>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  addNotification: (
    title: string,
    message: string,
    type?: AppNotification['type'],
    options?: { categoryId?: CategoryId; actionTab?: AppNotification['actionTab'] }
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFS_KEY);
      if (saved) {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading notification prefs:', e);
    }
    return DEFAULT_PREFS;
  });

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Save notifications to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }, [notifications]);

  // Save preferences to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving notification prefs:', e);
    }
  }, [preferences]);

  // Sync browser notification permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted' && !preferences.browserNotifications) {
        setPreferences((prev) => ({ ...prev, browserNotifications: true }));
      }
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser notifications are not supported in this iframe environment.');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result === 'granted') {
        setPreferences((prev) => ({ ...prev, browserNotifications: true }));
        // Send a confirmation browser notification
        try {
          new Notification('Vault Notifications Active 🔔', {
            body: 'You will receive reminders for your UGX savings goals and daily budget milestones.',
            icon: '/icon.png',
          });
        } catch (e) {
          console.warn('Native notification failed:', e);
        }
        return true;
      } else {
        setPreferences((prev) => ({ ...prev, browserNotifications: false }));
        return false;
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const addNotification = (
    title: string,
    message: string,
    type: AppNotification['type'] = 'system',
    options?: { categoryId?: CategoryId; actionTab?: AppNotification['actionTab'] }
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      categoryId: options?.categoryId,
      actionTab: options?.actionTab || 'overview',
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]); // Keep last 50

    // Trigger browser notification if permitted and enabled
    if (
      preferences.browserNotifications &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`Vault: ${title}`, {
          body: message,
          icon: '/icon.png',
        });
      } catch (e) {
        console.warn('Native notification display failed:', e);
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const sendTestNotification = () => {
    addNotification(
      'Smart Daily Reminder',
      'Remember to log your 5,000 UGX daily micro-saving for Home Rent today!',
      'daily_reminder',
      { categoryId: 'home_rent', actionTab: 'home_rent' }
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        permissionStatus,
        requestPermission,
        updatePreferences,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
