import api, { buildRealtimeUrl, getAccessToken } from './api';

export function normalizeNotification(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const targetRoles = Array.isArray(item.rolesCibles)
    ? item.rolesCibles
    : Array.isArray(item.targetRoles)
      ? item.targetRoles
      : [];

  return {
    id: item.id ?? `${item.type || 'notification'}-${item.evenementId ?? item.occurredAt ?? Math.random()}`,
    type: item.type || 'NOTIFICATION',
    title: item.title || item.titre || 'Notification',
    message: item.message || item.description || item.titre || 'Nouvelle notification',
    occurredAt: item.occurredAt || item.createdAt || item.date || null,
    readAt: item.readAt || null,
    evenementId: item.evenementId ?? null,
    rolesCibles: targetRoles,
    read: Boolean(item.read),
    raw: item,
  };
}

export async function getNotifications() {
  try {
    const response = await api.get('/evenements/notifications');
    const payload = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.content)
        ? response.data.content
        : [];

    return payload
      .map(normalizeNotification)
      .filter(Boolean);
  } catch (error) {
    if ([404, 501].includes(error?.response?.status)) {
      return [];
    }

    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  if (!notificationId) {
    return;
  }

  await api.patch(`/evenements/notifications/${notificationId}/read`);
}

export function connectNotificationsStream(onEvent) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  const socketUrl = buildRealtimeUrl('/evenements/notifications/stream', { access_token: accessToken });
  const socket = new WebSocket(socketUrl);

  socket.addEventListener('message', (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onEvent?.(parsed);
    } catch {
    }
  });

  return socket;
}
