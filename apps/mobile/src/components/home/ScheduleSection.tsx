import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { colors, shadowStyle, borderRadius, fontSize, spacing } from '../../constants';

interface ScheduleItem {
  id: string;
  title: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
  location?: string;
  color?: string;
}

interface ScheduleSectionProps {
  items: ScheduleItem[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOUR_HEIGHT = 50;
const DAY_WIDTH = (Dimensions.get('window').width - spacing.lg * 2 - 60) / 5;
const START_HOUR = 8;
const END_HOUR = 20;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}${mins > 0 ? ':' + mins.toString().padStart(2, '0') : ''}${period}`;
}

export function ScheduleSection({ items }: ScheduleSectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to current time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const scrollOffset = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT - 100;
    if (scrollViewRef.current && scrollOffset > 0) {
      scrollViewRef.current.scrollTo({ y: scrollOffset, animated: false });
    }
  }, []);

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  };

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.timeColumn} />
        {DAYS.map((day, index) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {/* Time column */}
          <View style={styles.timeColumn}>
            {hours.map((hour) => (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourText}>
                  {hour > 12 ? hour - 12 : hour}
                  {hour >= 12 ? 'PM' : 'AM'}
                </Text>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {/* Grid lines */}
            {hours.map((hour, index) => (
              <View
                key={hour}
                style={[styles.gridLine, { top: index * HOUR_HEIGHT }]}
              />
            ))}

            {/* Current time line */}
            <View
              style={[
                styles.currentTimeLine,
                { top: getCurrentTimePosition() },
              ]}
            >
              <View style={styles.currentTimeDot} />
            </View>

            {/* Schedule items */}
            {items
              .filter((item) => item.day_of_week >= 1 && item.day_of_week <= 5)
              .map((item) => {
                const top =
                  ((item.start_minute - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const height =
                  ((item.end_minute - item.start_minute) / 60) * HOUR_HEIGHT;
                const left = (item.day_of_week - 1) * DAY_WIDTH;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.scheduleItem,
                      {
                        top,
                        height: Math.max(height, 30),
                        left,
                        width: DAY_WIDTH - 4,
                        backgroundColor: item.color || colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.location && (
                      <Text style={styles.itemLocation} numberOfLines={1}>
                        {item.location}
                      </Text>
                    )}
                  </View>
                );
              })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 7,
    ...shadowStyle,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  timeColumn: {
    width: 50,
    alignItems: 'center',
  },
  dayHeader: {
    width: DAY_WIDTH,
    alignItems: 'center',
  },
  dayText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    height: 200,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  hourRow: {
    height: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  hourText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  daysGrid: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  currentTimeLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.currentTimeLine,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.currentTimeLine,
    marginLeft: -4,
  },
  scheduleItem: {
    position: 'absolute',
    borderRadius: 4,
    padding: 4,
    overflow: 'hidden',
  },
  itemTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.background,
  },
  itemLocation: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});
