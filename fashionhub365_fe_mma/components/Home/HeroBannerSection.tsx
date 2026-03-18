import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const bannerCards = [
  {
    title: "Holiday Collection",
    image: "https://images.unsplash.com/photo-1512418490979-9ce9804b065e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", 
    description: "The best presents for everyone.",
  },
  {
    title: "Cleaner Fashion",
    image: "https://images.unsplash.com/photo-1560243558-0021c1fce9ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    description: "Sustainability efforts behind products.",
  },
];

export default function HeroBannerSection() {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {bannerCards.map((card, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.card} 
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.9}
          >
            <Image source={{ uri: card.image }} style={styles.image} />
            <View style={styles.overlay}>
              <Text style={styles.title}>{card.title}</Text>
              <Text style={styles.description}>{card.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  card: {
    width: 280,
    height: 380,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#eee',
    lineHeight: 20,
  }
});
