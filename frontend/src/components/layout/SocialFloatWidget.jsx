import { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiEdit2, FiSearch, FiSend, FiTrash2, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import {
  deleteConversation,
  listConversationMessages,
  sendConversationMessage,
  sendDirectMessage,
} from '../../services/socialService';

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 7) {
    return `${diffDays} j`;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function getInitials(label) {
  return String(label || '')
    .split(' ')
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarPalette(label) {
  const palettes = [
    'from-sky-300 via-blue-500 to-slate-900',
    'from-emerald-300 via-teal-500 to-emerald-900',
    'from-amber-200 via-orange-400 to-rose-700',
    'from-fuchsia-300 via-pink-500 to-violet-800',
    'from-cyan-200 via-sky-400 to-indigo-700',
    'from-lime-200 via-green-400 to-teal-700',
    'from-red-200 via-rose-400 to-pink-700',
    'from-indigo-200 via-indigo-500 to-blue-800',
  ];

  const source = String(label || 'U');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return palettes[hash % palettes.length];
}

function getConversationLabel(conversation, currentUserId) {
  const others = (conversation?.participants || []).filter((participant) => participant.userId !== currentUserId);
  if (!others.length) {
    return 'Conversation';
  }
  return others.map((participant) => participant.displayName).join(', ');
}

function getConversationPresence(conversation, currentUserId) {
  return (conversation?.participants || []).find((participant) => participant.userId !== currentUserId) || null;
}

function mergeMessages(current, incoming) {
  const next = new Map(current.map((item) => [item.id, item]));
  next.set(incoming.id, incoming);
  return Array.from(next.values()).sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
}

function DirectMessageIcon({ size = 24 }) {
  return (
    <svg aria-label="Messages" fill="none" height={size} viewBox="0 0 24 24" width={size} className="shrink-0">
      <path
        d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="7.488"
        x2="15.515"
        y1="12.208"
        y2="7.641"
      />
    </svg>
  );
}

function SearchCloseIcon({ size = 19 }) {
  return (
    <span className="relative block" style={{ height: size, width: size }}>
      <FiSearch size={size} className="absolute inset-0" />
      <FiX size={11} className="absolute -right-1 -top-1 rounded-full bg-white" />
    </span>
  );
}

function Avatar({ label, online = false, size = 'thread' }) {
  const sizeClass = size === 'mini'
    ? 'h-6 w-6 text-[9px]'
    : size === 'header'
      ? 'h-10 w-10 text-xs'
      : size === 'compose'
        ? 'h-11 w-11 text-[15px]'
        : 'h-14 w-14 text-[18px]';

  const dotClass = size === 'mini'
    ? 'h-2.5 w-2.5 -right-1 -bottom-0.5'
    : size === 'header'
      ? 'h-3 w-3 -right-0.5 bottom-0'
      : 'h-3.5 w-3.5 right-0.5 bottom-0.5';

  return (
    <div className="relative shrink-0">
      <div className={`flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br ${getAvatarPalette(label)} font-semibold text-white shadow-[0_8px_18px_rgba(15,23,42,0.2)]`}>
        {getInitials(label) || 'U'}
      </div>
      {online ? (
        <span className={`absolute ${dotClass} rounded-full border-2 border-white bg-emerald-500`} />
      ) : null}
    </div>
  );
}

function ThreadRow({ conversation, currentUserId, onOpen }) {
  const label = getConversationLabel(conversation, currentUserId);
  const presence = getConversationPresence(conversation, currentUserId);
  const lastMessage = conversation.lastMessage?.content?.trim();
  const preview = lastMessage || (presence?.online ? 'En ligne maintenant' : 'Hors ligne');
  const timeValue = conversation.lastMessage?.createdAt || conversation.updatedAt;

  return (
    <button
      type="button"
      onClick={() => onOpen(conversation)}
      className="flex w-full items-start gap-4 px-5 py-3 text-left transition hover:bg-slate-50"
    >
      <Avatar label={label} online={presence?.online} size="thread" />

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium leading-[18px] text-slate-900">{label}</p>

            <div className="mt-2 flex items-center gap-1 text-[14px] leading-4 text-slate-500">
              <p className="truncate max-w-[170px]">{preview}</p>
              {timeValue ? (
                <>
                  <span aria-hidden="true" className="shrink-0">&nbsp;&middot;&nbsp;</span>
                  <span className="shrink-0">{formatTime(timeValue)}</span>
                </>
              ) : null}
            </div>
          </div>

          {Number(conversation.unreadCount || 0) > 0 ? (
            <span className="mt-2.5 h-3 w-3 shrink-0 rounded-full bg-sky-500" />
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function SocialFloatWidget({ onOpen }) {
  const { user } = useAuth();
  const { contacts, conversations, unreadCount, lastEvent, markAsRead, setConversations } = useSocial();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list');
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [conversationQuery, setConversationQuery] = useState('');
  const [composeQuery, setComposeQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingContact, setPendingContact] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const topAvatars = useMemo(() => {
    const merged = new Map();

    contacts.forEach((contact) => {
      merged.set(contact.id, {
        id: contact.id,
        label: contact.fullName || contact.email,
        online: Boolean(contact.online),
        rank: contact.online ? 0 : 2,
      });
    });

    conversations.forEach((conversation) => {
      const presence = getConversationPresence(conversation, user?.id);
      if (!presence) {
        return;
      }

      const existing = merged.get(presence.userId);
      merged.set(presence.userId, {
        id: presence.userId,
        label: presence.displayName || existing?.label,
        online: Boolean(existing?.online ?? presence.online),
        rank: existing?.online || presence.online ? 0 : 1,
      });
    });

    return Array.from(merged.values())
      .sort((a, b) => a.rank - b.rank || String(a.label).localeCompare(String(b.label)))
      .slice(0, 2);
  }, [contacts, conversations, user?.id]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const findDirectConversationForContact = (contactId) => conversations.find((conversation) => (
    conversation.direct
    && conversation.participants?.some((participant) => participant.userId === contactId)
    && conversation.participants?.some((participant) => participant.userId === user?.id)
  ));

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const label = getConversationLabel(conversation, user?.id).toLowerCase();
      const preview = String(conversation.lastMessage?.content || '').toLowerCase();
      return label.includes(query) || preview.includes(query);
    });
  }, [conversationQuery, conversations, user?.id]);

  const filteredContacts = useMemo(() => {
    const query = composeQuery.trim().toLowerCase();
    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const fullName = String(
        contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
      ).toLowerCase();
      const username = String(contact.email || '').toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
  }, [composeQuery, contacts]);

  useEffect(() => {
    if (!selectedConversationId && !pendingContact && view !== 'compose' && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, pendingContact, view]);

  useEffect(() => {
    if (!conversations.some((conversation) => conversation.id === selectedConversationId)) {
      if (pendingContact) {
        return;
      }
      setSelectedConversationId(conversations[0]?.id ?? null);
      if (!conversations.length && view === 'thread') {
        setView('list');
      }
    }
  }, [conversations, selectedConversationId, pendingContact, view]);

  useEffect(() => {
    if (!open || view !== 'thread' || !selectedConversationId) {
      return undefined;
    }

    let active = true;
    setLoadingMessages(true);

    listConversationMessages(selectedConversationId)
      .then((items) => {
        if (!active) {
          return;
        }
        setMessages(items);
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ block: 'end' });
        });
        return markAsRead(selectedConversationId);
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoadingMessages(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, view, selectedConversationId, markAsRead]);

  useEffect(() => {
    if (lastEvent?.type !== 'message.created' || !lastEvent.payload) {
      return;
    }

    const eventMessage = lastEvent.payload;
    if (eventMessage.conversationId !== selectedConversationId) {
      return;
    }

    setMessages((current) => mergeMessages(current, eventMessage));
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ block: 'end' });
    });
    if (!eventMessage.ownMessage && open && view === 'thread') {
      markAsRead(selectedConversationId).catch(() => {});
    }
  }, [lastEvent, selectedConversationId, markAsRead, open, view]);

  const handleOpenConversation = (conversation) => {
    setSelectedConversationId(conversation.id);
    setPendingContact(null);
    setView('thread');
  };

  const handleOpenComposer = () => {
    setComposeQuery('');
    setPendingContact(null);
    setView('compose');
  };

  const handleToggleSearch = () => {
    setSearchOpen((current) => {
      const next = !current;
      if (!next) {
        setConversationQuery('');
      }
      return next;
    });
  };

  const handleOpenContact = async (contact) => {
    const existingConversation = findDirectConversationForContact(contact.id);
    if (existingConversation) {
      setSelectedConversationId(existingConversation.id);
      setPendingContact(null);
      setComposeQuery('');
      setView('thread');
      return;
    }

    setPendingContact(contact);
    setSelectedConversationId(null);
    setMessages([]);
    setLoadingMessages(false);
    setComposeQuery('');
    setDraft('');
    setView('thread');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!selectedConversationId && !pendingContact) || !draft.trim() || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      let message;

      if (!selectedConversationId && pendingContact) {
        message = await sendDirectMessage({
          participantId: pendingContact.id,
          participantDisplayName: pendingContact.fullName || [pendingContact.firstName, pendingContact.lastName].filter(Boolean).join(' ').trim() || pendingContact.email,
          content: draft.trim(),
        });
        setSelectedConversationId(message.conversationId);
        setPendingContact(null);
      } else {
        message = await sendConversationMessage(selectedConversationId, { content: draft.trim() });
      }

      setMessages((current) => mergeMessages(current, message));
      setDraft('');
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
      });
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    try {
      await deleteConversation(selectedConversation.id);
      setConversations((current) => current.filter((conversation) => conversation.id !== selectedConversation.id));
      setMessages([]);
      setSelectedConversationId(null);
      setDeleteConfirmOpen(false);
      setView('list');
    } catch {
    }
  };

  const handleDraftKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.shiftKey) {
      return;
    }

    event.preventDefault();
    if ((!selectedConversation && !pendingContact) || !draft.trim() || submitting) {
      return;
    }

    handleSubmit(event);
  };

  return (
    <div className={`fixed z-[70] transition-all duration-300 ${open ? 'inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'}`}>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setView('list');
            setSearchOpen(false);
            onOpen?.();
          }}
          className="flex min-w-[2.75rem] sm:min-w-[13.75rem] items-center gap-3 rounded-full border border-slate-200/80 bg-white p-1.5 sm:p-2 text-left shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.2)]"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-900">
            <DirectMessageIcon size={20} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>

          <div className="hidden sm:block flex-1">
            <p className="text-base font-semibold leading-5 text-slate-900">Messages</p>
          </div>

          <div className="hidden sm:flex -space-x-1">
            {topAvatars.map((contact) => (
              <Avatar
                key={contact.id}
                label={contact.label}
                online={contact.online}
                size="mini"
              />
            ))}
          </div>
        </button>
      ) : (
        <div className="relative h-[80vh] sm:h-[521px] w-full sm:w-[360px] overflow-hidden rounded-t-[26px] sm:rounded-[26px] border-t border-x sm:border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)]">
          {view === 'list' ? (
            <div className="flex h-full flex-col">
              <div className="flex h-[56px] items-center justify-between px-5">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[18px] font-semibold leading-[20px] tracking-[-0.01em] text-slate-900">Messages</h3>
                  {unreadCount > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold leading-none text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleToggleSearch}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-slate-100 ${
                      searchOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-700'
                    }`}
                    aria-label="Rechercher"
                    aria-pressed={searchOpen}
                  >
                    {searchOpen ? <SearchCloseIcon size={18} /> : <FiSearch size={19} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                    aria-label="Fermer"
                  >
                    <FiX size={20} />
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              {searchOpen ? (
                <div className="px-5 pb-2 pt-3">
                  <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3">
                    <FiSearch size={16} className="shrink-0 text-slate-400" />
                    <input
                      type="text"
                      value={conversationQuery}
                      onChange={(event) => setConversationQuery(event.target.value)}
                      placeholder="Rechercher..."
                      className="ml-2 w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex-1 overflow-y-auto">
                <div className="px-0.5 py-1.5">
                  {filteredConversations.map((conversation) => (
                    <ThreadRow
                      key={conversation.id}
                      conversation={conversation}
                      currentUserId={user?.id}
                      onOpen={handleOpenConversation}
                    />
                  ))}

                  {!filteredConversations.length ? (
                    <div className="px-5 py-8 text-sm text-slate-400">
                      Aucune conversation trouvee.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-5 right-5">
                <button
                  type="button"
                  onClick={handleOpenComposer}
                  className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-500 shadow-[0_8px_22px_rgba(15,23,42,0.12)] transition hover:bg-blue-200"
                  aria-label="Nouveau message"
                >
                  <FiEdit2 size={17} />
                </button>
              </div>
            </div>
          ) : view === 'compose' ? (
            <div className="flex h-full flex-col">
              <div className="flex h-[56px] items-center justify-between px-4">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                  aria-label="Retour"
                >
                  <FiArrowLeft size={19} />
                </button>

                <h3 className="text-[18px] font-semibold leading-[20px] text-slate-900">Nouveau message</h3>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                  aria-label="Fermer"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="px-5 py-4">
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-[15px] font-medium text-slate-900">A:</span>
                    <input
                      type="text"
                      value={composeQuery}
                      onChange={(event) => setComposeQuery(event.target.value)}
                      placeholder="Recherchez..."
                      className="w-full bg-transparent text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200" />

              <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((contact) => {
                  const label = contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || contact.email;
                  const existingConversation = findDirectConversationForContact(contact.id);
                  const directPresence = existingConversation
                    ? getConversationPresence(existingConversation, user?.id)
                    : null;
                  const contactOnline = directPresence?.online ?? Boolean(contact.online);

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleOpenContact(contact)}
                      className="flex w-full items-start gap-4 px-5 py-3 text-left transition hover:bg-slate-50"
                    >
                      <Avatar label={label} online={contactOnline} size="compose" />

                      <div className="min-w-0 pt-0.5">
                        <p className="truncate text-[15px] font-medium leading-[18px] text-slate-900">{label}</p>
                        <p className="mt-2 truncate text-[13px] leading-4 text-slate-500">{contact.email || 'Utilisateur'}</p>
                      </div>
                    </button>
                  );
                })}

                {!filteredContacts.length ? (
                  <div className="px-5 py-8 text-sm text-slate-400">
                    Aucun utilisateur trouve.
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex h-[56px] items-center justify-between gap-3 border-b border-slate-200 px-4">
                <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                  aria-label="Retour"
                >
                  <FiArrowLeft size={18} />
                </button>

                {selectedConversation ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      label={getConversationLabel(selectedConversation, user?.id)}
                      online={getConversationPresence(selectedConversation, user?.id)?.online}
                      size="header"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-slate-900">
                        {getConversationLabel(selectedConversation, user?.id)}
                      </p>
                      <p className="truncate text-[14px] text-slate-500">
                        {getConversationPresence(selectedConversation, user?.id)?.online ? 'En ligne' : 'Hors ligne'}
                      </p>
                    </div>
                  </div>
                ) : pendingContact ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      label={pendingContact.fullName || [pendingContact.firstName, pendingContact.lastName].filter(Boolean).join(' ').trim() || pendingContact.email}
                      online={Boolean(pendingContact.online)}
                      size="header"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-slate-900">
                        {pendingContact.fullName || [pendingContact.firstName, pendingContact.lastName].filter(Boolean).join(' ').trim() || pendingContact.email}
                      </p>
                      <p className="truncate text-[14px] text-slate-500">
                        {pendingContact.online ? 'En ligne' : 'Hors ligne'}
                      </p>
                    </div>
                  </div>
                ) : null}
                </div>

                <div className="flex items-center gap-1">
                  {selectedConversation ? (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-rose-600 transition hover:bg-rose-50"
                      aria-label="Supprimer la conversation"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100"
                    aria-label="Fermer"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2.5">
                {loadingMessages && messages.length === 0 ? <p className="text-sm text-slate-400">Chargement...</p> : null}
                {!loadingMessages && messages.length === 0 && !selectedConversationId && pendingContact ? (
                  <p className="text-sm text-slate-400">Envoyez un premier message pour demarrer la conversation.</p>
                ) : null}

                <div className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.ownMessage ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[62%] rounded-[20px] px-3.5 py-2 text-[13px] leading-5 shadow-sm ${
                          message.ownMessage ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`mt-1.5 text-[10px] ${message.ownMessage ? 'text-sky-100' : 'text-slate-400'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="border-t border-slate-200 px-3 py-3">
                <div className="flex items-center gap-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleDraftKeyDown}
                    rows={2}
                    placeholder="Ecrire un message..."
                    disabled={(!selectedConversation && !pendingContact) || submitting}
                    className="min-h-[54px] max-h-28 flex-1 resize-none overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] rounded-[22px] border border-slate-200 bg-white px-4 py-[15px] text-[14px] leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 [&::-webkit-scrollbar]:hidden"
                  />
                  <button
                    type="submit"
                    disabled={(!selectedConversation && !pendingContact) || !draft.trim() || submitting}
                    className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <FiSend size={17} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {deleteConfirmOpen && selectedConversation ? (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-white/12 p-4 backdrop-blur-[0.5px]">
          <div className="w-full max-w-[290px] rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.22)]">
            <h4 className="text-[16px] font-semibold text-slate-900">Supprimer la conversation ?</h4>
            <p className="mt-2 text-[13px] leading-5 text-slate-500">
              Cette action est irréversible.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConversation}
                className="rounded-full bg-rose-500 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-rose-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
