'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { NotificationIcon } from './NotificationIcon';
import { ProfileIcon } from './ProfileIcon';
import { NotificationsModal } from './NotificationsModal';

export function Header() {
  const pathname = usePathname();
  const [collegeName, setCollegeName] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    apiClient.setToken(token);

    Promise.all([
      apiClient.get<{ school: string; role: string }>('/auth/me'),
      apiClient.get<{ universities: Array<{ id: string; name: string; domain: string }> }>('/auth/universities'),
    ])
      .then(([userData, universitiesData]) => {
        const university = universitiesData.universities.find(
          (u) => u.id === userData.school
        );
        if (university) {
          setCollegeName(university.name);
        }
        setUserRole(userData.role);
      })
      .catch((error) => {
        console.error('Failed to fetch data:', error);
        // Don't throw error, just log it
      });
  }, []);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/boards', label: 'Boards' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/lectures', label: 'Lectures' },
    { href: '/settings', label: 'Settings' },
    ...(userRole === 'ADMIN' || userRole === 'MODERATOR'
      ? [{ href: '/admin', label: 'Admin' }]
      : []),
  ];

  const currentPath = pathname || '/';

  if (!mounted) {
    return (
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div>
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Header Row: Logo, Navigation, and Actions */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
        {/* Logo and Title - Left */}
        <Link href="/" className="flex items-center gap-5 flex-shrink-0">
          <Image
            src="/QuadlyIcon01.png"
            alt="Quadly Icon"
            width={48}
            height={48}
            className="w-12 h-12"
            onError={(e) => {
              // Fallback if image fails to load
              console.error('Failed to load Quadly icon');
            }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-0">
              Quadly
            </h1>
            {collegeName && (
              <p className="text-gray-900 dark:text-white mt-0 text-base font-medium">
                {collegeName}
              </p>
            )}
          </div>
        </Link>

        {/* Navigation Items - Center */}
        <nav className="flex items-center gap-1 flex-1 justify-center mx-8">
          {navItems.map((item) => {
            let isActive = false;
            if (item.href === '/') {
              // Home is active only on exact home page
              isActive = currentPath === '/';
            } else if (item.href === '/boards') {
              // Boards is active on /boards page or any /boards/* page
              isActive = currentPath === '/boards' || currentPath.startsWith('/boards/');
            } else {
              isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons - Right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Notifications"
          >
            <NotificationIcon
              className="w-5 h-5 text-gray-800 dark:text-gray-200"
              size={20}
              hasNotifications={unreadCount > 0}
            />
          </button>
          <ThemeToggle />
          <Link
            href="/profile"
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Profile"
          >
            <ProfileIcon className="w-5 h-5 text-gray-800 dark:text-gray-200" size={20} />
          </Link>
        </div>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
