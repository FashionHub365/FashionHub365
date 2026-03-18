import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../../contexts/CartContext';
import { IconSymbol } from '../ui/icon-symbol';

export default function CartItem({ item }: { item: any }) {
  const { updateItem, removeItem } = useCart();
  
  const handleIncrease = () => {
    const maxStock = item.stock ?? 99;
    if (item.quantity >= maxStock) return;
    updateItem(item.itemId, item.quantity + 1);
  };

  const handleDecrease = () => {
    if (item.quantity <= 1) return;
    updateItem(item.itemId, item.quantity - 1);
  };

  const formattedPrice = (item.price * item.quantity).toLocaleString('vi-VN');

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=80' }} 
        style={styles.image} 
      />
      
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.itemId)} style={styles.removeBtn}>
            <IconSymbol name="trash" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>

        <Text style={styles.variant}>{item.variantName || '—'}</Text>
        
        {!item.inStock && <Text style={styles.outOfStock}>Out of stock</Text>}

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>{formattedPrice}₫</Text>
            <Text style={styles.unitPrice}>{item.price.toLocaleString('vi-VN')}₫ / item</Text>
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]} 
              onPress={handleDecrease}
              disabled={item.quantity <= 1}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.qtyText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={[styles.qtyBtn, item.quantity >= (item.stock ?? 99) && styles.qtyBtnDisabled]} 
              onPress={handleIncrease}
              disabled={item.quantity >= (item.stock ?? 99)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  image: {
    width: 80,
    height: 100,
    borderRadius: 6,
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  removeBtn: {
    padding: 5,
  },
  variant: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  outOfStock: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  unitPrice: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  qtyText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  }
});
