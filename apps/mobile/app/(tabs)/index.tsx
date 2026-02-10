import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/authStore';
import { useScheduleStore, ScheduleItem } from '../../src/store/scheduleStore';
import { useCommunityStore, Post } from '../../src/store/communityStore';
import { colors, fontSize, spacing, borderRadius, cardShadow } from '../../src/constants/colors';
import { supabase } from '../../src/lib/supabase';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-7730847696902610/5867442604';
// Hot score calculation function
const calculateHotScore = (
  likeCount: number,
  commentCount: number,
  viewCount: number,
  createdAt: Date
): number => {
  const baseScore = likeCount * 2 + commentCount * 3 + Math.log(viewCount + 1);
  const hoursSincePost = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const timeDecay = 1 / Math.pow(hoursSincePost + 2, 1.3);
  return baseScore * timeDecay;
};

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
  const { boardsWithLatestPost, savedBoardIds, initialize, isInitialized, fetchBoardsWithLatestPost } = useCommunityStore();
  
  const [hotPosts, setHotPosts] = useState<Post[]>([]);
  const [isLoadingHotPosts, setIsLoadingHotPosts] = useState(false);

  const userEmail = user?.email ?? 'user@example.com';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const collegeName = (user?.user_metadata?.school as string) || 'University of Michigan';
  const avatarUrl = (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture) as string | undefined;

  const scheduleItems = schedulesByTerm[selectedTerm] || [];

  // Get saved boards with latest posts
  const savedBoards = boardsWithLatestPost.filter((board) => savedBoardIds.has(board.id));

  // Initialize community store if needed
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  // Refresh board read status when tab regains focus
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        fetchBoardsWithLatestPost();
      }
    }, [isInitialized])
  );

  // Fetch hot posts today
  useEffect(() => {
    fetchHotPosts();
  }, []);

  const fetchHotPosts = async () => {
    setIsLoadingHotPosts(true);
    try {
      // Get posts from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', todayISO)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate hot scores and sort
      const postsWithScores = (postsData || []).map((post) => ({
        ...post,
        hotScore: calculateHotScore(
          post.like_count,
          post.comment_count,
          post.view_count,
          new Date(post.created_at)
        ),
      }));

      // Sort by hot score and take top 5
      const sortedPosts = postsWithScores
        .sort((a, b) => b.hotScore - a.hotScore)
        .slice(0, 5);

      setHotPosts(sortedPosts);
    } catch (error) {
      console.error('Failed to fetch hot posts:', error);
    } finally {
      setIsLoadingHotPosts(false);
    }
  };

  // Calculate time window: 1.5 hours before and after current time
  const getTimeWindow = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    if (currentHour < 7 || currentHour > 22) {
      return {
        startHour: 7,
        endHour: 10,
        currentTimePosition: null,
        windowStartMinutes: 7 * 60,
      };
    }

    let windowStartMinutes = currentTimeInMinutes - 90;
    let windowEndMinutes = currentTimeInMinutes + 90;

    if (windowStartMinutes < 7 * 60) {
      windowStartMinutes = 7 * 60;
    }
    if (windowEndMinutes > 22 * 60) {
      windowEndMinutes = 22 * 60;
    }

    const startHour = Math.floor(windowStartMinutes / 60);
    const endHour = Math.ceil(windowEndMinutes / 60);
    const currentTimePosition = currentTimeInMinutes - windowStartMinutes;

    return {
      startHour,
      endHour,
      currentTimePosition,
      windowStartMinutes,
    };
  };

  const timeWindow = getTimeWindow();
  const TIME_COLUMN_WIDTH = 25;
  const DAY_COLUMN_WIDTH = Math.floor((340 - TIME_COLUMN_WIDTH - 40) / 5);
  const HOUR_HEIGHT = 70;

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

  const getCurrentTimePosition = () => {
    if (timeWindow.currentTimePosition === null) return null;
    return (timeWindow.currentTimePosition / 60) * HOUR_HEIGHT;
  };

  const currentTimeY = getCurrentTimePosition();

  const handleBoardPress = (boardId: string) => {
    router.push({
      pathname: '/board/[id]',
      params: { id: boardId },
    });
  };

  const handlePostPress = (postId: string) => {
    router.push({
      pathname: '/post/[id]',
      params: { id: postId },
    });
  };

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
            <Image
              source={require('../../assets/QuadlyIcon.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerTitles}>
              <Text style={styles.appName}>Quadly</Text>
              <Text style={styles.subtitle}>{collegeName}</Text>
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
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Image
                source={require('../../assets/settings_icon.png')}
                style={styles.settingsIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/settings')}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.profileInitial}>{userInitial}</Text>
              )}
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
              {currentTimeY !== null && (
                <View
                  style={[
                    styles.scheduleCurrentTimeLine,
                    { top: currentTimeY },
                  ]}
                />
              )}

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

          {/* Saved Boards */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Boards</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/community')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {savedBoards.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No saved boards yet</Text>
                <Text style={styles.emptySubtext}>
                  Save boards to see them here
                </Text>
              </View>
            ) : (
              <View style={styles.boardsCard}>
                {savedBoards.map((board, index) => (
                  <TouchableOpacity
                    key={board.id}
                    style={styles.boardRow}
                    onPress={() => handleBoardPress(board.id)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.boardName} numberOfLines={1}>
                      {board.name}
                    </Text>
                    <Text style={styles.boardLatestPost} numberOfLines={1}>
                      {board.latestPost?.title || 'No posts yet'}
                    </Text>
                    {board.latestPost && !board.latestPost.isRead && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Banner Ad */}
          <View style={styles.adContainer}>
            <BannerAd
              unitId={adUnitId}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            />
          </View>

          {/* Hot Posts Today */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Hot Posts Today</Text>
            </View>
            {isLoadingHotPosts ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Loading...</Text>
              </View>
            ) : hotPosts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hot posts today</Text>
                <Text style={styles.emptySubtext}>
                  Check back later for trending posts
                </Text>
              </View>
            ) : (
              <View style={styles.postsContainer}>
                {hotPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => handlePostPress(post.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.postTitle} numberOfLines={2}>
                      {post.title}
                    </Text>
                    <View style={styles.postStats}>
                      <View style={styles.postStatItem}>
                        <Image
                          source={require('../../assets/view_icon.png')}
                          style={styles.postStatIcon}
                        />
                        <Text style={styles.postStatText}>{post.view_count}</Text>
                      </View>
                      <View style={styles.postStatItem}>
                        <Image
                          source={require('../../assets/like_icon.png')}
                          style={styles.postStatIcon}
                        />
                        <Text style={styles.postStatText}>{post.like_count}</Text>
                      </View>
                      <View style={styles.postStatItem}>
                        <Image
                          source={require('../../assets/comment_icon.png')}
                          style={styles.postStatIcon}
                        />
                        <Text style={styles.postStatText}>{post.comment_count}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
    borderRadius: 10,
  },
  headerTitles: {
    marginLeft: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
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
    tintColor: '#00274C',
  },
  settingsButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#00274C',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#000000',
  },
  profileAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  viewAllText: {
    fontSize: 14,
    color: colors.link,
    fontWeight: '500',
  },
  // Schedule Preview Styles
  scheduleGridContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e1e1e1',
    height: 210,
    position: 'relative',
  },
  scheduleTimeRow: {
    flexDirection: 'row',
    minHeight: 70,
  },
  scheduleCell: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#e1e1e1',
  },
  scheduleTimeCell: {
    width: 25,
    minHeight: 70,
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
    width: Math.floor((340 - 25 - 40) / 5),
    minHeight: 70,
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
    left: 25,
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
  // Ad Styles
  adContainer: {
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e1e1e1',
  },
  // Saved Boards Styles
  boardsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    ...cardShadow,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  boardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    width: 90,
    marginRight: 10,
  },
  boardLatestPost: {
    flex: 1,
    fontSize: 13,
    color: '#999999',
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  // Hot Posts Styles
  postsContainer: {
    gap: 12,
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 20,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatIcon: {
    width: 14,
    height: 14,
    tintColor: '#666666',
  },
  postStatText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    ...cardShadow,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});
