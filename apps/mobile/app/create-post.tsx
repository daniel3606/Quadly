import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCommunityStore } from '../src/store/communityStore';
import { useAuthStore } from '../src/store/authStore';
import { colors, spacing, borderRadius, fontSize } from '../src/constants';

export default function CreatePostScreen() {
  const router = useRouter();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { createPost, boards } = useCommunityStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBoard = boards.find((b) => b.id === boardId);

  useEffect(() => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to create a post');
      router.back();
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Error', 'Please enter post content');
      return;
    }

    if (!boardId) {
      Alert.alert('Error', 'No board selected');
      return;
    }

    setIsSubmitting(true);

    const { error } = await createPost(boardId, title.trim(), body.trim(), isAnonymous);

    setIsSubmitting(false);

    if (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } else {
      Alert.alert('Success', 'Post created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#f6f6f6']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {selectedBoard && (
            <View style={styles.boardInfo}>
              <Text style={styles.boardLabel}>Board:</Text>
              <Text style={styles.boardName}>{selectedBoard.name}</Text>
            </View>
          )}

          <View style={styles.anonymousToggle}>
            <Text style={styles.anonymousLabel}>Post anonymously</Text>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Post title..."
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            multiline
          />

          <TextInput
            style={styles.bodyInput}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textSecondary}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={10000}
            textAlignVertical="top"
          />

          <View style={styles.charCount}>
            <Text style={styles.charCountText}>
              {body.length} / 10000 characters
            </Text>
          </View>
        </ScrollView>

        <View style={{ height: 85 }} />
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.textLight,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  boardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  boardLabel: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    marginRight: spacing.xs,
  },
  boardName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  anonymousToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  anonymousLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  titleInput: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 60,
  },
  bodyInput: {
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 200,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
  },
  charCountText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
