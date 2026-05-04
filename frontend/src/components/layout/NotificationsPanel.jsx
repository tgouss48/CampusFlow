import { useNavigate } from 'react-router-dom';
import { FiBell, FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useRef, useEffect, useState } from 'react';

function formatWhen(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationsPanel({ collapsed = false, onAction }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    loading,
    open,
    unreadCount,
    setOpen,
    markAsRead,
  } = useNotifications();

  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const [popupStyle, setPopupStyle] = useState({});

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        open &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupHeight = 450;
      const windowHeight = window.innerHeight;
      
      let topPos = rect.top;
      if (topPos + popupHeight > windowHeight) {
        topPos = Math.max(16, windowHeight - popupHeight - 16);
      }

      setPopupStyle({
        top: `${topPos}px`,
        // On le tire massivement vers la gauche, aligné presque avec l'icône du bouton
        left: `${collapsed ? rect.right + 8 : rect.left + 40}px`,
      });
    }
  }, [open, collapsed]);

  const roleValues = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    ...(typeof user?.role === 'string' ? [user.role] : []),
  ].map((role) => String(role || '').toUpperCase());

  const isAdei = roleValues.includes('ADEI') || roleValues.includes('ROLE_ADEI');
  const visibleNotifications = notifications.filter((notification) => !notification.read);

  if (isAdei) {
    return null;
  }

  const handleNotificationClick = async (notification) => {
    if (!notification?.evenementId) {
      return;
    }

    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Si l'événement a été annulé, on ne redirige pas vers la page des événements
    if (notification.message?.includes('annulé')) {
      return;
    }

    setOpen(false);
    navigate('/evenements', {
      state: {
        openEventId: notification.evenementId,
      },
    });
    onAction?.();
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={`group w-full flex items-center ${collapsed ? 'justify-center px-3' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors`}
        title={collapsed ? 'Notifications' : undefined}
      >
        <div className="relative">
          <FiBell size={18} aria-hidden className="text-slate-400 group-hover:text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && <span>Notifications</span>}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-[110] w-[calc(100vw-2rem)] sm:w-[22rem] rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/50 overflow-hidden"
          style={{
            ...popupStyle,
            left: window.innerWidth < 640 ? '1rem' : popupStyle.left
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center"
                title="Fermer"
              >
                <FiX size={16} aria-hidden />
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Chargement des notifications...
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <FiBell size={20} aria-hidden />
                </div>
                <p className="text-sm font-semibold text-slate-900">Aucune notification</p>
                <p className="mt-1 text-sm text-slate-500">
                  Rien a afficher pour le moment.
                </p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="relative rounded-2xl border border-primary-100 bg-primary-50/50 transition-all hover:bg-primary-100/50 overflow-hidden"
                >
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="absolute top-3 right-3 z-10 p-1.5 rounded-lg border border-primary-200 text-primary-600 hover:bg-white hover:text-primary-800 hover:shadow-sm transition-all bg-white/50"
                      title="Marquer comme lue"
                    >
                      <FiCheck size={14} aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left flex items-start gap-3 px-4 py-3"
                  >
                    <div className="mt-0.5 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center shrink-0">
                      <FiCalendar size={18} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 pr-7">
                      <p className="text-sm font-medium text-slate-700 leading-snug">
                        {notification.message}
                      </p>
                      {notification.occurredAt && (
                        <p className="mt-1.5 text-xs font-medium text-slate-400">
                          {formatWhen(notification.occurredAt)}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
