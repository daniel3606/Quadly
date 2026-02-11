import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useCommunityStore } from '../../src/store/communityStore';
import { PostList } from '../../src/components/community';
import { colors, spacing, fontSize } from '../../src/constants';

const TAB_BAR_HEIGHT = 85;
const POST_BUTTON_ROW_HEIGHT = 60;

export default function BoardDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    boards,
    selectedBoardId,
    setSelectedBoard,
    initialize,
    isInitialized,
  } = useCommunityStore();

  const board = boards.find((b) => b.id === id);
  const schoolName = (user?.user_metadata?.school as string) || 'Your University';

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (id && id !== selectedBoardId) {
      setSelectedBoard(id);
    }
  }, [id]);

  const handleCreatePost = () => {
    if (id) {
      router.push({
        pathname: '/create-post',
        params: { boardId: id },
      });
    }
  };

  if (!board) {
    return (
      <LinearGradient
        colors={['#ffffff', '#f6f6f6']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <View style={styles.headerSide}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Image source={require('../../assets/back_icon.png')} style={styles.backIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{board.name}</Text>
            <Text style={styles.schoolName} numberOfLines={1}>{schoolName}</Text>
          </View>
          <View style={styles.headerSide}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => router.push('/community-search')}
              activeOpacity={0.7}
            >
              <Image source={require('../../assets/search_icon.png')} style={styles.searchIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: POST_BUTTON_ROW_HEIGHT + insets.bottom + 20 + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <PostList />
        </ScrollView>

        <View
          style={[
            styles.postButtonRow,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePost}
          >
            <Text style={styles.createButtonText}>+ Post</Text>
          </TouchableOpacity>
        </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
  },
  headerSide: {
    width: 44,
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.primary,
  },
  schoolName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary ?? colors.text,
    marginTop: 1,
  },
  searchButton: {
    alignSelf: 'flex-end',
    padding: spacing.sm,
  },
  searchIcon: {
    width: 24,
    height: 24,
  },
  postButtonRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
