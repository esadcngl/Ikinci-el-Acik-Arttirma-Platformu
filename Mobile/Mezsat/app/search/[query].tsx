import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
const sortOptions = [
  { label: 'Fiyat Artan', value: 'starting_price' },
  { label: 'Fiyat Azalan', value: '-starting_price' },
  { label: 'Yeniden Eskiye', value: '-created_at' },
  { label: 'Eskiden Yeniye', value: 'created_at' },
];

const SearchResultsScreen = () => {
  const { query } = useLocalSearchParams();
  const router = useRouter();
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [ordering, setOrdering] = useState('');
  const [showSortModal, setShowSortModal] = useState(false);

  const fetchAuctions = useCallback(async (isRefreshing = false) => {
    if (loading && !isRefreshing) return;

    const currentPage = isRefreshing ? 1 : page;

    setLoading(true);
    if (isRefreshing) {
      setPage(1);
      setHasMore(true);
    }

    try {
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/?search=${query}&ordering=${ordering}&page=${currentPage}`);
      const data = await res.json();

      let results = [];
      let responseHasMore = false;

      if (Array.isArray(data)) {
        results = data;
        responseHasMore = false;
      } else if (data && typeof data === 'object' && data.results) {
        results = data.results;
        responseHasMore = data.next !== null && data.next !== undefined;
      }

      setAuctions(prev => isRefreshing ? results : [...prev, ...results]);

      if (!isRefreshing && results.length > 0 && responseHasMore) {
        setPage(prev => prev + 1);
      }
      setHasMore(responseHasMore);
    } catch (error) {
      console.error('Arama sonuçları yüklenemedi:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [query, ordering, loading]);

  useEffect(() => {
    setIsInitialLoading(true);
    setAuctions([]);
    setPage(1);
    setHasMore(true);
  }, [query, ordering]);

  useEffect(() => {
    if (isInitialLoading) {
      fetchAuctions(true);
    }
  }, [isInitialLoading, fetchAuctions]);

  const handleSortSelect = (value: string) => {
    if (ordering !== value) {
      setOrdering(value);
    }
    setShowSortModal(false);
  };

  const toggleFavorite = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
  
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/favorite/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (res.ok) {
        setAuctions(prev => prev.map(item =>
          item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
        ));
      } else {
        console.error('Favori API hatası:', res.status);
      }
    } catch (error) {
      console.error('Favori değiştirilemedi:', error);
    }
  };
  if (isInitialLoading) {
    return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
        <Text style={styles.sortButtonText}>Sırala</Text>
      </TouchableOpacity>

      {auctions.length === 0 && !loading ? (
        <View style={styles.center}>
          <Text>Sonuç bulunamadı.</Text>
        </View>
      ) : (
        <FlatList
          data={auctions}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/auction/${item.id}`)}>
              <Image
                source={{ uri: item.image || 'https://via.placeholder.com/300x200' }}
                style={styles.image}
              />
              <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => toggleFavorite(item.id)}
              >
                <FontAwesome name={item.is_favorite ? 'heart' : 'heart-o'} size={20} color="red" />
              </TouchableOpacity>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.price}>{parseFloat(item.starting_price).toLocaleString()} ₺</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => {
            if (hasMore && !loading) {
              fetchAuctions(false);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading && hasMore ? <ActivityIndicator size="small" color="#4f46e5" /> : null}
        />
      )}

      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {sortOptions.map((option) => (
              <TouchableOpacity key={option.value} style={styles.modalItem} onPress={() => handleSortSelect(option.value)}>
                <Text style={styles.modalItemText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  card: { width: '48%', backgroundColor: 'white', marginBottom: 16, borderRadius: 8, overflow: 'hidden', elevation: 2, position: 'relative' },
  image: { width: '100%', height: 120 },
  favoriteIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 20, padding: 4, elevation: 4 },
  title: { padding: 8, fontSize: 14, fontWeight: 'bold' },
  price: { paddingHorizontal: 8, paddingBottom: 8, color: '#4f46e5', fontWeight: 'bold' },
  sortButton: { padding: 12, backgroundColor: '#4f46e5', alignItems: 'center' },
  sortButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { margin: 40, backgroundColor: 'white', borderRadius: 8, padding: 20 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 16, textAlign: 'center' },
});

export default SearchResultsScreen;
