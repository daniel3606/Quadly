'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Header } from '@/components/Header';

interface CourseCatalogCourse {
  id: string;
  subject_code: string;
  course_number: string;
  title: string;
  description?: string;
  credit_min?: number;
  credit_max?: number;
  prerequisites?: Array<{
    raw_text: string;
    parsed_json?: any;
    confidence: number;
  }>;
}

interface Schedule {
  id: string;
  name: string;
  total_credits_cached: number;
  items: ScheduleItem[];
}

interface ScheduleItem {
  id: string;
  title: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
  location?: string;
  color?: string;
  course_id?: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
];

export default function SchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState('');
  
  // Course search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [searchResults, setSearchResults] = useState<CourseCatalogCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseCatalogCourse | null>(null);
  const [searching, setSearching] = useState(false);
  
  // Add to schedule modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    day_of_week: 1,
    start_hour: 9,
    start_minute: 0,
    end_hour: 10,
    end_minute: 30,
    location: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    apiClient.setToken(token);
    loadSchedules();
  }, [router]);

  const loadSchedules = async () => {
    try {
      const data = await apiClient.get<Schedule[]>('/schedules');
      setSchedules(data);
      if (data.length > 0 && !currentSchedule) {
        setCurrentSchedule(data[0]);
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!newScheduleName.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    try {
      const newSchedule = await apiClient.post<Schedule>('/schedules', {
        name: newScheduleName.trim(),
      });
      setSchedules([...schedules, newSchedule]);
      setCurrentSchedule(newSchedule);
      setShowCreateScheduleModal(false);
      setNewScheduleName('');
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const searchCourses = async () => {
    if (!searchTerm && !searchSubject) return;
    
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (searchSubject) params.append('subject', searchSubject);
      params.append('limit', '50');
      
      const response = await apiClient.get<{
        data: CourseCatalogCourse[];
        pagination: any;
      }>(`/catalog/courses/search?${params.toString()}`);
      
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search courses:', error);
      alert('Failed to search courses');
    } finally {
      setSearching(false);
    }
  };

  const getCourseDetail = async (courseId: string) => {
    try {
      const course = await apiClient.get<CourseCatalogCourse>(`/catalog/courses/${courseId}`);
      setSelectedCourse(course);
    } catch (error) {
      console.error('Failed to load course detail:', error);
    }
  };

  const handleAddToSchedule = () => {
    if (!currentSchedule || !selectedCourse) return;
    
    setShowAddModal(true);
    // Reset form
    setAddForm({
      day_of_week: 1,
      start_hour: 9,
      start_minute: 0,
      end_hour: 10,
      end_minute: 30,
      location: '',
    });
  };

  const submitAddToSchedule = async () => {
    if (!currentSchedule || !selectedCourse) return;

    try {
      const startMinute = addForm.start_hour * 60 + addForm.start_minute;
      const endMinute = addForm.end_hour * 60 + addForm.end_minute;

      if (endMinute <= startMinute) {
        alert('End time must be after start time');
        return;
      }

      await apiClient.post(`/schedules/${currentSchedule.id}/items`, {
        course_id: selectedCourse.id,
        title: `${selectedCourse.subject_code} ${selectedCourse.course_number}: ${selectedCourse.title}`,
        day_of_week: addForm.day_of_week,
        start_minute: startMinute,
        end_minute: endMinute,
        location: addForm.location || null,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });

      // Reload schedules
      await loadSchedules();
      setShowAddModal(false);
      alert('Course added to schedule!');
    } catch (error) {
      console.error('Failed to add course to schedule:', error);
      alert('Failed to add course to schedule');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const getTimePosition = (startMinute: number) => {
    // Assuming schedule starts at 8 AM (480 minutes)
    const startOfDay = 480;
    return ((startMinute - startOfDay) / 60) * 60; // 60px per hour
  };

  const getTimeHeight = (startMinute: number, endMinute: number) => {
    return ((endMinute - startMinute) / 60) * 60; // 60px per hour
  };

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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />
        
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Home
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Schedule
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Course Search */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Search Courses
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject Code (e.g., ASIAN, MATH)
                  </label>
                  <input
                    type="text"
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value.toUpperCase())}
                    placeholder="ASIAN"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Query
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCourses()}
                    placeholder="Course name or number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={searchCourses}
                  disabled={searching}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">
                  Results ({searchResults.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => getCourseDetail(course.id)}
                      className={`p-3 rounded-md cursor-pointer border ${
                        selectedCourse?.id === course.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {course.subject_code} {course.course_number}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {course.title}
                      </div>
                      {(course.credit_min || course.credit_max) && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {course.credit_min === course.credit_max
                            ? `${course.credit_min} credits`
                            : `${course.credit_min || 0}-${course.credit_max || 0} credits`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Panel - Course Detail */}
          <div className="lg:col-span-1">
            {selectedCourse ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  {selectedCourse.subject_code} {selectedCourse.course_number}
                </h3>
                <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">
                  {selectedCourse.title}
                </h4>
                
                {(selectedCourse.credit_min || selectedCourse.credit_max) && (
                  <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <strong>Credits:</strong>{' '}
                    {selectedCourse.credit_min === selectedCourse.credit_max
                      ? `${selectedCourse.credit_min}`
                      : `${selectedCourse.credit_min || 0}-${selectedCourse.credit_max || 0}`}
                  </div>
                )}
                
                {selectedCourse.description && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Description
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedCourse.description}
                    </p>
                  </div>
                )}
                
                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Prerequisites
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCourse.prerequisites[0].raw_text}
                    </p>
                  </div>
                )}
                
                {currentSchedule && (
                  <button
                    onClick={handleAddToSchedule}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md mt-4"
                  >
                    Add to Schedule
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Select a course to view details
                </p>
              </div>
            )}
          </div>

          {/* Right Panel - Schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentSchedule?.name || 'No Schedule'}
                </h3>
                <div className="flex gap-2">
                  {schedules.length > 0 && (
                    <select
                      value={currentSchedule?.id || ''}
                      onChange={(e) => {
                        const schedule = schedules.find(s => s.id === e.target.value);
                        setCurrentSchedule(schedule || null);
                      }}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      {schedules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setShowCreateScheduleModal(true)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                  >
                    + New
                  </button>
                </div>
              </div>

              {currentSchedule ? (
                <div className="space-y-2">
                  {DAYS.map((day, dayIndex) => {
                    const dayItems = currentSchedule.items.filter(
                      (item) => item.day_of_week === dayIndex
                    );
                    return (
                      <div key={dayIndex} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                        <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                          {day}
                        </div>
                        {dayItems.length > 0 ? (
                          <div className="space-y-1">
                            {dayItems.map((item) => (
                              <div
                                key={item.id}
                                className="text-xs p-2 rounded"
                                style={{
                                  backgroundColor: item.color || '#E3F2FD',
                                  color: '#000',
                                }}
                              >
                                <div className="font-medium">{item.title}</div>
                                <div>
                                  {formatTime(item.start_minute)} - {formatTime(item.end_minute)}
                                </div>
                                {item.location && (
                                  <div className="text-gray-600">{item.location}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No classes</div>
                        )}
                      </div>
                    );
                  })}
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Total Credits: {currentSchedule.total_credits_cached}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No schedule selected. Create one to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Create Schedule Modal */}
        {showCreateScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Create New Schedule
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Schedule Name
                  </label>
                  <input
                    type="text"
                    value={newScheduleName}
                    onChange={(e) => setNewScheduleName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createSchedule()}
                    placeholder="e.g., Fall 2026"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateScheduleModal(false);
                    setNewScheduleName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createSchedule}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add to Schedule Modal */}
        {showAddModal && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Add to Schedule
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day of Week
                  </label>
                  <select
                    value={addForm.day_of_week}
                    onChange={(e) => setAddForm({ ...addForm, day_of_week: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {DAYS.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={addForm.start_hour}
                        onChange={(e) => setAddForm({ ...addForm, start_hour: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Hour"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={addForm.start_minute}
                        onChange={(e) => setAddForm({ ...addForm, start_minute: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Min"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={addForm.end_hour}
                        onChange={(e) => setAddForm({ ...addForm, end_hour: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Hour"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={addForm.end_minute}
                        onChange={(e) => setAddForm({ ...addForm, end_minute: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Min"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="e.g., Angell Hall 123"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddToSchedule}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
