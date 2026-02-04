import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  // This is just a loading screen while auth state is determined
  // Navigation is handled in _layout.tsx
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00274C" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
