import api, { buildRealtimeUrl, getAccessToken } from './api';

export async function listDirectoryUsers() {
  const response = await api.get('/auth/directory');
  return response.data;
}

export async function listSocialConversations() {
  const response = await api.get('/sociale/conversations');
  return response.data;
}

export async function listConversationMessages(conversationId) {
  const response = await api.get(`/sociale/conversations/${conversationId}/messages`);
  return response.data;
}

export async function sendConversationMessage(conversationId, payload) {
  const response = await api.post(`/sociale/conversations/${conversationId}/messages`, payload);
  return response.data;
}

export async function sendDirectMessage(payload) {
  const response = await api.post('/sociale/direct-messages', payload);
  return response.data;
}

export async function markConversationAsRead(conversationId) {
  const response = await api.post(`/sociale/conversations/${conversationId}/read`, {});
  return response.data;
}

export async function deleteConversation(conversationId) {
  await api.delete(`/sociale/conversations/${conversationId}`);
}

let activeSocket = null;

export async function sendPresenceHeartbeat() {
  if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify({ type: 'presence.heartbeat' }));
  }
}

export async function sendPresenceOffline() {
  if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify({ type: 'presence.offline' }));
  }
}

export function getPresenceSnapshot(userIds) {
  return new Promise((resolve) => {
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
      resolve([]);
      return;
    }

    const onMessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'presence.snapshot') {
          activeSocket.removeEventListener('message', onMessage);
          resolve(parsed.payload);
        }
      } catch (e) {
        // Ignorer
      }
    };

    activeSocket.addEventListener('message', onMessage);
    activeSocket.send(JSON.stringify({ type: 'presence.snapshot', userIds }));

    // Timeout au bout de 5 secondes si pas de réponse
    setTimeout(() => {
      activeSocket?.removeEventListener('message', onMessage);
      resolve([]);
    }, 5000);
  });
}

export function connectSocialStream(onEvent) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return null;
  }

  const socketUrl = buildRealtimeUrl('/sociale/ws', { access_token: accessToken });
  const socket = new WebSocket(socketUrl);
  activeSocket = socket;

  socket.addEventListener('message', (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onEvent?.(parsed);
    } catch {
    }
  });

  socket.addEventListener('close', () => {
    if (activeSocket === socket) {
      activeSocket = null;
    }
  });

  return socket;
}
