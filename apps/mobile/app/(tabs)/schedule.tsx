import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIME_COLUMN_WIDTH = 25;
const GRID_PADDING = spacing.lg * 2; // Left and right padding for scroll content
const DAY_COLUMN_WIDTH = Math.floor((SCREEN_WIDTH - TIME_COLUMN_WIDTH - GRID_PADDING) / 5);
const HOUR_HEIGHT = 70; // Height for each hour slot

// Generate time slots from 7am to 10pm
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 22; hour++) {
    slots.push(hour);
  }
  return slots;
};

const formatTime = (hour: number): string => {
  // Convert 24-hour to 12-hour format without am/pm
  if (hour === 0) return '12';
  if (hour <= 12) return `${hour}`;
  return `${hour - 12}`;
};

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
];

// Example terms - this would typically come from an API
const TERMS = [
  { label: 'WN25', value: 'WN25' },
  { label: 'FA24', value: 'FA24' },
  { label: 'SP25', value: 'SP25' },
  { label: 'SU25', value: 'SU25' },
];

export default function ScheduleScreen() {
  const timeSlots = generateTimeSlots();
  const { user } = useAuthStore();
  const [selectedTerm, setSelectedTerm] = useState('WN25');
  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);

  // Get university name from user metadata or use default
  const universityName = (user?.user_metadata?.school as string) || 'University of Michigan';

  // Calculate current time position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if current time is within the displayed range (7am to 10pm)
    if (currentHour < 7 || currentHour > 22) {
      return null;
    }

    // Find which hour row we're in
    const hourIndex = currentHour - 7;
    
    // Calculate position within the hour (0 to 1)
    const positionInHour = currentMinute / 60;
    
    // Calculate Y position: header height + (hourIndex * HOUR_HEIGHT) + (positionInHour * HOUR_HEIGHT)
    const headerHeight = 20; // height of headerRow
    const yPosition = headerHeight + (hourIndex * HOUR_HEIGHT) + (positionInHour * HOUR_HEIGHT);
    
    return yPosition;
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

        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.universityName}>{universityName}</Text>
            <TouchableOpacity
              style={styles.termDropdown}
              onPress={() => setIsTermDropdownOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.termText}> - {selectedTerm}</Text>
              <Text style={styles.termArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // TODO: Navigate to add schedule screen
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Term Dropdown Modal */}
        <Modal
          visible={isTermDropdownOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsTermDropdownOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsTermDropdownOpen(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Select Term</Text>
                  <TouchableOpacity onPress={() => setIsTermDropdownOpen(false)}>
                    <Text style={styles.modalCloseButton}>Done</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={TERMS}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.termOption,
                        item.value === selectedTerm && styles.termOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedTerm(item.value);
                        setIsTermDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.termOptionText,
                          item.value === selectedTerm && styles.termOptionTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.value === selectedTerm && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </SafeAreaView>
          </TouchableOpacity>
        </Modal>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Grid Container */}
          <View style={styles.gridContainer}>
            {/* Header Row - Day Labels */}
            <View style={styles.headerRow}>
              <View style={[styles.timeColumnHeader, styles.cell]} />
              {DAYS.map((day) => (
                <View
                  key={day.value}
                  style={[styles.dayColumnHeader, styles.cell]}
                >
                  <Text style={styles.dayLabel}>{day.label}</Text>
                </View>
              ))}
            </View>

            {/* Current Time Indicator Line */}
            {currentTimeY !== null && (
              <View
                style={[
                  styles.currentTimeLine,
                  { top: currentTimeY },
                ]}
              />
            )}

            {/* Time Slots Rows */}
            {timeSlots.map((hour, hourIndex) => (
              <View key={hour} style={styles.timeRow}>
                {/* Time Label */}
                <View style={[styles.timeCell, styles.cell]}>
                  <Text style={styles.timeLabel}>{formatTime(hour)}</Text>
                </View>

                {/* Day Columns */}
                {DAYS.map((day) => (
                  <View
                    key={`${hour}-${day.value}`}
                    style={[styles.dayCell, styles.cell]}
                  >
                    {/* Grid line at the bottom */}
                    {hourIndex < timeSlots.length - 1 && (
                      <View style={styles.gridLineBottom} />
                    )}
                  </View>
                ))}
              </View>
            ))}
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
    paddingHorizontal: spacing.md,
    paddingVertical: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  addButtonText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  universityName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  termDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  termArrow: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseButton: {
    fontSize: fontSize.md,
    color: colors.link,
    fontWeight: '600',
  },
  termOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  termOptionSelected: {
    backgroundColor: colors.backgroundSecondary,
  },
  termOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  termOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  gridContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    height: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    minHeight: HOUR_HEIGHT,
  },
  cell: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  timeColumnHeader: {
    width: TIME_COLUMN_WIDTH,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeColumnHeaderText: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '500',
  },
  dayColumnHeader: {
    width: DAY_COLUMN_WIDTH,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textLight,
    textAlign: 'center',
  },
  timeCell: {
    width: TIME_COLUMN_WIDTH,
    minHeight: HOUR_HEIGHT,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 4,
    paddingTop: spacing.xs,
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    fontWeight: '500',
  },
  dayCell: {
    width: DAY_COLUMN_WIDTH,
    minHeight: HOUR_HEIGHT,
    position: 'relative',
  },
  gridLineBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  currentTimeLine: {
    position: 'absolute',
    left: TIME_COLUMN_WIDTH,
    right: 0,
    height: 2,
    backgroundColor: colors.error,
    zIndex: 10,
  },
});
