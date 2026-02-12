'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fetch university name from Supabase
    supabase.auth.getUser().then(({ data }) => {
      const universityId = data.user?.user_metadata?.university_id;
      if (!universityId) return;

      supabase
        .from('universities')
        .select('name')
        .eq('id', universityId)
        .single()
        .then(({ data: uni }) => {
          if (uni?.name) setCollegeName(uni.name);
        });
    }).catch(() => {});
  }, []);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/boards', label: 'Community' },
    { href: '/marketplace', label: 'Market' },
    { href: '/messages', label: 'Messages' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/lectures', label: 'Classes' },
    { href: '/settings', label: 'Settings' },
  ];

  const currentPath = pathname || '/';

  if (!mounted) {
    return (
      <header className="mb-6 md:mb-8 border-b border-[var(--border)]">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center gap-2.5 md:gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-background-secondary rounded-[10px] animate-pulse" />
            <div>
              <div className="h-[18px] md:h-5 w-20 md:w-24 bg-background-secondary rounded animate-pulse mb-1" />
              <div className="h-3 w-28 md:w-32 bg-background-secondary rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-background-secondary rounded animate-pulse" />
            <div className="w-9 h-9 md:w-10 md:h-10 bg-background-secondary rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3 md:py-4 border-b border-[var(--border)] bg-transparent">
        {/* Logo and title - scales up on desktop */}
        <Link
          href="/"
          className="flex items-center gap-2.5 md:gap-3 flex-shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Image
            src="/assets/QuadlyIcon.jpg"
            alt="Quadly"
            width={44}
            height={44}
            className="w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-[10px] object-cover"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold text-primary leading-tight">
              Quadly
            </h1>
            {collegeName && (
              <p className="text-sm text-text-light mt-0.5 leading-tight hidden sm:block">
                {collegeName}
              </p>
            )}
          </div>
        </Link>

        {/* Nav - wraps on small screens, comfortable padding on desktop */}
        <nav className="flex flex-wrap items-center justify-center sm:justify-center gap-1 md:gap-2 flex-1 sm:mx-4" aria-label="Main">
          {navItems.map((item) => {
            let isActive = false;
            if (item.href === '/') {
              isActive = currentPath === '/';
            } else {
              isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 md:px-4 md:py-2.5 text-sm font-medium transition-colors rounded-lg whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-background dark:bg-primary dark:text-background'
                    : 'text-text-secondary hover:text-primary dark:hover:text-background hover:bg-background-secondary dark:hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions - larger hit targets on desktop */}
        <div className="flex items-center justify-end sm:justify-end gap-2 md:gap-4 flex-shrink-0">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-background-secondary dark:hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <NotificationIcon
              size={24}
              hasNotifications={unreadCount > 0}
            />
          </button>
          <ThemeToggle />
          <Link
            href="/profile"
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg hover:bg-background-secondary dark:hover:bg-white/10 transition-colors"
            aria-label="Profile"
          >
            <ProfileIcon size={24} />
          </Link>
        </div>
      </div>

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </header>
  );
}
