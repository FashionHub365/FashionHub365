import { Stack } from 'expo-router';

export default function SellerLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="products" options={{ headerShown: false }} />
      <Stack.Screen name="product-form" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
    </Stack>
  );
}
