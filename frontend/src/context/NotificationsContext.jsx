import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  connectNotificationsStream,
  getNotifications,
  markNotificationAsRead,
  normalizeNotification,
} from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);

function normalizeRole(role) {
  return String(role || '').replace(/^ROLE_/, '').trim().toUpperCase();
}

function canUserSeeNotification(notification, user) {
  const targetRoles = Array.isArray(notification?.rolesCibles)
    ? notification.rolesCibles.map(normalizeRole).filter(Boolean)
    : [];

  if (targetRoles.length === 0) {
    return true;
  }

  const userRoles = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(typeof user?.role === 'string' ? [user.role] : []),
  ]
    .map(normalizeRole)
    .filter(Boolean);

  return userRoles.some((role) => targetRoles.includes(role));
}

function mergeNotifications(current, incoming, user) {
  const visibleIncoming = incoming.filter((item) => canUserSeeNotification(item, user));
  const currentById = new Map(current.map((item) => [item.id, item]));
  const mergedIncoming = visibleIncoming.map((item) => {
    const existing = currentById.get(item.id);

    if (!existing) {
      return item;
    }

    return {
      ...item,
      read: existing.read || item.read,
      readAt: existing.readAt || item.readAt || null,
    };
  });

  const incomingIds = new Set(mergedIncoming.map((item) => item.id));
  const remaining = current.filter((item) => !incomingIds.has(item.id));

  return [...mergedIncoming, ...remaining].sort((left, right) => {
    const leftDate = new Date(left?.occurredAt || 0).getTime();
    const rightDate = new Date(right?.occurredAt || 0).getTime();
    return rightDate - leftDate;
  });
}

export function NotificationsProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const refreshNotifications = useCallback(async () => {
    const userRoles = [
      ...(Array.isArray(user?.roles) ? user.roles : []),
      ...(typeof user?.role === 'string' ? [user.role] : []),
    ].map(normalizeRole);

    const isAdei = userRoles.includes('ADEI');

    if (!isAuthenticated || isAdei) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const items = await getNotifications();
      setNotifications((current) => mergeNotifications(current, items, user));
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return undefined;
    }

    let reconnectTimeoutId = null;
    let disposed = false;
    let socket = null;

    const handleNotificationEvent = (event) => {
      if (event?.type === 'notification.created' && event.payload) {
        const normalized = normalizeNotification(event.payload);
        if (!normalized || !canUserSeeNotification(normalized, user)) {
          return;
        }

        setNotifications((current) => mergeNotifications(current, [normalized], user));
      }

      if (event?.type === 'notification.read' && event.payload?.id) {
        setNotifications((current) => current.map((item) => (
          item.id === event.payload.id
            ? {
              ...item,
              read: true,
              readAt: event.payload.readAt || item.readAt || new Date().toISOString(),
            }
            : item
        )));
      }

      if (event?.type === 'notification.deleted' && event.payload?.id) {
        setNotifications((current) => current.filter((item) => item.id !== event.payload.id));
      }
    };

    const connectSocket = () => {
      if (disposed) {
        return;
      }

      socket = connectNotificationsStream(handleNotificationEvent);
      if (!socket) {
        return;
      }

      socket.addEventListener('open', () => {
        refreshNotifications();
      });

      socket.addEventListener('close', () => {
        if (disposed) {
          return;
        }

        reconnectTimeoutId = window.setTimeout(() => {
          connectSocket();
        }, 3000);
      });
    };

    connectSocket();

    return () => {
      disposed = true;
      if (reconnectTimeoutId) {
        window.clearTimeout(reconnectTimeoutId);
      }
      socket?.close();
    };
  }, [isAuthenticated, refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((current) => current.map((item) => (
      item.id === notificationId
        ? { ...item, read: true, readAt: item.readAt || new Date().toISOString() }
        : item
    )));

    try {
      await markNotificationAsRead(notificationId);
    } catch {
      setNotifications((current) => current.map((item) => (
        item.id === notificationId
          ? { ...item, read: false, readAt: null }
          : item
      )));
    }
  }, []);

  const value = useMemo(() => ({
    notifications,
    loading,
    open,
    unreadCount,
    setOpen,
    markAsRead,
  }), [notifications, loading, open, unreadCount, markAsRead]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
