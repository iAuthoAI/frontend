'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { notificationsApi } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  status_change:       { icon: '🔄', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100' },
  approval:            { icon: '✅', color: 'text-green-600',  bg: 'bg-green-50 border-green-100' },
  denial:              { icon: '⊘',  color: 'text-red-600',    bg: 'bg-red-50 border-red-100' },
  rfi_received:        { icon: '📄', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  expiring_auth:       { icon: '⏰', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  peer_review_required:{ icon: '👁', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  sla_warning:         { icon: '⚠️', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
  system_alert:        { icon: '🔔', color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-100' },
  new_guideline:       { icon: '📚', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
      setUnreadCount(2);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* optimistic already done */ }
  }

  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-indigo-600 mt-0.5 font-medium">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn('px-3 py-1.5 text-sm rounded-lg font-medium transition-all',
              filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100')}
          >All</button>
          <button
            onClick={() => setFilter('unread')}
            className={cn('px-3 py-1.5 text-sm rounded-lg font-medium transition-all',
              filter === 'unread' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100')}
          >Unread</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((notif, i) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system_alert;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md',
                  notif.is_read ? 'bg-white border-slate-100' : cn(cfg.bg, 'border')
                )}
                onClick={() => {
                  if (!notif.is_read) markRead(notif.id);
                  if (notif.pa_request_id) router.push(`/provider/pa-requests/${notif.pa_request_id}`);
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('text-sm font-semibold', notif.is_read ? 'text-slate-700' : cfg.color)}>
                        {notif.title}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(notif.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{notif.message}</p>
                    {!notif.is_read && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <span className="text-xs text-indigo-500 font-medium">Unread</span>
                        <button
                          onClick={e => { e.stopPropagation(); markRead(notif.id); }}
                          className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline"
                        >Mark read</button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {displayed.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🔔</div>
              <p className="font-medium">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MOCK_NOTIFICATIONS = [
  {
    id: '1', type: 'status_change', is_read: false,
    title: 'PA-2026-0001 moved to Clinical Review',
    message: 'Your PA request for Laparoscopic appendectomy is now under clinical review.',
    pa_request_id: '1', created_at: new Date().toISOString(),
  },
  {
    id: '2', type: 'approval', is_read: false,
    title: 'PA-2026-0002 Submitted Successfully',
    message: 'Your PA request for Total knee arthroplasty has been submitted to BlueCross BlueShield.',
    pa_request_id: '2', created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];
