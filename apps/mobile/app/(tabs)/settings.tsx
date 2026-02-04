import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

const SCHOOL_NAMES: { [key: string]: string } = {
  UMICH: 'University of Michigan',
  MSU: 'Michigan State University',
  OSU: 'Ohio State University',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const userInitial = user?.nickname?.charAt(0).toUpperCase() || 'U';
  const schoolName = user?.school ? SCHOOL_NAMES[user.school] || user.school : '';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Edit Profile', onPress: () => {} },
        { icon: '🔐', label: 'Change Password', onPress: () => {} },
        { icon: '🔔', label: 'Notifications', onPress: () => {} },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: '🎨', label: 'Appearance', onPress: () => {} },
        { icon: '🌐', label: 'Language', onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help Center', onPress: () => {} },
        { icon: '📝', label: 'Feedback', onPress: () => {} },
        { icon: '📄', label: 'Terms of Service', onPress: () => {} },
        { icon: '🔒', label: 'Privacy Policy', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            {user?.profile_image_url ? (
              <Image
                source={{ uri: user.profile_image_url }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <Text style={styles.profileAvatarText}>{userInitial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.nickname || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>

          <View style={styles.profileBadges}>
            {schoolName && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{schoolName}</Text>
              </View>
            )}
            {user?.major && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user.major}</Text>
              </View>
            )}
            {user?.graduation_year && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Class of {user.graduation_year}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <View key={groupIndex} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupContent}>
              {group.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingsItem,
                    itemIndex < group.items.length - 1 && styles.settingsItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <Text style={styles.settingsIcon}>{item.icon}</Text>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  <Text style={styles.settingsArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Quadly v0.1.0</Text>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00274C',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00274C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  profileBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    color: '#00274C',
    fontWeight: '500',
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  settingsArrow: {
    fontSize: 20,
    color: '#c0c0c0',
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  versionText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 24,
  },
});
