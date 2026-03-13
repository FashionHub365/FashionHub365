import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CheckoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Checkout coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});
