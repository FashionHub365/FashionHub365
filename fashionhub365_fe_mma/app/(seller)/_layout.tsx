import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SellerLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#111' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color }) => <Ionicons name="cube" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Sản phẩm',
          tabBarIcon: ({ color }) => <Ionicons name="pricetags" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Kho hàng',
          tabBarIcon: ({ color }) => <Ionicons name="server" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="product-form" options={{ href: null }} />
      <Tabs.Screen name="vouchers" options={{ href: null }} />
      <Tabs.Screen name="voucher-form" options={{ href: null }} />
      <Tabs.Screen name="chat/index" options={{ href: null }} />
      <Tabs.Screen name="chat/[sessionId]" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
    </Tabs>
  );
}
