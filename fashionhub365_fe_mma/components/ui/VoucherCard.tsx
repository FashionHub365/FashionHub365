import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VoucherCardProps {
    voucher: any;
    onClaim?: (id: string) => void;
    onUse?: (code: string) => void;
    isClaimed?: boolean;
    compact?: boolean;
    actionLabel?: string;
}

const VoucherCard: React.FC<VoucherCardProps> = ({
    voucher,
    onClaim,
    onUse,
    isClaimed = false,
    compact = false,
    actionLabel
}) => {
    const {
        _id,
        code,
        discount_value,
        discount_type,
        min_order_value,
        name,
        description
    } = voucher;

    const displayDiscount = discount_type === 'percentage'
        ? `${discount_value}%`
        : `${(discount_value || 0).toLocaleString('vi-VN')}₫`;

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <LinearGradient
                    colors={['#EE4D2D', '#FF7337']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.compactLeft}
                >
                    <Text style={styles.compactDiscountText}>{displayDiscount}</Text>
                </LinearGradient>
                <View style={styles.compactRight}>
                    <Text style={styles.compactTitle} numberOfLines={1}>{name || 'Giảm giá'}</Text>
                    <Text style={styles.compactSubtext}>Đơn từ {min_order_value?.toLocaleString('vi-VN')}₫</Text>
                    <TouchableOpacity
                        style={[styles.compactBtn, isClaimed && styles.compactBtnClaimed]}
                        onPress={() => !isClaimed && onClaim && onClaim(_id)}
                        disabled={isClaimed}
                    >
                        <Text style={styles.compactBtnText}>{isClaimed ? 'Lưu' : 'Lấy'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.cardContainer}>
            <View style={styles.leftSection}>
                <LinearGradient
                    colors={['#EE4D2D', '#FF7337']}
                    style={styles.iconCircle}
                >
                    <Ionicons name="pricetag" size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.cardDiscountText}>{displayDiscount}</Text>
                <Text style={styles.offLabel}>OFF</Text>
            </View>

            <View style={styles.dividerDots}>
                {[...Array(8)].map((_, i) => (
                    <View key={i} style={styles.dot} />
                ))}
            </View>

            <View style={styles.rightSection}>
                <View style={styles.infoArea}>
                    <Text style={styles.voucherName} numberOfLines={1}>{name || `Giảm ${displayDiscount}`}</Text>
                    <Text style={styles.voucherDesc} numberOfLines={2}>
                        {description || `Áp dụng cho đơn hàng từ ${min_order_value?.toLocaleString('vi-VN')}₫`}
                    </Text>
                    <View style={styles.codeContainer}>
                        <Text style={styles.codeLabel}>Code: </Text>
                        <Text style={styles.codeText}>{code}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.actionBtn, isClaimed && styles.claimedBtn]}
                    onPress={() => isClaimed ? onUse && onUse(code) : onClaim && onClaim(_id)}
                >
                    <Text style={[styles.actionBtnText, isClaimed && styles.claimedBtnText]}>
                        {actionLabel || (isClaimed ? 'DÙNG NGAY' : 'LẤY MÃ')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // Compact Style (For Product Page)
    compactContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFF2EE',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#EE4D2D',
        width: 160,
        height: 64,
        marginRight: 10,
        overflow: 'hidden',
    },
    compactLeft: {
        width: 65,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactDiscountText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    compactRight: {
        flex: 1,
        padding: 8,
        justifyContent: 'space-between',
    },
    compactTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
    },
    compactSubtext: {
        fontSize: 10,
        color: '#666',
    },
    compactBtn: {
        backgroundColor: '#EE4D2D',
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center',
    },
    compactBtnClaimed: {
        backgroundColor: '#aaa',
    },
    compactBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Main Card Style (For Wallet)
    cardContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        height: 110,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    leftSection: {
        width: 100,
        backgroundColor: '#FFF2EE',
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#eee',
        borderStyle: 'dashed',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardDiscountText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#EE4D2D',
    },
    offLabel: {
        fontSize: 10,
        color: '#EE4D2D',
        fontWeight: '600',
        marginTop: -2,
    },
    dividerDots: {
        width: 1,
        justifyContent: 'space-between',
        paddingVertical: 5,
        backgroundColor: '#fff',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#f5f5f5',
        marginLeft: -2,
    },
    rightSection: {
        flex: 1,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoArea: {
        flex: 1,
        marginRight: 10,
    },
    voucherName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222',
        marginBottom: 4,
    },
    voucherDesc: {
        fontSize: 11,
        color: '#666',
        lineHeight: 16,
        marginBottom: 6,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    codeLabel: {
        fontSize: 11,
        color: '#999',
    },
    codeText: {
        fontSize: 11,
        color: '#111',
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 4,
        borderRadius: 2,
    },
    actionBtn: {
        backgroundColor: '#EE4D2D',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 85,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    claimedBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EE4D2D',
    },
    claimedBtnText: {
        color: '#EE4D2D',
    },
});

export default VoucherCard;
