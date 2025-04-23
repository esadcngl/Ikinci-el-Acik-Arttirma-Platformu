import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const VitrinScreen = () => {
  const [username, setUsername] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsername = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch('http://192.168.0.4:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
      }
    } catch (err) {
      console.log('Kullanıcı adı alınamadı:', err);
    }
  };

  const fetchProducts = useCallback(async (isRefreshing = false) => {
    if (loading || (!hasMore && !isRefreshing)) return;

    setLoading(true);
    if (isRefreshing) {
      setRefreshing(true);
      setPage(1);
      setHasMore(true);
    }

    const currentPage = isRefreshing ? 1 : page;

    try {
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/?page=${currentPage}`);
      const data = await res.json();

      if (res.ok) {
        const existingIds = new Set(products.map((item) => item.id));
        const newUniqueItems = data.filter((item: any) => !existingIds.has(item.id));

        if (newUniqueItems.length > 0) {
          setProducts((prev) => isRefreshing ? newUniqueItems : [...prev, ...newUniqueItems]);
          setPage((prev) => prev + 1);
        } else if (!isRefreshing) {
          setHasMore(false);
        } else {
          setProducts([]);
          setHasMore(data.length > 0);
        }
      } else {
        console.error('Ürünler yüklenemedi, durum:', res.status);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Ürünler yüklenirken hata:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
      if (isRefreshing) setRefreshing(false);
    }
  }, [loading, hasMore, page, products]);

  useEffect(() => {
    fetchUsername();
    fetchProducts();
  }, []);

  const onRefresh = useCallback(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  const toggleFavorite = async (auctionId: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;

      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${auctionId}/favorite/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auction: auctionId }), // gerekiyorsa gönder
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === auctionId ? { ...item, is_favorite: !item.is_favorite } : item
          )
        );
      }
    } catch (err) {
      console.error('Favori işlemi başarısız:', err);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/300x200' }}
        style={styles.image}
      />
      <TouchableOpacity style={styles.heartIcon} onPress={() => toggleFavorite(item.id)}>
        <FontAwesome
          name={item.is_favorite ? 'heart' : 'heart-o'}
          size={20}
          color="red"
        />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>Bitiş: {new Date(item.end_time).toLocaleDateString('tr-TR')}</Text>
        <Text style={styles.price}>
          {parseFloat(item.starting_price).toLocaleString()} ₺
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      ListHeaderComponent={
        <View style={{ padding: 16 }}>
          <Text style={styles.header}>👋 Merhaba, {username || 'Kullanıcı'}!</Text>
          <Text style={styles.subHeader}>📦 Son Eklenen Ürünler</Text>
        </View>
      }
      data={products}
      keyExtractor={(item) => `auction-${item.id}`}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 100 }}
      onEndReached={() => fetchProducts(false)}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading && !refreshing ? (
          <ActivityIndicator size="small" color="#4f46e5" />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4f46e5']}
          tintColor="#4f46e5"
        />
      }
      ListEmptyComponent={
        !loading
          ? (
            <Text style={{ textAlign: 'center', marginTop: 30, color: '#9ca3af' }}>
              Henüz ürün yok.
            </Text>
          )
          : null
      }
    />
  );
};

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '500',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  image: {
    width: '100%',
    height: 180,
  },
  heartIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    color: '#6b7280',
    fontSize: 13,
    marginBottom: 4,
  },
  price: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default VitrinScreen;
