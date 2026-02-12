interface NotificationIconProps {
  className?: string;
  size?: number;
  hasNotifications?: boolean;
}

export function NotificationIcon({
  className = '',
  size = 24,
  hasNotifications = false,
}: NotificationIconProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/assets/notification_icon.png"
        alt="Notifications"
        width={size}
        height={size}
        className="object-contain w-full h-full opacity-90 dark:invert dark:opacity-80"
      />
      {hasNotifications && (
        <span
          className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error ring-2 ring-background dark:ring-[#1a1a1a]"
          aria-hidden
        />
      )}
    </div>
  );
}
