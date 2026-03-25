import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, TextInput, ScrollView, Modal, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import reviewApi from '../../apis/reviewApi';
import { getSellerProducts } from '../../services/productService';

export default function SellerReviews() {
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [respondModalVisible, setRespondModalVisible] = useState(false);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadProducts = useCallback(async () => {
        try {
            // @ts-ignore
            const res = await getSellerProducts();
            if (res && (res as any).success) {
                const prodData = (res as any).data.products || (res as any).data || [];
                setProducts(prodData);
                // Auto select first product if none selected
                if (prodData.length > 0 && !selectedProduct) {
                    setSelectedProduct(prodData[0]);
                }
            }
        } catch (err) {
            console.error('Error loading products for reviews:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedProduct]);

    const loadReviews = useCallback(async (productId: string) => {
        setLoadingReviews(true);
        try {
            const res = await reviewApi.getSellerProductReviews(productId);
            if (res && (res as any).success) {
                setReviews((res as any).data.reviews || []);
            }
        } catch (err) {
            console.error('Error loading reviews:', err);
        } finally {
            setLoadingReviews(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    useEffect(() => {
        if (selectedProduct) {
            loadReviews(selectedProduct._id);
        }
    }, [selectedProduct, loadReviews]);

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    const handleRespond = async () => {
        if (!responseText.trim()) return;
        setSubmitting(true);
        try {
            await reviewApi.respondToReview(selectedProduct._id, selectedReview._id, responseText);
            Alert.alert('Thành công', 'Đã gửi phản hồi.');
            setRespondModalVisible(false);
            setResponseText('');
            loadReviews(selectedProduct._id);
        } catch (err: any) {
            Alert.alert('Lỗi', err.response?.data?.message || 'Không thể gửi phản hồi.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderReview = ({ item }: { item: any }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{item.reviewer_info?.name || 'Người dùng'}</Text>
                    <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                                key={s}
                                name={s <= item.rating ? "star" : "star-outline"}
                                size={14}
                                color="#f1c40f"
                            />
                        ))}
                    </View>
                </View>
                <Text style={styles.reviewDate}>
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                </Text>
            </View>

            <Text style={styles.reviewContent}>{item.content}</Text>

            {item.seller_response ? (
                <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>Phản hồi của bạn:</Text>
                    <Text style={styles.responseText}>{item.seller_response}</Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.respondBtn}
                    onPress={() => {
                        setSelectedReview(item);
                        setRespondModalVisible(true);
                    }}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4a90e2" />
                    <Text style={styles.respondBtnText}>Phản hồi</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Product Selector */}
            <View style={styles.productSelector}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>
                    {products.map((p) => (
                        <TouchableOpacity
                            key={p._id}
                            style={[styles.productChip, selectedProduct?._id === p._id && styles.productChipActive]}
                            onPress={() => setSelectedProduct(p)}
                        >
                            <Text style={[styles.productChipText, selectedProduct?._id === p._id && styles.productChipTextActive]} numberOfLines={1}>
                                {p.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ee4d2d" />
                </View>
            ) : reviews.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="star-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item._id}
                    renderItem={renderReview}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ee4d2d"]} />
                    }
                />
            )}

            {/* Respond Modal */}
            <Modal
                visible={respondModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setRespondModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Phản hồi khách hàng</Text>
                            <TouchableOpacity onPress={() => setRespondModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.originalReview}>
                            <Text style={styles.originalReviewer}>{selectedReview?.reviewer_info?.name}</Text>
                            <Text style={styles.originalContent} numberOfLines={3}>{selectedReview?.content}</Text>
                        </View>

                        <TextInput
                            style={styles.responseInput}
                            placeholder="Nhập nội dung phản hồi của bạn..."
                            multiline
                            numberOfLines={4}
                            value={responseText}
                            onChangeText={setResponseText}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, !responseText.trim() && styles.submitBtnDisabled]}
                            onPress={handleRespond}
                            disabled={submitting || !responseText.trim()}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Gửi phản hồi</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
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
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    backBtn: {
        padding: 4,
    },
    productSelector: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    productScroll: {
        paddingHorizontal: 15,
    },
    productChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
        maxWidth: 200,
    },
    productChipActive: {
        backgroundColor: '#ee4d2d',
    },
    productChipText: {
        fontSize: 13,
        color: '#666',
    },
    productChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        marginTop: 15,
        textAlign: 'center',
    },
    listContainer: {
        padding: 15,
    },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    reviewerInfo: {
        flex: 1,
    },
    reviewerName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    ratingRow: {
        flexDirection: 'row',
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
    },
    reviewContent: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 12,
    },
    respondBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingVertical: 5,
    },
    respondBtnText: {
        fontSize: 13,
        color: '#4a90e2',
        fontWeight: '600',
        marginLeft: 5,
    },
    responseBox: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#ee4d2d',
    },
    responseLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    responseText: {
        fontSize: 13,
        color: '#333',
        fontStyle: 'italic',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
    },
    originalReview: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    originalReviewer: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 2,
    },
    originalContent: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
    },
    responseInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        textAlignVertical: 'top',
        height: 120,
        marginBottom: 20,
    },
    submitBtn: {
        backgroundColor: '#ee4d2d',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#ccc',
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
