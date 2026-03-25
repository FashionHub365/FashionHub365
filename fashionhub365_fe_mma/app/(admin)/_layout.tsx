import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1a73e8' }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Người dùng',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Cửa hàng',
          tabBarIcon: ({ color }) => <Ionicons name="storefront" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={24} color={color} />
        }}
      />
      {/* Hidden auxiliary screens - Hide them explicitly to prevent auto-tab generation */}
      <Tabs.Screen name="audit-logs" options={{ href: null }} />
      <Tabs.Screen name="categories" options={{ href: null }} />
      <Tabs.Screen name="products" options={{ href: null }} />
      <Tabs.Screen name="brands" options={{ href: null }} />
      <Tabs.Screen name="tags" options={{ href: null }} />
    </Tabs>
  );
}
