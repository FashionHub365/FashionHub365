import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import StoresListingSection from '../../components/Stores/StoresListingSection';

export default function StoresScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StoresListingSection />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
