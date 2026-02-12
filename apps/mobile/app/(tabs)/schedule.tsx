import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useScheduleStore, ScheduleItem } from '../../src/store/scheduleStore';
import { supabase } from '../../src/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIME_COLUMN_WIDTH = 25;
const GRID_PADDING = spacing.lg * 2;
const DAY_COLUMN_WIDTH = Math.floor((SCREEN_WIDTH - TIME_COLUMN_WIDTH - GRID_PADDING) / 5);
const HOUR_HEIGHT = 70;

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 22; hour++) {
    slots.push(hour);
  }
  return slots;
};

const formatTime = (hour: number): string => {
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

const SCHEDULE_COLORS = [
  '#E18B7A', '#E5C475', '#AEC97C', '#91CFC2',
  '#81A4E5', '#EDB071', '#9B88D9', '#8CC98D',
];

// ── Helpers ──

/** Parse "MWF" → [1,3,5], "TTH" → [2,4] */
function parseDaysString(days: string): number[] {
  const result: number[] = [];
  let i = 0;
  while (i < days.length) {
    const ch = days[i];
    if (ch === 'M') { result.push(1); i++; }
    else if (ch === 'T' && days[i + 1] === 'H') { result.push(4); i += 2; }
    else if (ch === 'T') { result.push(2); i++; }
    else if (ch === 'W') { result.push(3); i++; }
    else if (ch === 'F') { result.push(5); i++; }
    else { i++; }
  }
  return result;
}

/** Parse "10:30:00" → { hour: 10, minute: 30 } */
function parseTimeString(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

/** Format term code for display: "WN2026" → "WN 2026" */
function formatTermDisplay(code: string): string {
  return `${code.slice(0, 2)} ${code.slice(2)}`;
}

// ── Types ──

interface DBTerm {
  code: string;
  name: string;
  is_current: boolean;
}

interface CourseResult {
  id: number;
  subject_code: string;
  catalog_number: string;
  title: string;
  credits_min: number | null;
  credits_max: number | null;
}

interface SectionResult {
  id: number;
  section_number: string;
  component: string;
  class_number: string;
  instructor: string | null;
  enrollment_cap: number;
  enrollment_total: number;
  is_open: boolean;
  meetings: {
    days: string | null;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
    is_arranged: boolean;
  }[];
}

export default function ScheduleScreen() {
  const timeSlots = generateTimeSlots();
  const { user, universityId } = useAuthStore();
  const {
    selectedTerm,
    setSelectedTerm,
    schedulesByTerm,
    addScheduleItems,
    removeScheduleItem,
  } = useScheduleStore();

  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dbTerms, setDbTerms] = useState<DBTerm[]>([]);

  // Add modal state
  const [addMode, setAddMode] = useState<'search' | 'sections' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CourseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResult | null>(null);
  const [courseSections, setCourseSections] = useState<SectionResult[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  // Manual form state
  const [formDays, setFormDays] = useState<number[]>([1]);
  const [formClassName, setFormClassName] = useState('');
  const [formStartHour, setFormStartHour] = useState('9');
  const [formStartMinute, setFormStartMinute] = useState('0');
  const [formEndHour, setFormEndHour] = useState('10');
  const [formEndMinute, setFormEndMinute] = useState('0');
  const [formLocation, setFormLocation] = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch terms from DB
  useEffect(() => {
    (async () => {
      // RLS policy filters by university_id automatically
      const { data } = await supabase
        .from('terms')
        .select('code, name, is_current')
        .order('year', { ascending: false })
        .order('code', { ascending: false });

      if (data && data.length > 0) {
        setDbTerms(data);
        const current = data.find((t) => t.is_current);
        if (current) setSelectedTerm(current.code);
      }
    })();
  }, [universityId]);

  const scheduleItems = schedulesByTerm[selectedTerm] || [];

  // ── Search courses (debounced) ──
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = text.trim();
        const subjectCatalogMatch = q.match(/^([A-Za-z]+)\s*(\d+\w*)$/);

        // RLS policy filters by university_id automatically
        let query = supabase
          .from('courses')
          .select('id, subject_code, catalog_number, title, credits_min, credits_max')
          .limit(15);

        if (subjectCatalogMatch) {
          const [, subject, catalog] = subjectCatalogMatch;
          query = query.ilike('subject_code', subject).ilike('catalog_number', `${catalog}%`);
        } else {
          query = query.or(`title.ilike.%${q}%,subject_code.ilike.%${q}%`);
        }

        const { data, error } = await query;
        if (!error && data) setSearchResults(data as CourseResult[]);
      } catch {
        // ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  // ── Fetch sections for a course ──
  const handleSelectCourse = useCallback(async (course: CourseResult) => {
    setSelectedCourse(course);
    setAddMode('sections');
    setIsLoadingSections(true);

    try {
      // RLS policy filters by university_id automatically
      const { data, error } = await supabase
        .from('sections')
        .select(`
          id, section_number, component, class_number, instructor,
          enrollment_cap, enrollment_total, is_open,
          meetings (days, start_time, end_time, location, is_arranged)
        `)
        .eq('course_id', course.id)
        .eq('term_code', selectedTerm)
        .order('component')
        .order('section_number');

      if (!error && data) {
        setCourseSections(data as unknown as SectionResult[]);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSections(false);
    }
  }, [selectedTerm]);

  // ── Add section to schedule ──
  const handleAddSection = useCallback((section: SectionResult) => {
    if (!selectedCourse) return;

    const className = `${selectedCourse.subject_code} ${selectedCourse.catalog_number}`;
    const newItems: ScheduleItem[] = [];

    for (const meeting of section.meetings) {
      if (!meeting.days || !meeting.start_time || !meeting.end_time || meeting.is_arranged) continue;

      const dayNumbers = parseDaysString(meeting.days);
      const start = parseTimeString(meeting.start_time);
      const end = parseTimeString(meeting.end_time);

      for (const day of dayNumbers) {
        newItems.push({
          id: `${Date.now()}-${section.class_number}-${day}`,
          day,
          className,
          startHour: start.hour,
          startMinute: start.minute,
          endHour: end.hour,
          endMinute: end.minute,
          location: meeting.location || '',
        });
      }
    }

    if (newItems.length === 0) {
      Alert.alert('No Meetings', 'This section has no scheduled meeting times (TBA/ARR).');
      return;
    }

    addScheduleItems(selectedTerm, newItems);
    resetAddModal();
    setIsAddModalOpen(false);
  }, [selectedCourse, selectedTerm, addScheduleItems]);

  const resetAddModal = () => {
    setAddMode('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCourse(null);
    setCourseSections([]);
    setFormDays([1]);
    setFormClassName('');
    setFormStartHour('9');
    setFormStartMinute('0');
    setFormEndHour('10');
    setFormEndMinute('0');
    setFormLocation('');
  };

  const toggleDay = (day: number) => {
    if (formDays.includes(day)) {
      if (formDays.length > 1) setFormDays(formDays.filter((d) => d !== day));
    } else {
      setFormDays([...formDays, day]);
    }
  };

  const universityName = (user?.user_metadata?.school as string) || 'Your University';

  const getColorForClassName = (className: string): string => {
    let hash = 0;
    for (let i = 0; i < className.length; i++) {
      hash = className.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SCHEDULE_COLORS[Math.abs(hash) % SCHEDULE_COLORS.length];
  };

  const getScheduleBlockStyle = (item: ScheduleItem) => {
    const headerHeight = 20;
    const startMinutes = item.startHour * 60 + item.startMinute;
    const endMinutes = item.endHour * 60 + item.endMinute;
    const durationMinutes = endMinutes - startMinutes;
    const startFrom7am = startMinutes - 7 * 60;
    return {
      top: headerHeight + (startFrom7am / 60) * HOUR_HEIGHT,
      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20),
    };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    if (h < 7 || h > 22) return null;
    return 20 + ((h - 7) + m / 60) * HOUR_HEIGHT;
  };

  const currentTimeY = getCurrentTimePosition();

  // ── Term list for dropdown ──
  const termOptions = dbTerms.length > 0
    ? dbTerms.map((t) => ({ label: formatTermDisplay(t.code), value: t.code }))
    : [{ label: 'WN 2026', value: 'WN2026' }];

  // ── Render helpers for Add Modal ──

  const renderSearchStep = () => (
    <>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search courses (e.g. EECS 281)"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="search"
        />
        {isSearching && <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />}
      </View>

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectCourse(item)}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultCode}>
                  {item.subject_code} {item.catalog_number}
                </Text>
                {item.credits_min != null && (
                  <Text style={styles.resultCredits}>
                    {item.credits_min === item.credits_max
                      ? `${item.credits_min} cr`
                      : `${item.credits_min}-${item.credits_max} cr`}
                  </Text>
                )}
              </View>
              <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No courses found</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.manualEntryButton}
        onPress={() => setAddMode('manual')}
      >
        <Text style={styles.manualEntryText}>Or add manually</Text>
      </TouchableOpacity>
    </>
  );

  const renderSectionsStep = () => (
    <>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => { setAddMode('search'); setCourseSections([]); }}
      >
        <Text style={styles.backButtonText}>Back to search</Text>
      </TouchableOpacity>

      {selectedCourse && (
        <View style={styles.courseHeader}>
          <Text style={styles.courseHeaderCode}>
            {selectedCourse.subject_code} {selectedCourse.catalog_number}
          </Text>
          <Text style={styles.courseHeaderTitle}>{selectedCourse.title}</Text>
          <Text style={styles.courseHeaderTerm}>{formatTermDisplay(selectedTerm)}</Text>
        </View>
      )}

      {isLoadingSections ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      ) : courseSections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No sections found for this term</Text>
        </View>
      ) : (
        <FlatList
          data={courseSections}
          keyExtractor={(item) => String(item.id)}
          style={styles.resultsList}
          renderItem={({ item: section }) => {
            const meetingsWithTime = section.meetings.filter(
              (m) => m.days && m.start_time && m.end_time && !m.is_arranged
            );

            return (
              <TouchableOpacity
                style={[styles.sectionItem, !section.is_open && styles.sectionClosed]}
                onPress={() => handleAddSection(section)}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>
                    {section.component} {section.section_number}
                  </Text>
                  <View style={[styles.statusBadge, section.is_open ? styles.openBadge : styles.closedBadge]}>
                    <Text style={styles.statusBadgeText}>
                      {section.is_open ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>

                {section.instructor && (
                  <Text style={styles.sectionInstructor}>{section.instructor}</Text>
                )}

                <Text style={styles.sectionEnrollment}>
                  {section.enrollment_total}/{section.enrollment_cap} enrolled
                </Text>

                {meetingsWithTime.length > 0 ? (
                  meetingsWithTime.map((m, i) => (
                    <View key={i} style={styles.meetingRow}>
                      <Text style={styles.meetingDays}>{m.days}</Text>
                      <Text style={styles.meetingTime}>
                        {m.start_time?.slice(0, 5)} - {m.end_time?.slice(0, 5)}
                      </Text>
                      {m.location && <Text style={styles.meetingLocation}>{m.location}</Text>}
                    </View>
                  ))
                ) : (
                  <Text style={styles.meetingTBA}>TBA / Arranged</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </>
  );

  const renderManualStep = () => (
    <ScrollView
      style={styles.formContainer}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.formContentContainer}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setAddMode('search')}
      >
        <Text style={styles.backButtonText}>Back to search</Text>
      </TouchableOpacity>

      {/* Day Selection */}
      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Days (select multiple)</Text>
        <View style={styles.dayButtons}>
          {DAYS.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[styles.dayButton, formDays.includes(day.value) && styles.dayButtonSelected]}
              onPress={() => toggleDay(day.value)}
            >
              <Text style={[styles.dayButtonText, formDays.includes(day.value) && styles.dayButtonTextSelected]}>
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
          placeholder="e.g., EECS 281"
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
                onPress={() => { const h = parseInt(formStartHour) || 7; if (h > 7) setFormStartHour(String(h - 1)); }}
                disabled={parseInt(formStartHour) <= 7}
              >
                <Text style={styles.timePickerButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.timePickerValue}>
                <Text style={styles.timePickerValueText}>{formStartHour || '7'}</Text>
              </View>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => { const h = parseInt(formStartHour) || 7; if (h < 22) setFormStartHour(String(h + 1)); }}
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
                onPress={() => { const m = parseInt(formStartMinute) || 0; setFormStartMinute(String(m > 0 ? m - 15 : 45)); }}
              >
                <Text style={styles.timePickerButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.timePickerValue}>
                <Text style={styles.timePickerValueText}>{String(parseInt(formStartMinute) || 0).padStart(2, '0')}</Text>
              </View>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => { const m = parseInt(formStartMinute) || 0; setFormStartMinute(String(m < 45 ? m + 15 : 0)); }}
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
                onPress={() => { const h = parseInt(formEndHour) || 7; if (h > 7) setFormEndHour(String(h - 1)); }}
                disabled={parseInt(formEndHour) <= 7}
              >
                <Text style={styles.timePickerButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.timePickerValue}>
                <Text style={styles.timePickerValueText}>{formEndHour || '7'}</Text>
              </View>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => { const h = parseInt(formEndHour) || 7; if (h < 22) setFormEndHour(String(h + 1)); }}
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
                onPress={() => { const m = parseInt(formEndMinute) || 0; setFormEndMinute(String(m > 0 ? m - 15 : 45)); }}
              >
                <Text style={styles.timePickerButtonText}>-</Text>
              </TouchableOpacity>
              <View style={styles.timePickerValue}>
                <Text style={styles.timePickerValueText}>{String(parseInt(formEndMinute) || 0).padStart(2, '0')}</Text>
              </View>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => { const m = parseInt(formEndMinute) || 0; setFormEndMinute(String(m < 45 ? m + 15 : 0)); }}
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
          placeholder="e.g., 1571 GGBL"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => {
          const startH = parseInt(formStartHour) || 9;
          const startM = parseInt(formStartMinute) || 0;
          const endH = parseInt(formEndHour) || 10;
          const endM = parseInt(formEndMinute) || 0;
          if (formClassName.trim() && formDays.length > 0 && startH >= 7 && endH >= 7) {
            const newItems: ScheduleItem[] = formDays.map((day, idx) => ({
              id: `${Date.now()}-${idx}`,
              day,
              className: formClassName.trim(),
              startHour: startH,
              startMinute: startM,
              endHour: endH,
              endMinute: endM,
              location: formLocation.trim(),
            }));
            addScheduleItems(selectedTerm, newItems);
            resetAddModal();
            setIsAddModalOpen(false);
          }
        }}
      >
        <Text style={styles.submitButtonText}>Add Schedule</Text>
      </TouchableOpacity>
    </ScrollView>
  );

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
              <Text style={styles.termText}> - {formatTermDisplay(selectedTerm)}</Text>
              <Text style={styles.termArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { resetAddModal(); setIsAddModalOpen(true); }}
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
                  data={termOptions}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.termOption, item.value === selectedTerm && styles.termOptionSelected]}
                      onPress={() => { setSelectedTerm(item.value); setIsTermDropdownOpen(false); }}
                    >
                      <Text style={[styles.termOptionText, item.value === selectedTerm && styles.termOptionTextSelected]}>
                        {item.label}
                      </Text>
                      {item.value === selectedTerm && <Text style={styles.checkmark}>✓</Text>}
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
          <View style={styles.addModalOverlay}>
            <TouchableOpacity
              style={styles.addModalBackdrop}
              activeOpacity={1}
              onPress={() => setIsAddModalOpen(false)}
            />
            <KeyboardAvoidingView
              style={styles.addModalSheet}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>
                    {addMode === 'search' ? 'Add Course' : addMode === 'sections' ? 'Pick Section' : 'Manual Entry'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                    <Text style={styles.modalCloseButton}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  {addMode === 'search' && renderSearchStep()}
                  {addMode === 'sections' && renderSectionsStep()}
                  {addMode === 'manual' && renderManualStep()}
                </View>
              </SafeAreaView>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Update Banner */}
        <View style={styles.updateBanner}>
          <Text style={styles.updateBannerText}>
            The schedule feature is still being updated.
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.gridContainer}>
            {/* Header Row - Day Labels */}
            <View style={styles.headerRow}>
              <View style={[styles.timeColumnHeader, styles.cell]} />
              {DAYS.map((day) => (
                <View key={day.value} style={[styles.dayColumnHeader, styles.cell]}>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                </View>
              ))}
            </View>

            {/* Current Time Indicator Line */}
            {currentTimeY !== null && (
              <View style={[styles.currentTimeLine, { top: currentTimeY }]} />
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
                    { left, width: DAY_COLUMN_WIDTH, top: blockStyle.top, height: blockStyle.height, backgroundColor: getColorForClassName(item.className) },
                  ]}
                  onLongPress={() => {
                    Alert.alert('Delete Schedule', `Delete "${item.className}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removeScheduleItem(selectedTerm, item.id) },
                    ]);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scheduleBlockTitle} numberOfLines={1}>{item.className}</Text>
                  {item.location ? <Text style={styles.scheduleBlockLocation} numberOfLines={1}>{item.location}</Text> : null}
                </TouchableOpacity>
              );
            })}

            {/* Time Slots Rows */}
            {timeSlots.map((hour, hourIndex) => (
              <View key={hour} style={styles.timeRow}>
                <View style={[styles.timeCell, styles.cell]}>
                  <Text style={styles.timeLabel}>{formatTime(hour)}</Text>
                </View>
                {DAYS.map((day) => (
                  <View key={`${hour}-${day.value}`} style={[styles.dayCell, styles.cell]}>
                    {hourIndex < timeSlots.length - 1 && <View style={styles.gridLineBottom} />}
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: 20,
    backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  addButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md,
  },
  addButtonText: { fontSize: fontSize.xl, fontWeight: 'bold', color: '#ffffff' },
  universityName: { fontSize: fontSize.xl, fontWeight: '700', color: '#606060' },
  termDropdown: { flexDirection: 'row', alignItems: 'center' },
  termText: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
  termArrow: { fontSize: fontSize.xs, color: colors.textLight, marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' },
  modal: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: spacing.lg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalHeaderText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  modalCloseButton: { fontSize: fontSize.md, color: colors.link, fontWeight: '600' },
  termOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  termOptionSelected: { backgroundColor: colors.backgroundSecondary },
  termOptionText: { fontSize: fontSize.md, color: colors.text },
  termOptionTextSelected: { color: colors.primary, fontWeight: '600' },
  checkmark: { fontSize: fontSize.lg, color: colors.primary },
  updateBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#FFECB5',
  },
  updateBannerText: {
    fontSize: fontSize.sm,
    color: '#664D03',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  gridContainer: {
    backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#e1e1e1',
  },
  headerRow: {
    flexDirection: 'row', height: 20, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1', backgroundColor: '#ffffff',
  },
  timeRow: { flexDirection: 'row', minHeight: HOUR_HEIGHT },
  cell: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#e1e1e1' },
  timeColumnHeader: { width: TIME_COLUMN_WIDTH, height: 20, justifyContent: 'center', alignItems: 'center' },
  dayColumnHeader: { width: DAY_COLUMN_WIDTH, height: 20, justifyContent: 'center', alignItems: 'center' },
  dayLabel: { fontSize: fontSize.xs, fontWeight: '500', color: colors.textLight, textAlign: 'center' },
  timeCell: {
    width: TIME_COLUMN_WIDTH, minHeight: HOUR_HEIGHT,
    justifyContent: 'flex-start', alignItems: 'flex-end', paddingRight: 4, paddingTop: spacing.xs,
  },
  timeLabel: { fontSize: fontSize.xs, color: colors.textLight, fontWeight: '500' },
  dayCell: { width: DAY_COLUMN_WIDTH, minHeight: HOUR_HEIGHT, position: 'relative' },
  gridLineBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: StyleSheet.hairlineWidth, backgroundColor: '#efefef',
  },
  currentTimeLine: {
    position: 'absolute', left: TIME_COLUMN_WIDTH, right: 0,
    height: 2, backgroundColor: colors.error, zIndex: 10,
  },
  scheduleBlock: { position: 'absolute', borderRadius: 4, padding: 4, zIndex: 5, overflow: 'hidden' },
  scheduleBlockTitle: { fontSize: fontSize.xs, fontWeight: '600', color: '#ffffff', marginBottom: 2 },
  scheduleBlockLocation: { fontSize: fontSize.xs - 2, color: 'rgba(255, 255, 255, 0.9)' },
  addModalOverlay: {
    flex: 1, backgroundColor: 'transparent',
  },
  addModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addModalSheet: {
    height: '80%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // ── Search ──
  searchContainer: { paddingHorizontal: spacing.md, paddingTop: spacing.md, flexDirection: 'row', alignItems: 'center' },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: spacing.md,
    fontSize: fontSize.md, color: colors.text, backgroundColor: colors.backgroundSecondary,
  },
  searchSpinner: { marginLeft: spacing.sm },
  resultsList: { flex: 1, paddingHorizontal: spacing.md },
  resultItem: {
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  resultCode: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  resultCredits: { fontSize: fontSize.sm, color: colors.textLight },
  resultTitle: { fontSize: fontSize.sm, color: colors.textLight },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateText: { fontSize: fontSize.md, color: colors.textSecondary },
  manualEntryButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  manualEntryText: { fontSize: fontSize.md, color: colors.link, fontWeight: '500' },

  // ── Sections ──
  backButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backButtonText: { fontSize: fontSize.md, color: colors.link, fontWeight: '500' },
  courseHeader: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  courseHeaderCode: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  courseHeaderTitle: { fontSize: fontSize.md, color: colors.text, marginTop: 2 },
  courseHeaderTerm: { fontSize: fontSize.sm, color: colors.textLight, marginTop: 2 },
  sectionItem: {
    paddingVertical: 12, paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  sectionClosed: { opacity: 0.6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionLabel: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  openBadge: { backgroundColor: '#e6f4ea' },
  closedBadge: { backgroundColor: '#fce8e6' },
  statusBadgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  sectionInstructor: { fontSize: fontSize.sm, color: colors.text, marginBottom: 2 },
  sectionEnrollment: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 4 },
  meetingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  meetingDays: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, width: 36 },
  meetingTime: { fontSize: fontSize.sm, color: colors.text },
  meetingLocation: { fontSize: fontSize.sm, color: colors.textLight },
  meetingTBA: { fontSize: fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 },

  // ── Manual Form ──
  formContainer: { flex: 1 },
  formContentContainer: { padding: spacing.md, paddingBottom: spacing.xl },
  formSection: { marginBottom: spacing.md },
  formLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  dayButtons: { flexDirection: 'row', gap: spacing.sm },
  dayButton: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background, alignItems: 'center',
  },
  dayButtonSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayButtonText: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text },
  dayButtonTextSelected: { color: '#ffffff' },
  textInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    fontSize: fontSize.md, color: colors.text, backgroundColor: colors.background,
  },
  submitButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  submitButtonText: { fontSize: fontSize.md, fontWeight: '600', color: '#ffffff' },
  timePickerContainer: { flexDirection: 'row', gap: spacing.md },
  timePickerColumn: { flex: 1 },
  timePickerLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  timePickerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  timePickerButton: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: colors.backgroundSecondary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  timePickerButtonText: { fontSize: fontSize.xl, fontWeight: '600', color: colors.primary },
  timePickerValue: {
    minWidth: 60, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  timePickerValueText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
});
