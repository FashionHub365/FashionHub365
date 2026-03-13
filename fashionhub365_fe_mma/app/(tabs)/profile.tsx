import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthContent}>
          <IconSymbol name="person.crop.circle" size={80} color="#ccc" />
          <Text style={styles.unauthTitle}>Profile</Text>
          <Text style={styles.unauthSubtitle}>Please login or register to view your profile and manage orders.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.primaryBtnText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.secondaryBtnText}>Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback for user avatar
  const avatarUrl = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Profile Info */}
        <View style={styles.header}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.userName}>{user?.username || 'User Name'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Sections (Admin/Seller) */}
        {(user?.role === 'admin' || user?.role === 'seller') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Management</Text>
            <View style={styles.cardGroup}>
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.cardItem} onPress={() => router.push('/(admin)/categories')}>
                  <View style={[styles.iconBox, { backgroundColor: '#e2f0fb' }]}>
                    <IconSymbol name="chart.bar" size={20} color="#007AFF" />
                  </View>
                  <Text style={styles.cardItemText}>Admin Dashboard</Text>
                  <IconSymbol name="chevron.right" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
              
              {(user?.role === 'seller' || user?.role === 'admin') && (
                <TouchableOpacity style={[styles.cardItem, user?.role === 'admin' && styles.cardItemBorder]} onPress={() => router.push('/(seller)/dashboard')}>
                  <View style={[styles.iconBox, { backgroundColor: '#fdf3e1' }]}>
                    <IconSymbol name="bag" size={20} color="#d35400" />
                  </View>
                  <Text style={styles.cardItemText}>Seller Dashboard</Text>
                  <IconSymbol name="chevron.right" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.cardItem}>
              <View style={[styles.iconBox, { backgroundColor: '#f0f0f0' }]}>
                <IconSymbol name="person" size={20} color="#555" />
              </View>
              <Text style={styles.cardItemText}>Personal Information</Text>
              <IconSymbol name="chevron.right" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cardItem, styles.cardItemBorder]} onPress={() => router.push('/(tabs)/cart')}>
              <View style={[styles.iconBox, { backgroundColor: '#f0f0f0' }]}>
                <IconSymbol name="cart" size={20} color="#555" />
              </View>
              <Text style={styles.cardItemText}>My Cart</Text>
              <IconSymbol name="chevron.right" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cardItem, styles.cardItemBorder]}>
              <View style={[styles.iconBox, { backgroundColor: '#f0f0f0' }]}>
                <IconSymbol name="bell" size={20} color="#555" />
              </View>
              <Text style={styles.cardItemText}>Notifications</Text>
              <IconSymbol name="chevron.right" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Logout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.cardItem}>
              <View style={[styles.iconBox, { backgroundColor: '#f0f0f0' }]}>
                <IconSymbol name="questionmark.circle" size={20} color="#555" />
              </View>
              <Text style={styles.cardItemText}>Help Center</Text>
              <IconSymbol name="chevron.right" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cardItem, styles.cardItemBorder, { marginTop: 10 }]} onPress={handleLogout}>
              <View style={[styles.iconBox, { backgroundColor: '#fbe2e2' }]}>
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#e74c3c" />
              </View>
              <Text style={[styles.cardItemText, { color: '#e74c3c', fontWeight: 'bold' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>FashionHub365 App v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  unauthContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  unauthTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  unauthSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  primaryBtn: {
    backgroundColor: '#000',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryBtnText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 25,
    paddingTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e0e0e0',
  },
  headerInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#555',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  cardItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#aaa',
    fontSize: 13,
  }
});
