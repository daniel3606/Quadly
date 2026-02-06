import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCommunityStore, BoardWithLatestPost } from '../../store/communityStore';
import { colors, spacing, borderRadius, fontSize, cardShadow } from '../../constants';

interface BoardSelectorProps {
  onBoardSelect?: (board: Board) => void;
}

export function BoardSelector({ onBoardSelect }: BoardSelectorProps) {
  const router = useRouter();
  const { boardsWithLatestPost, savedBoardIds, toggleSaveBoard } = useCommunityStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) {
      return boardsWithLatestPost;
    }
    const query = searchQuery.toLowerCase();
    return boardsWithLatestPost.filter(
      (board) =>
        board.name.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query) ||
        board.category?.toLowerCase().includes(query)
    );
  }, [boardsWithLatestPost, searchQuery]);

  const handleBoardPress = (board: BoardWithLatestPost) => {
    useCommunityStore.getState().setSelectedBoard(board.id);
    onBoardSelect?.(board);
    router.push({
      pathname: '/board/[id]',
      params: { id: board.id },
    });
  };

  const handleStarPress = async (boardId: string) => {
    try {
      await toggleSaveBoard(boardId);
      // Force a refresh of saved boards to ensure UI is in sync
      await useCommunityStore.getState().fetchSavedBoards();
    } catch (error) {
      console.error('Failed to toggle board save:', error);
    }
  };

  const renderBoard = (board: BoardWithLatestPost, index: number) => {
    const isSaved = savedBoardIds.has(board.id);

    return (
      <TouchableOpacity
        key={board.id}
        style={[
          styles.boardCard,
          index % 2 === 0 ? styles.boardCardLeft : styles.boardCardRight,
        ]}
        onPress={() => handleBoardPress(board)}
        activeOpacity={0.7}
      >
        <View style={styles.boardHeader}>
          <View style={styles.boardTitleContainer}>
            <Text style={styles.boardName} numberOfLines={2}>
              {board.name}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.starButton}
            onPress={() => handleStarPress(board.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={
                isSaved
                  ? require('../../../assets/star_icon_selected.png')
                  : require('../../../assets/star_icon_unselected.png')
              }
              style={styles.starIcon}
            />
          </TouchableOpacity>
        </View>

        {board.latestPost ? (
          <View style={styles.latestPostContainer}>
            {!board.latestPost.isRead && (
              <View style={styles.unreadDot} />
            )}
            <Text style={styles.latestPostTitle} numberOfLines={1}>
              {board.latestPost.title}
            </Text>
          </View>
        ) : board.description ? (
          <Text style={styles.boardDescription} numberOfLines={2}>
            {board.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search boards..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {filteredBoards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No boards found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search
          </Text>
        </View>
      ) : (
        <View style={styles.boardsGrid}>
          {filteredBoards.map((board, index) => renderBoard(board, index))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  boardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  boardCard: {
    width: '48%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 100,
    ...cardShadow,
  },
  boardCardLeft: {
    marginRight: '2%',
  },
  boardCardRight: {
    marginLeft: '2%',
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  boardTitleContainer: {
    flex: 1,
    marginRight: spacing.xs,
  },
  boardName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  starButton: {
    padding: spacing.xs,
  },
  starIcon: {
    width: 18,
    height: 18,
  },
  boardDescription: {
    fontSize: fontSize.xs,
    color: colors.textLight,
    lineHeight: 16,
  },
  latestPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: spacing.xs,
  },
  latestPostTitle: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textLight,
    lineHeight: 16,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
});
