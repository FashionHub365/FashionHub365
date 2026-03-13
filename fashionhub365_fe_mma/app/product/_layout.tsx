import { Stack } from 'expo-router';

export default function ProductLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Product Details' }} />
    </Stack>
  );
}
