import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const userEmail = user?.email ?? 'user@example.com';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const avatarUrl = (user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture) as string | undefined;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { iconSource: require('../assets/profile_setting_icon.png'), label: 'Edit Profile', onPress: () => router.push('/edit-profile') },
        { iconSource: require('../assets/notification_icon.png'), label: 'Notifications', onPress: () => router.push('/notification-settings') },
      ],
    },
    {
      title: 'Support',
      items: [
        { iconSource: require('../assets/feedback_icon.png'), label: 'Feedback', onPress: () => openUrl('https://forms.gle/133T7X4YE3mHC63G8') },
        { iconSource: require('../assets/terms_of_service_icon.png'), label: 'Terms of Service', onPress: () => openUrl('https://quadly.org/terms') },
        { iconSource: require('../assets/privacy_icon.png'), label: 'Privacy Policy', onPress: () => openUrl('https://quadly.org/privacy') },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={['#ffffff', '#f6f6f6']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>{userInitial}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{userEmail}</Text>
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
                    <Image source={item.iconSource} style={styles.settingsIconImage} resizeMode="contain" />
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
    backgroundColor: 'transparent',
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: '#1a1a1a',
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
  settingsIconImage: {
    width: 24,
    height: 24,
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
