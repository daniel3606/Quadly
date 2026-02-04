import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, tabBarShadow, borderRadius, fontSize, spacing } from '../../constants';

// Import icons
const icons = {
  index: require('../../../assets/home_icon.png'),
  schedule: require('../../../assets/schedule_icon.png'),
  community: require('../../../assets/discussion_icon.png'),
  classes: require('../../../assets/classes_icon.png'),
  settings: require('../../../assets/settings_icon.png'),
};

const TAB_LABELS: { [key: string]: string } = {
  index: 'Home',
  schedule: 'Schedule',
  community: 'Community',
  classes: 'Classes',
  settings: 'Settings',
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = icons[route.name as keyof typeof icons];
          const label = TAB_LABELS[route.name] || route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {icon ? (
                <Image
                  source={icon}
                  style={[styles.icon, { opacity: isFocused ? 1 : 0.3 }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.iconPlaceholder} />
              )}
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? colors.tabBarActive : colors.tabBarInactive },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...tabBarShadow,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    marginBottom: 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
