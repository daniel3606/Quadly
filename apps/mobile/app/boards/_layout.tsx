import { Stack } from 'expo-router';

export default function BoardsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[boardKey]/index" />
      <Stack.Screen name="[boardKey]/new" />
      <Stack.Screen name="[boardKey]/posts/[postId]/index" />
    </Stack>
  );
}
