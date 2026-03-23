import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HeaderSearch from '../../components/Home/HeaderSearch';
import BannerCarousel from '../../components/Home/BannerCarousel';
import CategoriesGrid from '../../components/Home/CategoriesGrid';
import FlashSaleSection from '../../components/Home/FlashSaleSection';
import DailyDiscover from '../../components/Home/DailyDiscover';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000); // 1s visual delay, child components handle their own data fetching
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search Header - now clean white */}
      <HeaderSearch />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111" colors={['#111']} />
        }
      >
        <View key={refreshKey}>
          <BannerCarousel />
          <CategoriesGrid />
          <FlashSaleSection />
          <DailyDiscover />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', // White header background
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // overall grey background
  },
  scrollContent: {
    paddingBottom: 80, // space for tab bar
  }
});
