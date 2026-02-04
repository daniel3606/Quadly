import React, { useEffect, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../src/store/authStore';
import { apiClient } from '../../../src/lib/api';

interface Board {
  id: string;
  key: string;
  name: string;
  visibility: string;
  anon_mode: string;
}

export default function NewPostScreen() {
  const router = useRouter();
  const { boardKey } = useLocalSearchParams<{ boardKey: string }>();
  const { token } = useAuthStore();

  const [board, setBoard] = useState<Board | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [boardLoading, setBoardLoading] = useState(true);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const boardResponse = await apiClient.get<Board>(`/boards/${boardKey}`);
        setBoard(boardResponse);

        // Set anonymous based on board's anon_mode
        if (boardResponse.anon_mode === 'forced') {
          setIsAnonymous(true);
        }
      } catch (error) {
        console.error('Failed to fetch board:', error);
      } finally {
        setBoardLoading(false);
      }
    };

    fetchBoard();
  }, [boardKey]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your post.');
      return;
    }

    if (!body.trim()) {
      Alert.alert('Missing Content', 'Please enter content for your post.');
      return;
    }

    if (!token) {
      Alert.alert('Login Required', 'Please login to create a post.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<{ id: string }>(`/boards/${boardKey}/posts`, {
        title: title.trim(),
        body: body.trim(),
        is_anonymous: isAnonymous,
      });

      Alert.alert('Success', 'Your post has been created!', [
        {
          text: 'OK',
          onPress: () => router.replace(`/boards/${boardKey}/posts/${response.id}`),
        },
      ]);
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canToggleAnonymous = board?.anon_mode === 'optional';
  const isForceAnonymous = board?.anon_mode === 'forced';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postButton, (!title.trim() || !body.trim() || isLoading) && styles.postButtonDisabled]}
          onPress={handleSubmit}
          disabled={!title.trim() || !body.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Board Info */}
          <View style={styles.boardInfo}>
            <Text style={styles.boardLabel}>Posting to</Text>
            <Text style={styles.boardName}>{board?.name || 'Board'}</Text>
          </View>

          {/* Anonymous Toggle */}
          {!boardLoading && (
            <View style={styles.anonymousSection}>
              {isForceAnonymous ? (
                <View style={styles.anonymousNotice}>
                  <Text style={styles.anonymousNoticeIcon}>🔒</Text>
                  <Text style={styles.anonymousNoticeText}>
                    This board requires anonymous posting
                  </Text>
                </View>
              ) : canToggleAnonymous ? (
                <View style={styles.anonymousToggle}>
                  <View style={styles.anonymousToggleLeft}>
                    <Text style={styles.anonymousLabel}>Post Anonymously</Text>
                    <Text style={styles.anonymousHint}>
                      Your identity will be hidden
                    </Text>
                  </View>
                  <Switch
                    value={isAnonymous}
                    onValueChange={setIsAnonymous}
                    trackColor={{ false: '#e0e0e0', true: '#00274C' }}
                    thumbColor="#ffffff"
                  />
                </View>
              ) : null}
            </View>
          )}

          {/* Title Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor="#999999"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
            <Text style={styles.charCount}>{title.length}/200</Text>
          </View>

          {/* Body Input */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.bodyInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#999999"
              value={body}
              onChangeText={setBody}
              multiline
              maxLength={10000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{body.length}/10000</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#666666',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postButton: {
    backgroundColor: '#00274C',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  boardInfo: {
    backgroundColor: '#f5f7fa',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  boardLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00274C',
  },
  anonymousSection: {
    marginBottom: 20,
  },
  anonymousNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 10,
  },
  anonymousNoticeIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  anonymousNoticeText: {
    fontSize: 14,
    color: '#856404',
    flex: 1,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f7fa',
    padding: 14,
    borderRadius: 10,
  },
  anonymousToggleLeft: {
    flex: 1,
  },
  anonymousLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  anonymousHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  inputSection: {
    marginBottom: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 0,
    marginBottom: 8,
  },
  bodyInput: {
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
    minHeight: 200,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    color: '#cccccc',
    textAlign: 'right',
    marginTop: 8,
  },
});
