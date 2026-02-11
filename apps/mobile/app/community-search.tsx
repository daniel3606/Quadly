import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCommunityStore } from '../src/store/communityStore';
import { BoardSelector } from '../src/components/community';
import { colors, spacing, fontSize, borderRadius } from '../src/constants';

const RECENT_SEARCHES_KEY = 'quadly_community_recent_searches';
const MAX_RECENT = 10;

async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

async function saveRecentSearch(query: string): Promise<void> {
  if (!query.trim()) return;
  const recent = await loadRecentSearches();
  const next = [query.trim(), ...recent.filter((q) => q !== query.trim())].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export default function CommunitySearchScreen() {
  const router = useRouter();
  const { initialize, isInitialized } = useCommunityStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  const refreshRecent = useCallback(async () => {
    const list = await loadRecentSearches();
    setRecentSearches(list);
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized]);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  useEffect(() => {
    const t = setTimeout(() => searchInputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const handleSubmitSearch = useCallback(() => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      refreshRecent();
    }
  }, [searchQuery, refreshRecent]);

  const handleRecentPress = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const showRecent = searchQuery.length === 0;

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Image source={require('../assets/back_icon.png')} style={styles.backIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search boards..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSubmitSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        {showRecent ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent searches</Text>
              {recentSearches.length === 0 ? (
                <Text style={styles.recentEmpty}>No recent searches</Text>
              ) : (
                recentSearches.map((query) => (
                  <TouchableOpacity
                    key={query}
                    style={styles.recentItem}
                    onPress={() => handleRecentPress(query)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.recentItemText} numberOfLines={1}>{query}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <BoardSelector searchQuery={searchQuery} />
          </ScrollView>
        )}
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  recentSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  recentTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  recentEmpty: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
  recentItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
