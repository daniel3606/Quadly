import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, shadowStyle, borderRadius, fontSize, spacing } from '../../constants';

interface LatestPost {
  id: string;
  title: string;
  created_at: string;
  is_new: boolean;
}

interface PinnedBoard {
  id: string;
  board: {
    id: string;
    key: string;
    name: string;
  };
  latest_post: LatestPost | null;
}

interface PinnedBoardsProps {
  boards: PinnedBoard[];
  onViewAll: () => void;
}

export function PinnedBoards({ boards, onViewAll }: PinnedBoardsProps) {
  const router = useRouter();

  const handleBoardPress = (boardKey: string) => {
    // Navigate to board
    router.push(`/(tabs)/community?board=${boardKey}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pinned Boards</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.boardsList}>
        {boards.length === 0 ? (
          <Text style={styles.emptyText}>No pinned boards yet</Text>
        ) : (
          boards.map((pinnedBoard) => (
            <TouchableOpacity
              key={pinnedBoard.id}
              style={styles.boardItem}
              onPress={() => handleBoardPress(pinnedBoard.board.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.boardName}>{pinnedBoard.board.name}</Text>
              <View style={styles.boardRight}>
                {pinnedBoard.latest_post ? (
                  <>
                    <Text style={styles.latestPost} numberOfLines={1}>
                      {pinnedBoard.latest_post.title}
                    </Text>
                    {pinnedBoard.latest_post.is_new && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>New!</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.noPostsText}>No posts yet</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    ...shadowStyle,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  viewAll: {
    fontSize: fontSize.md,
    color: colors.link,
    fontWeight: '500',
  },
  boardsList: {
    gap: spacing.sm,
  },
  boardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  boardName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    width: 100,
  },
  boardRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  latestPost: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  noPostsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  newBadge: {
    backgroundColor: colors.newBadge,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: fontSize.xs,
    color: colors.background,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
