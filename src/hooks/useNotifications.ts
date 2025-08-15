import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [
    {
      id: '1',
      title: 'Campaign Performance',
      message: 'Your "Q1 Outreach" campaign has achieved a 15% response rate!',
      type: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionUrl: '/campaigns'
    },
    {
      id: '2',
      title: 'New Contact Response',
      message: 'Sarah Johnson replied to your LinkedIn message',
      type: 'info',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
      actionUrl: '/inbox'
    },
    {
      id: '3',
      title: 'Low Email Open Rate',
      message: 'Your recent email sequence has a 12% open rate - consider A/B testing subject lines',
      type: 'warning',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: true,
      actionUrl: '/campaigns'
    },
    {
      id: '4',
      title: 'New Team Member Added',
      message: 'John Smith has joined your workspace as a team member',
      type: 'info',
      timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      read: false,
      actionUrl: '/accounts'
    },
    {
      id: '5',
      title: 'Template Saved',
      message: 'Your LinkedIn outreach template has been auto-saved',
      type: 'success',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      actionUrl: '/templates'
    },
    {
      id: '6',
      title: 'Search Completed',
      message: '245 new prospects found matching your search criteria',
      type: 'info',
      timestamp: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      read: false,
      actionUrl: '/search'
    }
  ],
  unreadCount: 5,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep max 50 notifications
      unreadCount: state.unreadCount + 1,
    }));

    // Play a subtle sound effect (optional)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhB');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore if autoplay is blocked
    } catch (e) {
      // Ignore audio errors
    }
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));