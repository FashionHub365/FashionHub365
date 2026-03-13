import React from 'react';
import { StyleSheet,  View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
