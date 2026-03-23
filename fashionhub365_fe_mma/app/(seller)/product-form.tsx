import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
// @ts-ignore
import { createProduct, updateProduct, getProductById, getCategories } from '../../services/productService';

export default function ProductForm() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    description: '',
    primary_category_id: '',
    status: 'active',
    media: [] as any[]
  });

  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProductData();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      // @ts-ignore
      setCategories(res?.data || res || []);
    } catch (err) {
      console.error('Error categories:', err);
    }
  };

  const loadProductData = async () => {
    try {
      const res = await getProductById(id as string);
      // @ts-ignore
      const data = res?.data || res;
      setFormData({
        name: data.name || '',
        base_price: String(data.base_price || ''),
        description: data.description || '',
        primary_category_id: data.primary_category_id?._id || data.primary_category_id || '',
        status: data.status || 'active',
        media: data.media || []
      });
      if (data.media && data.media.length > 0) {
        setImageUrl(data.media[0].url);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải thông tin sản phẩm');
      router.back();
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.base_price || !formData.primary_category_id) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Tên, Giá và Danh mục.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        base_price: Number(formData.base_price),
        media: imageUrl ? [{ url: imageUrl, isPrimary: true, mediaType: 'image' }] : []
      };

      if (isEdit) {
        await updateProduct(id as string, payload);
        Alert.alert('Thành công', 'Đã cập nhật sản phẩm!');
      } else {
        await createProduct(payload);
        Alert.alert('Thành công', 'Đã tạo sản phẩm mới!');
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Chỉnh sửa' : 'Thêm mới'} sản phẩm</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <Text style={styles.saveBtnText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tên sản phẩm *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Áo thun nam Cotton"
              value={formData.name}
              onChangeText={(txt) => setFormData({...formData, name: txt})}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Giá bán (₫) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 150000"
              keyboardType="numeric"
              value={formData.base_price}
              onChangeText={(txt) => setFormData({...formData, base_price: txt})}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Danh mục *</Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat._id} 
                    style={[
                      styles.catChip, 
                      formData.primary_category_id === cat._id && styles.catChipActive
                    ]}
                    onPress={() => setFormData({...formData, primary_category_id: cat._id})}
                  >
                    <Text style={[
                      styles.catChipText,
                      formData.primary_category_id === cat._id && styles.catChipTextActive
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mô tả sản phẩm</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Nhập mô tả chi tiết..."
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(txt) => setFormData({...formData, description: txt})}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Link ảnh sản phẩm</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChangeText={setImageUrl}
            />
            <Text style={styles.hint}>Tạm thời bạn có thể dán link ảnh từ Unsplash hoặc các trang web khác.</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Trạng thái</Text>
            <View style={styles.statusRow}>
              {['active', 'draft', 'inactive'].map((st) => (
                <TouchableOpacity 
                  key={st} 
                  style={[styles.statusBtn, formData.status === st && styles.statusBtnActive]}
                  onPress={() => setFormData({...formData, status: st})}
                >
                  <Text style={[styles.statusBtnText, formData.status === st && styles.statusBtnTextActive]}>
                    {st === 'active' ? 'Đang bán' : st === 'draft' ? 'Nháp' : 'Ẩn'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginTop: 5,
  },
  catScroll: {
    flexDirection: 'row',
  },
  catChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  catChipActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  catChipText: {
    fontSize: 13,
    color: '#666',
  },
  catChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusBtnActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  statusBtnText: {
    fontSize: 14,
    color: '#666',
  },
  statusBtnTextActive: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  }
});
