import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMarketplaceStore } from '../../src/store/marketplaceStore';
import { useAuthStore } from '../../src/store/authStore';
import { Message } from '../../src/types/marketplace';

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const router = useRouter();
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const {
    messages,
    conversations,
    fetchMessages,
    sendMessage,
    markMessagesRead,
    subscribeToMessages,
    isLoadingMessages,
  } = useMarketplaceStore();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const conversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    if (!conversationId) return;

    fetchMessages(conversationId);
    markMessagesRead(conversationId);

    const unsubscribe = subscribeToMessages(conversationId);
    return () => {
      unsubscribe();
    };
  }, [conversationId]);

  // Mark messages read when new ones arrive
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markMessagesRead(conversationId);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !conversationId) return;

    setInputText('');
    await sendMessage(conversationId, text);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageBubbleWrapper,
          isOwn ? styles.ownWrapper : styles.otherWrapper,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.content}
          </Text>
        </View>
        <Text
          style={[
            styles.messageTime,
            isOwn ? styles.ownTime : styles.otherTime,
          ]}
        >
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {conversation ? 'Anonymous' : 'Chat'}
          </Text>
          {conversation?.listing_title && (
            <Text style={styles.headerListing} numberOfLines={1}>
              {conversation.listing_title}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoadingMessages ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Send a message to start the conversation
                </Text>
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#00274C',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerListing: {
    fontSize: 12,
    color: '#666666',
    marginTop: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubbleWrapper: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  ownWrapper: {
    alignSelf: 'flex-end',
  },
  otherWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#00274C',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#e8e8e8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },
  ownTime: {
    textAlign: 'right',
  },
  otherTime: {
    textAlign: 'left',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    transform: [{ scaleY: -1 }],
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#00274C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
