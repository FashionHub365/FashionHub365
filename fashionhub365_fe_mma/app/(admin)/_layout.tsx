import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="categories" options={{ headerShown: false }} />
    </Stack>
  );
}
