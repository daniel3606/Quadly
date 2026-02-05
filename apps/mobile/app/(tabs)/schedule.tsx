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
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useScheduleStore, ScheduleItem } from '../../src/store/scheduleStore';

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

// Color options for schedule items
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
  const {
    selectedTerm,
    setSelectedTerm,
    schedulesByTerm,
    addScheduleItems,
    removeScheduleItem,
  } = useScheduleStore();
  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Get schedule items for the currently selected term
  const scheduleItems = schedulesByTerm[selectedTerm] || [];
  
  // Form state
  const [formDays, setFormDays] = useState<number[]>([1]); // Array for multiple day selection
  const [formClassName, setFormClassName] = useState('');
  const [formStartHour, setFormStartHour] = useState('9');
  const [formStartMinute, setFormStartMinute] = useState('0');
  const [formEndHour, setFormEndHour] = useState('10');
  const [formEndMinute, setFormEndMinute] = useState('0');
  const [formLocation, setFormLocation] = useState('');
  
  // Toggle day selection
  const toggleDay = (day: number) => {
    if (formDays.includes(day)) {
      // If only one day selected, don't allow deselecting
      if (formDays.length > 1) {
        setFormDays(formDays.filter((d) => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  // Get university name from user metadata or use default
  const universityName = (user?.user_metadata?.school as string) || 'University of Michigan';

  // Assign color based on class name (same class = same color)
  const getColorForClassName = (className: string): string => {
    // Simple hash function to consistently assign colors
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SCHEDULE_COLORS.length;
    return SCHEDULE_COLORS[index];
  };

  // Calculate schedule block position and dimensions
  const getScheduleBlockStyle = (item: ScheduleItem) => {
    const headerHeight = 20;
    const startMinutes = item.startHour * 60 + item.startMinute;
    const endMinutes = item.endHour * 60 + item.endMinute;
    const durationMinutes = endMinutes - startMinutes;
    
    // Calculate start position (minutes from 7am)
    const startFrom7am = startMinutes - (7 * 60);
    const top = headerHeight + (startFrom7am / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;
    
    return {
      top,
      height: Math.max(height, 20), // Minimum height
    };
  };

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
              setIsAddModalOpen(true);
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

        {/* Add Schedule Modal */}
        <Modal
          visible={isAddModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsAddModalOpen(false)}
            />
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.addModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Add Schedule</Text>
                  <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                    <Text style={styles.modalCloseButton}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.formContainer}>
                  {/* Day Selection */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Days (select multiple)</Text>
                    <View style={styles.dayButtons}>
                      {DAYS.map((day) => (
                        <TouchableOpacity
                          key={day.value}
                          style={[
                            styles.dayButton,
                            formDays.includes(day.value) && styles.dayButtonSelected,
                          ]}
                          onPress={() => toggleDay(day.value)}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              formDays.includes(day.value) && styles.dayButtonTextSelected,
                            ]}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Class Name */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Class Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formClassName}
                      onChangeText={setFormClassName}
                      placeholder="e.g., CS 101"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  {/* Start Time */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Start Time</Text>
                    <View style={styles.timePickerContainer}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Hour</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const hour = parseInt(formStartHour) || 7;
                              if (hour > 7) setFormStartHour(String(hour - 1));
                            }}
                            disabled={parseInt(formStartHour) <= 7}
                          >
                            <Text style={styles.timePickerButtonText}>−</Text>
                          </TouchableOpacity>
                          <View style={styles.timePickerValue}>
                            <Text style={styles.timePickerValueText}>{formStartHour || '7'}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const hour = parseInt(formStartHour) || 7;
                              if (hour < 22) setFormStartHour(String(hour + 1));
                            }}
                            disabled={parseInt(formStartHour) >= 22}
                          >
                            <Text style={styles.timePickerButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Minute</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const minute = parseInt(formStartMinute) || 0;
                              if (minute > 0) {
                                setFormStartMinute(String(minute - 15));
                              } else {
                                setFormStartMinute('45');
                              }
                            }}
                          >
                            <Text style={styles.timePickerButtonText}>−</Text>
                          </TouchableOpacity>
                          <View style={styles.timePickerValue}>
                            <Text style={styles.timePickerValueText}>
                              {String(parseInt(formStartMinute) || 0).padStart(2, '0')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const minute = parseInt(formStartMinute) || 0;
                              if (minute < 45) {
                                setFormStartMinute(String(minute + 15));
                              } else {
                                setFormStartMinute('0');
                              }
                            }}
                          >
                            <Text style={styles.timePickerButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* End Time */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>End Time</Text>
                    <View style={styles.timePickerContainer}>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Hour</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const hour = parseInt(formEndHour) || 7;
                              if (hour > 7) setFormEndHour(String(hour - 1));
                            }}
                            disabled={parseInt(formEndHour) <= 7}
                          >
                            <Text style={styles.timePickerButtonText}>−</Text>
                          </TouchableOpacity>
                          <View style={styles.timePickerValue}>
                            <Text style={styles.timePickerValueText}>{formEndHour || '7'}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const hour = parseInt(formEndHour) || 7;
                              if (hour < 22) setFormEndHour(String(hour + 1));
                            }}
                            disabled={parseInt(formEndHour) >= 22}
                          >
                            <Text style={styles.timePickerButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.timePickerColumn}>
                        <Text style={styles.timePickerLabel}>Minute</Text>
                        <View style={styles.timePickerControls}>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const minute = parseInt(formEndMinute) || 0;
                              if (minute > 0) {
                                setFormEndMinute(String(minute - 15));
                              } else {
                                setFormEndMinute('45');
                              }
                            }}
                          >
                            <Text style={styles.timePickerButtonText}>−</Text>
                          </TouchableOpacity>
                          <View style={styles.timePickerValue}>
                            <Text style={styles.timePickerValueText}>
                              {String(parseInt(formEndMinute) || 0).padStart(2, '0')}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.timePickerButton}
                            onPress={() => {
                              const minute = parseInt(formEndMinute) || 0;
                              if (minute < 45) {
                                setFormEndMinute(String(minute + 15));
                              } else {
                                setFormEndMinute('0');
                              }
                            }}
                          >
                            <Text style={styles.timePickerButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Location */}
                  <View style={styles.formSection}>
                    <Text style={styles.formLabel}>Location</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formLocation}
                      onChangeText={setFormLocation}
                      placeholder="e.g., Room 101"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => {
                      const startH = parseInt(formStartHour) || 9;
                      const startM = parseInt(formStartMinute) || 0;
                      const endH = parseInt(formEndHour) || 10;
                      const endM = parseInt(formEndMinute) || 0;

                      if (formClassName.trim() && formDays.length > 0 && startH >= 7 && startH <= 22 && endH >= 7 && endH <= 22) {
                        // Create a schedule item for each selected day
                        const newItems: ScheduleItem[] = formDays.map((day, index) => ({
                          id: `${Date.now()}-${index}`,
                          day: day,
                          className: formClassName.trim(),
                          startHour: startH,
                          startMinute: startM,
                          endHour: endH,
                          endMinute: endM,
                          location: formLocation.trim(),
                        }));

                        // Add all items to the current term's schedule
                        addScheduleItems(selectedTerm, newItems);
                        // Reset form
                        setFormDays([1]);
                        setFormClassName('');
                        setFormStartHour('9');
                        setFormStartMinute('0');
                        setFormEndHour('10');
                        setFormEndMinute('0');
                        setFormLocation('');
                        setIsAddModalOpen(false);
                      }
                    }}
                  >
                    <Text style={styles.submitButtonText}>Add Schedule</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </SafeAreaView>
          </View>
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

            {/* Schedule Blocks */}
            {scheduleItems.map((item) => {
              const blockStyle = getScheduleBlockStyle(item);
              const dayIndex = DAYS.findIndex((d) => d.value === item.day);
              const left = TIME_COLUMN_WIDTH + dayIndex * DAY_COLUMN_WIDTH;
              
              return (
                <TouchableOpacity
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
                  onLongPress={() => {
                    Alert.alert(
                      'Delete Schedule',
                      `Are you sure you want to delete "${item.className}"?`,
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel',
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            removeScheduleItem(selectedTerm, item.id);
                          },
                        },
                      ]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scheduleBlockTitle} numberOfLines={1}>
                    {item.className}
                  </Text>
                  {item.location && (
                    <Text style={styles.scheduleBlockLocation} numberOfLines={1}>
                      {item.location}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e1e1e1',
  },
  headerRow: {
    flexDirection: 'row',
    height: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
    backgroundColor: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    minHeight: HOUR_HEIGHT,
  },
  cell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e1e1e1',
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#efefef',
  },
  currentTimeLine: {
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
  addModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: spacing.lg,
    maxHeight: '90%',
  },
  formContainer: {
    padding: spacing.md,
  },
  formSection: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dayButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  dayButtonTextSelected: {
    color: '#ffffff',
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    textAlign: 'center',
  },
  timeInputLabel: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: '#ffffff',
  },
  timePickerContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timePickerColumn: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  timePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timePickerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePickerButtonText: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.primary,
  },
  timePickerValue: {
    minWidth: 60,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerValueText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
});
