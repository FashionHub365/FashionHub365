import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import adminApi from '../../apis/adminApi';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Role Modal state
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<any>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchUsers = async (pageNum = 1, isRefresh = false) => {
    try {
      if (!isRefresh && pageNum > 1) setLoading(false);
      const res = await adminApi.getUsers({ page: pageNum, limit: 20, search });
      if ((res as any).success) {
        const newUsers = (res as any).data.users || [];
        if (isRefresh || pageNum === 1) {
          setUsers(newUsers);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
        }
        setHasMore(newUsers.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchUsers(page + 1);
    }
  };

  const handleToggleStatus = (user: any) => {
    const isBanned = user.status === 'BANNED';
    const newStatus = isBanned ? 'ACTIVE' : 'BANNED';
    const actionText = isBanned ? 'Mở khóa' : 'Khóa';

    Alert.alert(
      `${actionText} tài khoản`,
      `Bạn có chắc chắn muốn ${actionText.toLowerCase()} người dùng "${user.username || user.email}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: actionText,
          style: isBanned ? "default" : "destructive",
          onPress: async () => {
            try {
              const res = await adminApi.updateUserStatus(user._id || user.id, newStatus);
              if ((res as any).success) {
                Alert.alert("Thành công", `Đã ${actionText.toLowerCase()} tài khoản.`);
                // Reload the current list
                fetchUsers(1, true);
              }
            } catch (err: any) {
              Alert.alert("Lỗi", err?.response?.data?.message || "Không thể thực hiện tao tác.");
            }
          }
        }
      ]
    );
  };

  const openRoleModal = async (user: any) => {
    setSelectedUserForRole(user);
    setRoleModalVisible(true);
    setRolesLoading(true);
    try {
      const res = await adminApi.getRoleOptions();
      const options = (res as any).data || [];
      setAvailableRoles(Array.isArray(options) ? options : (options.roles || []));
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể tải danh sách quyền.");
    } finally {
      setRolesLoading(false);
    }
  };

  const handleToggleRole = async (role: any) => {
    if (!selectedUserForRole) return;

    // Use global_role_ids as populated from getAdminUsers
    const userGlobalRoles = selectedUserForRole.global_role_ids || selectedUserForRole.global_roles || [];
    const hasRole = userGlobalRoles.some((r: any) => r && (r._id === role._id || r === role._id));

    try {
      if (hasRole) {
        // Revoke
        const res = await adminApi.revokeGlobalRole(selectedUserForRole._id, role._id);
        if ((res as any) === '' || res === undefined || (res as any).success || (res as any).status === 204) {
          Alert.alert("Thành công", `Đã gỡ quyền ${role.name}.`);
          setSelectedUserForRole({
            ...selectedUserForRole,
            global_role_ids: userGlobalRoles.filter((r: any) => (r._id || r) !== role._id)
          });
          fetchUsers(1, false); // reload silently
        }
      } else {
        // Assign (backend expects roleIds array and replaces completely)
        const currentUserRoleIds = userGlobalRoles.map((r: any) => r._id || r);
        const newRoleIds = [...currentUserRoleIds, role._id];

        const res = await adminApi.assignGlobalRole(selectedUserForRole._id, { roleIds: newRoleIds });
        if ((res as any).success) {
          Alert.alert("Thành công", `Đã cấp quyền ${role.name}.`);
          setSelectedUserForRole({
            ...selectedUserForRole,
            global_role_ids: [...userGlobalRoles, role] // append locally for ui tick
          });
          fetchUsers(1, false); // reload silently
        }
      }
    } catch (err: any) {
      Alert.alert("Lỗi", err?.response?.data?.message || "Không thể thay đổi quyền.");
    }
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userImgContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.userImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{(item.profile?.full_name || item.username || 'U').charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.profile?.full_name || item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.roleContainer}>
          {item.global_role_ids?.map((role: any) => (
            <View key={role._id} style={styles.roleBadge}>
              <Text style={styles.roleText}>{role.name}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.statusDot, { backgroundColor: item.status === 'ACTIVE' ? '#4caf50' : '#f44336' }]} />

      {/* Nhóm Nút hành động */}
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#e8f0fe' }]}
          onPress={() => openRoleModal(item)}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#1a73e8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: item.status === 'BANNED' ? '#e8f5e9' : '#ffebee' }]}
          onPress={() => handleToggleStatus(item)}
        >
          <Ionicons
            name={item.status === 'BANNED' ? "lock-open-outline" : "lock-closed-outline"}
            size={20}
            color={item.status === 'BANNED' ? '#4caf50' : '#f44336'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý người dùng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên, email, username..."
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {loading && page === 1 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>Không tìm thấy người dùng nào.</Text>
            </View>
          }
          ListFooterComponent={hasMore ? <ActivityIndicator style={{ margin: 20 }} color="#1a73e8" /> : null}
        />
      )}

      {/* Modal Phân Quyền */}
      <Modal visible={roleModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gán Quyền Mức Hệ Thống</Text>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {rolesLoading ? (
              <ActivityIndicator size="large" color="#4a90e2" style={{ marginTop: 20 }} />
            ) : (
              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <Text style={styles.formHint}>Nhấp vào quyền để cấp hoặc gỡ.</Text>
                {availableRoles.map(role => {
                  const userGlobalRoles = selectedUserForRole?.global_role_ids || selectedUserForRole?.global_roles || [];
                  const hasRole = userGlobalRoles.some((rUser: any) => rUser && (rUser._id === role._id || rUser === role._id));
                  return (
                    <TouchableOpacity
                      key={role._id}
                      style={[styles.roleOption, hasRole && styles.roleOptionActive]}
                      onPress={() => handleToggleRole(role)}
                    >
                      <View style={styles.roleInfo}>
                        <Text style={[styles.roleName, hasRole && styles.roleNameActive]}>{role.name}</Text>
                        <Text style={styles.roleDesc}>{role.description}</Text>
                      </View>
                      <Ionicons
                        name={hasRole ? "checkmark-circle" : "add-circle-outline"}
                        size={24}
                        color={hasRole ? "#1a73e8" : "#888"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  backBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 48,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userImgContainer: {
    marginRight: 12,
  },
  userImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  roleBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  roleText: {
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#888',
    fontSize: 14,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  closeBtn: {
    padding: 5,
  },
  modalForm: {
    flex: 1,
  },
  formHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  roleOptionActive: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  roleInfo: {
    flex: 1,
    marginRight: 10,
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roleNameActive: {
    color: '#1a73e8',
  },
  roleDesc: {
    fontSize: 13,
    color: '#666',
  }
});
