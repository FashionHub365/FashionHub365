import React from 'react';
import { StyleSheet, Text, View, ScrollView,  TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NewArrivalsSection from '../../components/Home/NewArrivalsSection';
import HeroBannerSection from '../../components/Home/HeroBannerSection';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header NavBar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {}}>
          <IconSymbol name="line.3.horizontal" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.logoText}>FASHIONHUB365</Text>
        
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')}>
          <IconSymbol name="cart" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* Main Hero Image mapped similarly to web */}
        <View style={styles.mainHero}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} 
            style={styles.heroImage} 
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroSubtitle}>WINTER 2026</Text>
            <Text style={styles.heroTitle}>New Season</Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.heroButtonText}>SHOP NOW</Text>
            </TouchableOpacity>
          </View>
        </View>

        <NewArrivalsSection />
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Collections</Text>
        </View>
        <HeroBannerSection />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  mainHero: {
    width: '100%',
    height: 500,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 25,
  },
  heroButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 30,
  },
  heroButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionHeader: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  }
});
