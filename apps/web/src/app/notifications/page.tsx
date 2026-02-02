'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';
import { NotificationIcon } from '@/components/NotificationIcon';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.setToken(token);

    // TODO: Fetch actual notifications from API
    // For now, using mock data
    setNotifications([]);
    setLoading(false);
  }, [router]);

  const markAsRead = (id: string) => {
    // TODO: Implement API call to mark notification as read
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    // TODO: Implement API call to mark all notifications as read
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        {/* Page Content */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
            >
              ← Home
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h2>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <NotificationIcon
                className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
                size={64}
              />
              <p className="text-gray-500 dark:text-gray-400">
                No notifications yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
