import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ title: 'Manage Categories' }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="stores" options={{ headerShown: false }} />
    </Stack>
  );
}
