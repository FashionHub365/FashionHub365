import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import storeApi from "../../apis/storeApi";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  "https://images.unsplash.com/photo-1573855619003-97b479344483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
];

const getStoreLocation = (store: any) => {
  if (store?.information?.addressesText) return store.information.addressesText;
  if (Array.isArray(store?.addresses) && store.addresses.length > 0) {
    const address = store.addresses[0];
    if (typeof address === "string") return address;
    return [address.line1, address.line2, address.ward, address.district, address.city]
      .filter(Boolean)
      .join(", ");
  }
  return "Online store";
};

const getStoreImage = (store: any, index: number) => {
  const info = store?.information || {};
  if (info.banner || info.coverImage || info.logo) {
    return info.banner || info.coverImage || info.logo;
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
};

export default function StoresListingSection() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadStores = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await storeApi.listStores({ page: 1, limit: 30, sort: "rating" });
        if (!active) return;
        // @ts-ignore
        if (res && res.success) {
          // @ts-ignore
          setStores(res.data?.stores || []);
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.response?.data?.message || "Cannot load stores.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStores();
    return () => {
      active = false;
    };
  }, []);

  const subtitle = useMemo(() => {
    if (loading) return "Loading stores...";
    return `Find one of our ${stores.length} stores.`;
  }, [loading, stores.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stores</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : stores.length === 0 && !error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No stores available.</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.uuid || item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/store/${item.uuid || item._id}` as any)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: getStoreImage(item, index) }}
                style={styles.cardImage}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardLocation} numberOfLines={2}>
                  {getStoreLocation(item)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    alignItems: "center",
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    padding: 10,
    backgroundColor: "#ffe6e6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcccc",
    marginBottom: 20,
  },
  errorText: {
    color: "#d9534f",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 20,
  },
  emptyText: {
    color: "#888",
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
  },
  cardInfo: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#333",
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 14,
    color: "#666",
  },
});
