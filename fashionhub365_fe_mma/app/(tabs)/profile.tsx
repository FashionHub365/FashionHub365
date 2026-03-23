import React from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Image, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserRoleSlugs } from '../../utils/roleUtils';

const { width } = Dimensions.get('window');

// --- Menu Row Item ---
function MenuItem({ icon, iconBg, iconColor, label, onPress, badge }: any) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, { backgroundColor: iconBg || '#f5f5f5' }]}>
        <Ionicons name={icon} size={20} color={iconColor || '#555'} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
}

// --- Order Status Button ---
function OrderStatusBtn({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.orderBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderIconWrapper}>
        <Ionicons name={icon} size={26} color="#111111" />
      </View>
      <Text style={styles.orderBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // ── NOT LOGGED IN ──
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" />
        <LinearGradient colors={['#111111', '#333333']} style={styles.unauthHeader}>
          <Text style={styles.unauthHeaderTitle}>Tài Khoản</Text>
        </LinearGradient>

        <View style={styles.unauthBody}>
          <View style={styles.unauthAvatarWrapper}>
            <View style={styles.unauthAvatar}>
              <Ionicons name="person" size={50} color="#bbb" />
            </View>
          </View>
          <Text style={styles.unauthTitle}>Chào mừng đến với FashionHub</Text>
          <Text style={styles.unauthSub}>Đăng nhập để nhận ưu đãi độc quyền và theo dõi đơn hàng của bạn</Text>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerBtnText}>ĐĂNG KÝ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = user?.avatar;
  const displayName = user?.profile?.full_name || user?.username || 'Người dùng';
  const userEmail = user?.email || '';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111111" />
      <ScrollView showsVerticalScrollIndicator={false} bounces>

        {/* ── GRADIENT HEADER ── */}
        <LinearGradient colors={['#111111', '#333333']} style={styles.header}>
          {/* Top Row: Title + Settings */}
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Tài Khoản</Text>
            <TouchableOpacity>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Avatar + Name */}
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBtn}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </View>

            <View style={styles.profileNameArea}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              {getUserRoleSlugs(user).filter(r => r !== 'user').map(role => (
                <View key={role} style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{role.toUpperCase()}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.editProfileBtn}>
              <Ionicons name="pencil-outline" size={18} color="#fff" />
              <Text style={styles.editProfileText}>Sửa</Text>
            </TouchableOpacity>
          </View>

          {/* Wallet / Voucher / Coins row */}
          <View style={styles.walletRow}>
            <TouchableOpacity style={styles.walletItem}>
              <Ionicons name="wallet-outline" size={20} color="#fff" />
              <Text style={styles.walletLabel}>Ví của tôi</Text>
            </TouchableOpacity>
            <View style={styles.walletDivider} />
            <TouchableOpacity style={styles.walletItem} onPress={() => router.push('/profile/vouchers' as any)}>
              <Ionicons name="pricetag-outline" size={20} color="#fff" />
              <Text style={styles.walletLabel}>Voucher</Text>
            </TouchableOpacity>
            <View style={styles.walletDivider} />
            <TouchableOpacity style={styles.walletItem}>
              <Ionicons name="star-outline" size={20} color="#fff" />
              <Text style={styles.walletLabel}>Xu của tôi</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── ORDER STATUS CARD ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Đơn Hàng Của Tôi</Text>
            <TouchableOpacity onPress={() => router.push('/orders' as any)}>
              <Text style={styles.cardSeeAll}>Xem lịch sử mua hàng {'>'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.orderRow}>
            <OrderStatusBtn icon="card-outline" label="Chờ thanh toán" onPress={() => router.push('/orders' as any)} />
            <OrderStatusBtn icon="cube-outline" label="Chờ lấy hàng" onPress={() => router.push('/orders' as any)} />
            <OrderStatusBtn icon="bicycle-outline" label="Chờ giao hàng" onPress={() => router.push('/orders' as any)} />
            <OrderStatusBtn icon="checkmark-circle-outline" label="Đã giao" onPress={() => router.push('/orders' as any)} />
            <OrderStatusBtn icon="refresh-circle-outline" label="Trả hàng" onPress={() => router.push('/orders' as any)} />
          </View>
        </View>

        {/* ── ADMIN / SELLER SHORTCUTS ── */}
        {(() => {
          const roles = getUserRoleSlugs(user);
          const isAdmin = roles.includes('admin');
          const isSeller = roles.includes('seller');

          if (!isAdmin && !isSeller) return null;

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quản Lý</Text>
              {isAdmin && (
                <MenuItem
                  icon="shield-checkmark-outline"
                  iconBg="#e5f0ff"
                  iconColor="#1a73e8"
                  label="Admin Dashboard"
                  onPress={() => router.push('/(admin)/dashboard')}
                />
              )}
              {isSeller && (
                <MenuItem
                  icon="storefront-outline"
                  iconBg="#f5f5f5"
                  iconColor="#111"
                  label="Seller Dashboard"
                  onPress={() => router.push('/(seller)/dashboard')}
                />
              )}
            </View>
          );
        })()}

        {/* ── MY ACCOUNT ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tài Khoản Của Tôi</Text>
          <MenuItem icon="person-outline" iconBg="#f5f5f5" iconColor="#111" label="Thông tin cá nhân" onPress={() => router.push('/profile/edit' as any)} />
          <MenuItem icon="location-outline" iconBg="#f5f5f5" iconColor="#111" label="Địa chỉ của tôi" onPress={() => router.push('/profile/addresses' as any)} />
          <MenuItem icon="lock-closed-outline" iconBg="#f5f5f5" iconColor="#111" label="Đổi mật khẩu" onPress={() => router.push('/profile/password' as any)} />
        </View>

        {/* ── SERVICES ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tiện Ích</Text>
          <MenuItem icon="bag-handle-outline" iconBg="#f5f5f5" iconColor="#111" label="Giỏ hàng" onPress={() => router.push('/(tabs)/cart')} />
          <MenuItem icon="heart-outline" iconBg="#f5f5f5" iconColor="#111" label="Sản phẩm yêu thích" onPress={() => router.push('/wishlist' as any)} />
          <MenuItem icon="chatbubble-outline" iconBg="#f5f5f5" iconColor="#111" label="Chat với người bán" onPress={() => { }} />
          <MenuItem icon="notifications-outline" iconBg="#f5f5f5" iconColor="#111" label="Thông báo" onPress={() => { }} badge="3" />
        </View>

        {/* ── SUPPORT ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hỗ Trợ</Text>
          <MenuItem icon="help-circle-outline" iconBg="#f5f5f5" iconColor="#666" label="Trung tâm trợ giúp" onPress={() => { }} />
          <MenuItem icon="chatbox-ellipses-outline" iconBg="#f5f5f5" iconColor="#666" label="Chat với FashionHub" onPress={() => { }} />
          <MenuItem icon="flag-outline" iconBg="#f5f5f5" iconColor="#666" label="Điều khoản dịch vụ" onPress={() => { }} />
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#111111" />
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>FashionHub365 · v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // ── UNAUTHENTICATED ──
  unauthHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  unauthHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  unauthBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  unauthAvatarWrapper: {
    marginBottom: 20,
  },
  unauthAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 10,
  },
  unauthSub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#111111',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  registerBtn: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#111111',
  },
  registerBtnText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },

  // ── HEADER ──
  header: {
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: '#ddd',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatarFallbackText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileNameArea: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  profileEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 6,
  },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  rolePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  walletRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  walletItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  walletDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'stretch',
    marginVertical: 10,
  },
  walletLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // ── CARD ──
  card: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 14,
  },
  cardSeeAll: {
    fontSize: 13,
    color: '#888',
  },

  // ── ORDER STATUS ──
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  orderBtn: {
    alignItems: 'center',
    flex: 1,
  },
  orderIconWrapper: {
    marginBottom: 6,
  },
  orderBtnLabel: {
    fontSize: 11,
    color: '#444',
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── MENU ITEM ──
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#111111',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── LOGOUT ──
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '700',
  },

  // ── FOOTER ──
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#bbb',
    fontSize: 12,
  },
});
