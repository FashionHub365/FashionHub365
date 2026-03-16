import { Stack } from 'expo-router';

export default function CheckoutLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Checkout' }} />
    </Stack>
  );
}
