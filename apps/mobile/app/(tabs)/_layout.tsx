import { Tabs } from 'expo-router';
import { View, Image, StyleSheet } from 'react-native';

// Import icons
const icons = {
  home: require('../../assets/home_icon.png'),
  schedule: require('../../assets/schedule_icon.png'),
  community: require('../../assets/discussion_icon.png'),
  classes: require('../../assets/classes_icon.png'),
  settings: require('../../assets/settings_icon.png'),
};

function TabIcon({ icon, focused }: { icon: any; focused: boolean }) {
  return (
    <Image
      source={icon}
      style={[
        styles.tabIcon,
        { opacity: focused ? 1 : 0.3 }
      ]}
      resizeMode="contain"
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#00274C',
        tabBarInactiveTintColor: '#999999',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.schedule} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.community} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.classes} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon={icons.settings} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabIcon: {
    width: 24,
    height: 24,
  },
});
