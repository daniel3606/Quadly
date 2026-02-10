import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_KEYS = {
  pushEnabled: 'quadly_notif_push_enabled',
  messages: 'quadly_notif_messages',
  community: 'quadly_notif_community',
  marketplace: 'quadly_notif_marketplace',
  schedule: 'quadly_notif_schedule',
} as const;

type NotificationKey = keyof typeof NOTIFICATION_KEYS;

const DEFAULT_PREFS: Record<NotificationKey, boolean> = {
  pushEnabled: true,
  messages: true,
  community: true,
  marketplace: true,
  schedule: true,
};

interface NotificationOption {
  key: NotificationKey;
  label: string;
  description: string;
  requiresPush?: boolean;
}

const OPTIONS: NotificationOption[] = [
  {
    key: 'pushEnabled',
    label: 'Push Notifications',
    description: 'Enable or disable all push notifications',
  },
  {
    key: 'messages',
    label: 'Messages',
    description: 'New messages in marketplace conversations',
    requiresPush: true,
  },
  {
    key: 'community',
    label: 'Community',
    description: 'Likes, comments, and replies on your posts',
    requiresPush: true,
  },
  {
    key: 'marketplace',
    label: 'Marketplace',
    description: 'Interest in your listings and new messages',
    requiresPush: true,
  },
  {
    key: 'schedule',
    label: 'Schedule',
    description: 'Class reminders and schedule updates',
    requiresPush: true,
  },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<NotificationKey, boolean>>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  useEffect(() => {
    if (!loading) {
      savePrefs();
    }
  }, [prefs, loading]);

  const loadPrefs = async () => {
    try {
      const loaded: Partial<Record<NotificationKey, boolean>> = {};
      for (const key of Object.keys(NOTIFICATION_KEYS) as NotificationKey[]) {
        const stored = await AsyncStorage.getItem(NOTIFICATION_KEYS[key]);
        if (stored !== null) {
          loaded[key] = stored === 'true';
        }
      }
      setPrefs((prev) => ({ ...prev, ...loaded }));
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const savePrefs = async () => {
    try {
      for (const [key, value] of Object.entries(prefs)) {
        await AsyncStorage.setItem(
          NOTIFICATION_KEYS[key as NotificationKey],
          String(value)
        );
      }
    } catch {
      // Ignore save errors
    }
  };

  const setPref = (key: NotificationKey, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'pushEnabled' && !value) {
        next.messages = false;
        next.community = false;
        next.marketplace = false;
        next.schedule = false;
      }
      return next;
    });
  };

  const isOptionDisabled = (opt: NotificationOption) =>
    opt.requiresPush && !prefs.pushEnabled;

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
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.intro}>
            Choose which notifications you want to receive.
          </Text>

          <View style={styles.optionsCard}>
            {OPTIONS.map((opt, idx) => {
              const disabled = isOptionDisabled(opt);
              return (
                <View
                  key={opt.key}
                  style={[
                    styles.optionRow,
                    idx < OPTIONS.length - 1 && styles.optionRowBorder,
                  ]}
                >
                  <View style={[styles.optionContent, disabled && styles.optionDisabled]}>
                    <Text style={[styles.optionLabel, disabled && styles.optionLabelDisabled]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionDesc, disabled && styles.optionDescDisabled]}>
                      {opt.description}
                    </Text>
                  </View>
                  <Switch
                    value={prefs[opt.key]}
                    onValueChange={(v) => setPref(opt.key, v)}
                    disabled={disabled}
                    trackColor={{ false: '#e0e0e0', true: '#00274C' }}
                    thumbColor="#ffffff"
                  />
                </View>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    color: '#000000',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  intro: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionContent: {
    flex: 1,
    marginRight: 16,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  optionLabelDisabled: {
    color: '#999',
  },
  optionDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  optionDescDisabled: {
    color: '#999',
  },
});
