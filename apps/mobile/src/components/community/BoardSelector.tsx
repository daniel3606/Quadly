import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useCommunityStore, BoardWithLatestPost } from '../../store/communityStore';
import { colors, spacing, fontSize } from '../../constants';

interface BoardSelectorProps {
  onBoardSelect?: (board: BoardWithLatestPost) => void;
  /** When provided, boards are filtered by this query (from header search). */
  searchQuery?: string;
}

function getBoardType(board: BoardWithLatestPost): string {
  return board.category?.trim() || board.key || 'Other';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function BoardSelector({ onBoardSelect, searchQuery = '' }: BoardSelectorProps) {
  const router = useRouter();
  const { boardsWithLatestPost, savedBoardIds, toggleSaveBoard } = useCommunityStore();

  const handleStarPress = async (boardId: string) => {
    try {
      await toggleSaveBoard(boardId);
      await useCommunityStore.getState().fetchSavedBoards();
    } catch (error) {
      console.error('Failed to toggle board save:', error);
    }
  };

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boardsWithLatestPost;
    const query = searchQuery.toLowerCase();
    return boardsWithLatestPost.filter(
      (board) =>
        board.name.toLowerCase().includes(query) ||
        board.description?.toLowerCase().includes(query) ||
        board.category?.toLowerCase().includes(query)
    );
  }, [boardsWithLatestPost, searchQuery]);

  const boardsByType = useMemo(() => {
    const map = new Map<string, BoardWithLatestPost[]>();
    for (const board of filteredBoards) {
      const type = getBoardType(board);
      const list = map.get(type) ?? [];
      list.push(board);
      map.set(type, list);
    }
    // Sort types for consistent order; put common ones first
    const order = ['general', 'private', 'info'];
    return Array.from(map.entries()).sort(([a], [b]) => {
      const ia = order.indexOf(a.toLowerCase());
      const ib = order.indexOf(b.toLowerCase());
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [filteredBoards]);

  const handleBoardPress = (board: BoardWithLatestPost) => {
    useCommunityStore.getState().setSelectedBoard(board.id);
    onBoardSelect?.(board);
    router.push({ pathname: '/board/[id]', params: { id: board.id } });
  };

  return (
    <View style={styles.container}>
      {filteredBoards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No boards found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search</Text>
        </View>
      ) : (
        <View style={styles.boardsList}>
          {boardsByType.map(([type, boards]) => (
            <View key={type} style={styles.section}>
              <Text style={styles.sectionTitle}>{capitalize(type)}</Text>
              {boards.map((board, idx) => (
                <React.Fragment key={board.id}>
                  {idx > 0 && <View style={styles.divider} />}
                  <View style={styles.boardRow}>
                    <TouchableOpacity
                      style={styles.boardRowContent}
                      onPress={() => handleBoardPress(board)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.boardTitle} numberOfLines={1}>
                        {board.name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      onPress={() => handleStarPress(board.id)}
                      style={styles.starButton}
                    >
                      <Image
                        source={
                          savedBoardIds.has(board.id)
                            ? require('../../../assets/star_icon_selected.png')
                            : require('../../../assets/star_icon_unselected.png')
                        }
                        style={styles.starIcon}
                      />
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  boardsList: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 8,
    gap: spacing.lg,
  },
  section: {
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.textSecondary ?? '#ddd',
    marginLeft: 0,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary ?? colors.text,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  boardRowContent: {
    flex: 1,
    minWidth: 0,
  },
  boardTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  starButton: {
    padding: 4,
    marginLeft: 8,
  },
  starIcon: {
    width: 16,
    height: 16,
  },
  emptyContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.md,
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
