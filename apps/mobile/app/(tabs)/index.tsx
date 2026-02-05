import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useScheduleStore, ScheduleItem } from '../../src/store/scheduleStore';
import { colors, fontSize, spacing } from '../../src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIME_COLUMN_WIDTH = 25;
const DAY_COLUMN_WIDTH = Math.floor((SCREEN_WIDTH - TIME_COLUMN_WIDTH - 40 - 40) / 5);
const HOUR_HEIGHT = 70;

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
];

const SCHEDULE_COLORS = [
  '#E18B7A',
  '#E5C475',
  '#AEC97C',
  '#91CFC2',
  '#81A4E5',
  '#EDB071',
  '#9B88D9',
  '#8CC98D',
];

const formatTime = (hour: number): string => {
  if (hour === 0) return '12';
  if (hour <= 12) return `${hour}`;
  return `${hour - 12}`;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { selectedTerm, schedulesByTerm } = useScheduleStore();

  const userEmail = user?.email ?? 'user@example.com';
  const userInitial = userEmail.charAt(0).toUpperCase();

  const scheduleItems = schedulesByTerm[selectedTerm] || [];

  // Calculate time window: 1.5 hours before and after current time
  const getTimeWindow = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // If current time is before 7am or after 10pm, show from 7am
    if (currentHour < 7 || currentHour > 22) {
      return {
        startHour: 7,
        endHour: 10,
        currentTimePosition: null,
        windowStartMinutes: 7 * 60,
      };
    }

    // Calculate 1.5 hours before and after (90 minutes)
    let windowStartMinutes = currentTimeInMinutes - 90;
    let windowEndMinutes = currentTimeInMinutes + 90;

    // Ensure we stay within 7am-10pm bounds
    if (windowStartMinutes < 7 * 60) {
      windowStartMinutes = 7 * 60;
    }
    if (windowEndMinutes > 22 * 60) {
      windowEndMinutes = 22 * 60;
    }

    const startHour = Math.floor(windowStartMinutes / 60);
    const endHour = Math.ceil(windowEndMinutes / 60);

    // Current time position relative to window start (should be ~middle)
    const currentTimePosition = currentTimeInMinutes - windowStartMinutes;

    return {
      startHour,
      endHour,
      currentTimePosition,
      windowStartMinutes,
    };
  };

  const timeWindow = getTimeWindow();

  // Generate time slots for the window (show 3 hours)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = timeWindow.startHour; hour <= timeWindow.startHour + 2; hour++) {
      if (hour <= 22) {
        slots.push(hour);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Filter schedule items to only show those within the time window
  const windowEndMinutes = (timeWindow.startHour + 3) * 60;
  const visibleScheduleItems = scheduleItems.filter((item) => {
    const itemStartMinutes = item.startHour * 60 + item.startMinute;
    const itemEndMinutes = item.endHour * 60 + item.endMinute;

    return itemStartMinutes < windowEndMinutes && itemEndMinutes > timeWindow.windowStartMinutes;
  });

  const getColorForClassName = (className: string): string => {
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SCHEDULE_COLORS.length;
    return SCHEDULE_COLORS[index];
  };

  const getScheduleBlockStyle = (item: ScheduleItem) => {
    const startMinutes = item.startHour * 60 + item.startMinute;
    const endMinutes = item.endHour * 60 + item.endMinute;

    // Clip to window boundaries
    const clippedStartMinutes = Math.max(startMinutes, timeWindow.windowStartMinutes);
    const clippedEndMinutes = Math.min(endMinutes, windowEndMinutes);

    const startFromWindowStart = clippedStartMinutes - timeWindow.windowStartMinutes;
    const top = (startFromWindowStart / 60) * HOUR_HEIGHT;

    const durationMinutes = clippedEndMinutes - clippedStartMinutes;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    return {
      top,
      height: Math.max(height, 20),
    };
  };

  // Current time line position (should be in middle when time is in range)
  const getCurrentTimePosition = () => {
    if (timeWindow.currentTimePosition === null) return null;
    return (timeWindow.currentTimePosition / 60) * HOUR_HEIGHT;
  };

  const currentTimeY = getCurrentTimePosition();

  return (
    <LinearGradient
      colors={['#ffffff', '#f6f6f6']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>Q</Text>
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.appName}>Quadly</Text>
              <Text style={styles.subtitle}>Campus Community</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Image
                source={require('../../assets/notification_icon.png')}
                style={styles.notificationIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Text style={styles.profileInitial}>{userInitial}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Schedule Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <TouchableOpacity
              style={styles.scheduleGridContainer}
              onPress={() => router.push('/(tabs)/schedule')}
              activeOpacity={0.9}
            >
              {/* Current Time Indicator Line */}
              {currentTimeY !== null && (
                <View
                  style={[
                    styles.scheduleCurrentTimeLine,
                    { top: currentTimeY },
                  ]}
                />
              )}

              {/* Schedule Blocks */}
              {visibleScheduleItems.map((item) => {
                const blockStyle = getScheduleBlockStyle(item);
                const dayIndex = DAYS.findIndex((d) => d.value === item.day);
                const left = TIME_COLUMN_WIDTH + dayIndex * DAY_COLUMN_WIDTH;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.scheduleBlock,
                      {
                        left,
                        width: DAY_COLUMN_WIDTH,
                        top: blockStyle.top,
                        height: blockStyle.height,
                        backgroundColor: getColorForClassName(item.className),
                      },
                    ]}
                  >
                    <Text style={styles.scheduleBlockTitle} numberOfLines={1}>
                      {item.className}
                    </Text>
                    {item.location && (
                      <Text style={styles.scheduleBlockLocation} numberOfLines={1}>
                        {item.location}
                      </Text>
                    )}
                  </View>
                );
              })}

              {/* Time Slots Rows */}
              {timeSlots.map((hour, hourIndex) => (
                <View key={hour} style={styles.scheduleTimeRow}>
                  <View style={[styles.scheduleTimeCell, styles.scheduleCell]}>
                    <Text style={styles.scheduleTimeLabel}>{formatTime(hour)}</Text>
                  </View>

                  {DAYS.map((day) => (
                    <View
                      key={`${hour}-${day.value}`}
                      style={[styles.scheduleDayCell, styles.scheduleCell]}
                    >
                      {hourIndex < timeSlots.length - 1 && (
                        <View style={styles.scheduleGridLineBottom} />
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/schedule')}
              >
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionTitle}>Schedule</Text>
                <Text style={styles.actionSubtitle}>View your classes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionTitle}>Settings</Text>
                <Text style={styles.actionSubtitle}>Manage account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Getting Started</Text>
            <Text style={styles.infoText}>
              This is your home screen. Navigate using the tabs below to explore
              the app features.
            </Text>
          </View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
    backgroundColor: '#00274C',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerTitles: {
    marginLeft: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00274C',
  },
  subtitle: {
    fontSize: 11,
    color: '#666666',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  // Schedule Preview Styles
  scheduleGridContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e1e1e1',
    height: HOUR_HEIGHT * 3, // 3 hours
    position: 'relative',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    minHeight: HOUR_HEIGHT,
  },
  scheduleCell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e1e1e1',
  },
  scheduleTimeCell: {
    width: TIME_COLUMN_WIDTH,
    minHeight: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingTop: spacing.xs,
  },
  scheduleTimeLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '500',
  },
  scheduleDayCell: {
    width: DAY_COLUMN_WIDTH,
    minHeight: HOUR_HEIGHT,
    position: 'relative',
  },
  scheduleGridLineBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#efefef',
  },
  scheduleCurrentTimeLine: {
    position: 'absolute',
    left: TIME_COLUMN_WIDTH,
    right: 0,
    height: 2,
    backgroundColor: colors.error,
    zIndex: 10,
  },
  scheduleBlock: {
    position: 'absolute',
    borderRadius: 4,
    padding: 4,
    zIndex: 5,
    overflow: 'hidden',
  },
  scheduleBlockTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  scheduleBlockLocation: {
    fontSize: fontSize.xs - 2,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
