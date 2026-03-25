import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import adminApi from '../../apis/adminApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Search is handled client-side for simplicity here, or can be passed as param if API supports it
      const res = await adminApi.getCategoryOptions();
      const data = (res as any).data || [];
      // If the API returns {success:true, data: {categories: [...]}} handle accordingly:
      const cats = Array.isArray(data) ? data : (data.categories || []);
      setCategories(cats);
    } catch (err: any) {
      console.error('Fetch categories error:', err);
      Alert.alert("Lỗi", "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa danh mục "${name}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await adminApi.deleteCategory(id);
              if ((res as any).success) {
                Alert.alert("Thành công", "Đã xóa danh mục.");
                load();
              }
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể xóa danh mục này');
            }
          }
        }
      ]
    );
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '' });
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingCategory(item);
    setFormData({ name: item.name, slug: item.slug || '', description: item.description || '' });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Tên danh mục không được để trống.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        const res = await adminApi.updateCategory(editingCategory._id, formData);
        if ((res as any).success) {
          Alert.alert("Thành công", "Đã cập nhật danh mục.");
          setModalVisible(false);
          load();
        }
      } else {
        const res = await adminApi.createCategory(formData);
        if ((res as any).success) {
          Alert.alert("Thành công", "Đã tạo danh mục mới.");
          setModalVisible(false);
          load();
        }
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchInput.toLowerCase())
  );

  const renderCategory = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.slug}>{item.slug}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.label}>Cấp cha:</Text>
        {item.parent_id ? (
          <View style={styles.parentBadge}>
            <Text style={styles.parentText}>{item.parent_id?.name || 'Có danh mục cha'}</Text>
          </View>
        ) : (
          <Text style={styles.rootText}>Gốc (Root)</Text>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description || "Chưa có mô tả."}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
          <IconSymbol name="pencil.circle" size={28} color="#4a90e2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id || item.id, item.name)}>
          <IconSymbol name="trash.circle" size={28} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Quản lý danh mục</Text>
          <Text style={styles.headerSubtitle}>{categories.length} danh mục</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên danh mục, slug..."
          value={searchInput}
          onChangeText={setSearchInput}
        />
        {searchInput !== '' && (
          <TouchableOpacity onPress={() => setSearchInput('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không tìm thấy danh mục nào.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item._id || item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={load}
          refreshing={loading}
        />
      )}

      {/* Modal Thêm / Sửa */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tên danh mục <Text style={{ color: 'red' }}>*</Text></Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Áo Thun"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />

              <Text style={styles.formLabel}>Slug (Tùy chọn)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: ao-thun (để trống tự tạo)"
                value={formData.slug}
                onChangeText={(t) => setFormData({ ...formData, slug: t })}
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Mô tả</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Mô tả chi tiết..."
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
                multiline
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelModalText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveModalText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  slug: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  parentBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  parentText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
  rootText: {
    fontSize: 12,
    color: '#1a73e8',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 15,
  },
  actionBtn: {
    padding: 4,
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
    height: '70%',
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
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginTop: 15,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
    gap: 15,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelModalText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
  },
  saveModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
  },
  saveModalText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  }
});
