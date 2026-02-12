'use client';

import { useState } from 'react';
import { useUser } from '@/lib/useUser';
import Image from 'next/image';

interface ProfileIconProps {
  className?: string;
  size?: number;
}

export function ProfileIcon({ className = '', size = 24 }: ProfileIconProps) {
  const { user } = useUser();
  const [avatarError, setAvatarError] = useState(false);
  const avatarUrl =
    (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture) as string | undefined;
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?';

  if (avatarUrl && !avatarError) {
    return (
      <Image
        src={avatarUrl}
        alt="Profile"
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setAvatarError(true)}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 border-primary bg-icon-tint text-background font-semibold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.45),
      }}
    >
      {initial}
    </div>
  );
}
