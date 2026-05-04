import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  connectSocialStream,
  getPresenceSnapshot,
  listDirectoryUsers,
  listSocialConversations,
  markConversationAsRead,
  sendPresenceHeartbeat,
} from '../services/socialService';

const SocialContext = createContext(null);
const HEARTBEAT_INTERVAL_MS = 20000;

function sortConversations(items) {
  return [...items].sort((left, right) => {
    const leftDate = new Date(left?.updatedAt || left?.lastMessage?.createdAt || 0).getTime();
    const rightDate = new Date(right?.updatedAt || right?.lastMessage?.createdAt || 0).getTime();
    return rightDate - leftDate;
  });
}

function mergeConversation(current, incoming) {
  const remaining = current.filter((item) => item.id !== incoming.id);
  return sortConversations([incoming, ...remaining]);
}

function mergePresenceInConversation(conversation, presence) {
  if (!conversation?.participants) {
    return conversation;
  }

  return {
    ...conversation,
    participants: conversation.participants.map((participant) => (
      participant.userId === presence.userId
        ? { ...participant, online: presence.online, lastSeenAt: presence.lastSeenAt }
        : participant
    )),
  };
}

function removeConversation(current, conversationId) {
  return current.filter((conversation) => conversation.id !== conversationId);
}

export function SocialProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [socketStatus, setSocketStatus] = useState('idle');

  const loadSocialData = useCallback(async (showLoading = false) => {
    if (!isAuthenticated) {
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      const [directory, conversationItems] = await Promise.all([
        listDirectoryUsers(),
        listSocialConversations(),
      ]);

      const currentUserId = user?.id;
      const directoryWithoutCurrentUser = directory.filter((item) => item.id !== currentUserId);
      const presences = directoryWithoutCurrentUser.length > 0
        ? await getPresenceSnapshot(directoryWithoutCurrentUser.map((item) => item.id))
        : [];
      const presenceByUserId = new Map(presences.map((presence) => [presence.userId, presence]));
      const enrichedContacts = directory
        .filter((item) => item.id !== currentUserId)
        .map((item) => {
          const matchingPresence = presenceByUserId.get(item.id);
          const matchingConversation = conversationItems.find((conversation) => (
            conversation.participants?.some((participant) => participant.userId === item.id)
          ));
          const matchingParticipant = matchingConversation?.participants?.find((participant) => participant.userId === item.id);

          return {
            ...item,
            fullName: [item.firstName, item.lastName].filter(Boolean).join(' ').trim(),
            online: Boolean(matchingPresence?.online ?? matchingParticipant?.online),
            lastSeenAt: matchingPresence?.lastSeenAt || matchingParticipant?.lastSeenAt || null,
          };
        });

      setContacts(enrichedContacts);
      setConversations(sortConversations(conversationItems));
    } catch {
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setContacts([]);
      setConversations([]);
      setLastEvent(null);
      setSocketStatus('idle');
      return undefined;
    }

    let active = true;
    loadSocialData(true).catch(() => {});

    return () => {
      active = false;
    };
  }, [isAuthenticated, loadSocialData]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let reconnectTimeoutId = null;
    let disposed = false;

    sendPresenceHeartbeat().catch(() => {});
    const heartbeatId = window.setInterval(() => {
      sendPresenceHeartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    let socket = null;

    const handleSocialEvent = (event) => {
      if (event?.type === 'stream.connected') {
        setSocketStatus('connected');
      }

      setLastEvent(event);

      if (event?.type === 'conversation.updated' && event.payload) {
        setConversations((current) => mergeConversation(current, event.payload));
      }

      if (event?.type === 'presence.updated' && event.payload) {
        setContacts((current) => current.map((contact) => (
          contact.id === event.payload.userId
            ? { ...contact, online: event.payload.online, lastSeenAt: event.payload.lastSeenAt }
            : contact
        )));

        setConversations((current) => current.map((conversation) => mergePresenceInConversation(conversation, event.payload)));
      }

      if (event?.type === 'conversation.deleted' && event.payload?.conversationId) {
        setConversations((current) => removeConversation(current, event.payload.conversationId));
      }
    };

    const connectSocket = () => {
      if (disposed) {
        return;
      }

      setSocketStatus('connecting');
      socket = connectSocialStream(handleSocialEvent);
      if (!socket) {
        setSocketStatus('error');
        return;
      }

      socket.addEventListener('open', () => {
        setSocketStatus('connected');
        sendPresenceHeartbeat().catch(() => {});
        loadSocialData(false).catch(() => {});
      });

      socket.addEventListener('error', () => {
        if (!disposed) {
          setSocketStatus('error');
        }
      });

      socket.addEventListener('close', () => {
        if (disposed) {
          return;
        }
        setSocketStatus('reconnecting');
        reconnectTimeoutId = window.setTimeout(() => {
          connectSocket();
        }, 3000);
      });
    };

    connectSocket();

    return () => {
      disposed = true;
      window.clearInterval(heartbeatId);
      if (reconnectTimeoutId) {
        window.clearTimeout(reconnectTimeoutId);
      }
      socket?.close();
    };
  }, [isAuthenticated, loadSocialData]);

  const unreadCount = useMemo(
    () => conversations.reduce((total, conversation) => total + Number(conversation?.unreadCount || 0), 0),
    [conversations]
  );

  const markAsRead = useCallback(async (conversationId) => {
    const conversation = await markConversationAsRead(conversationId);
    setConversations((current) => mergeConversation(current, conversation));
    return conversation;
  }, []);

  const value = useMemo(() => ({
    contacts,
    conversations,
    loading,
    unreadCount,
    lastEvent,
    socketStatus,
    markAsRead,
    setConversations,
  }), [contacts, conversations, loading, unreadCount, lastEvent, socketStatus, markAsRead]);

  return (
    <SocialContext.Provider value={value}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
}
