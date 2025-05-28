import { useEffect, useState, useCallback } from 'react'; // useCallback ekleyin
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // useFocusEffect ekleyin

const tabs = [
  { key: 'active', label: 'Aktif İlanlar' },
  { key: 'expired', label: 'Biten İlanlar' },
  { key: 'sold', label: 'Satılan İlanlar' },
];

export default function IlanlarimScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetchUserAndListings();
  // }, []); // Bu useEffect'i kaldırın veya yorum satırı yapın

  const fetchUserAndListings = useCallback(async () => { // useCallback içine alın
    setLoading(true); // Yükleme durumunu başta true yapın
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) {
        setLoading(false); // Token yoksa yüklemeyi bitir
        return;
      }

      // Profil bilgisini al (gerekliyse)
      const resProfile = await fetch('http://192.168.0.4:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resProfile.ok) throw new Error('Profil alınamadı'); // Hata kontrolü
      const profileData = await resProfile.json();
      setUserId(profileData.id);

      // İlanları al
      const resListings = await fetch(`http://192.168.0.4:8000/api/users/${profileData.id}/auctions/`);
      if (!resListings.ok) throw new Error('İlanlar alınamadı'); // Hata kontrolü
      const listingsData = await resListings.json();
      setListings(listingsData);

    } catch (error) {
      console.error('İlanlar yüklenemedi:', error);
      setListings([]); // Hata durumunda listeyi boşalt
    } finally {
      setLoading(false); // İşlem bitince yüklemeyi bitir
    }
  }, []); // Bağımlılık dizisi boş kalabilir, çünkü dışarıdan bir state'e bağlı değil

  // Ekran her odaklandığında verileri çekmek için useFocusEffect kullanın
  useFocusEffect(
    useCallback(() => {
      fetchUserAndListings();
      // İsteğe bağlı: Ekran odaktan çıktığında bir temizleme fonksiyonu çalıştırılabilir
      // return () => {
      //   console.log('IlanlarimScreen odaktan çıktı');
      // };
    }, [fetchUserAndListings]) // fetchUserAndListings'i bağımlılık olarak ekleyin
  );


  const filteredListings = listings.filter((item) => {
    const now = new Date();
    if (activeTab === 'active') return item.status === 'active';
    if (activeTab === 'expired') return !item.is_active && item.status !== 'sold' && new Date(item.end_time) < now;
    if (activeTab === 'sold') return item.status === 'sold';
    return true;
  });

  if (loading) {
    return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Sekmeler */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* İlanlar */}
      {loading ? ( // Yükleme durumunu burada kontrol edin
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
      ) : filteredListings.length === 0 ? (
        <View style={styles.center}><Text>Bu sekmede ilan bulunamadı.</Text></View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            // Durum etiketi ve rengi
            let statusText = '';
            let statusColor = '';
            if (item.status === 'sold') {
              statusText = 'Satıldı';
              statusColor = '#22c55e';
            } else if (!item.is_active) {
              statusText = 'Bitti';
              statusColor = '#ef4444';
            } else {
              statusText = 'Aktif';
              statusColor = '#4f46e5';
            }

            return (
              <TouchableOpacity
                style={styles.cardNew}
                onPress={() => router.push(`/auction/${item.id}`)}
                activeOpacity={0.85}
              >
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/300x200?text=No+Image' }}
                    style={styles.image}
                  />
                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusText}>{statusText}</Text>
                  </View>
                  {/* Favori ikonu göstermek isterseniz açın:
                  <TouchableOpacity style={styles.favoriteIcon}>
                    <FontAwesome name={item.is_favorite ? 'heart' : 'heart-o'} size={20} color="red" />
                  </TouchableOpacity>
                  */}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.titleNew} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.priceNew}>{parseFloat(item.starting_price).toLocaleString()} ₺</Text>
                  {item.category_name && (
                    <Text style={styles.categoryNew}>{item.category_name}</Text>
                  )}
                  <Text style={styles.endDate}>
                    Bitiş: {new Date(item.end_time).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* İlan Oluştur Butonu */}
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/create-auction')}>
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, backgroundColor: '#f3f4f6' },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  activeTab: { backgroundColor: '#4f46e5' },
  tabText: { fontSize: 14, color: '#6b7280' },
  activeTabText: { color: 'white', fontWeight: 'bold' },
  cardNew: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#f3f4f6',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    elevation: 2,
    zIndex: 2,
  },
  cardContent: {
    padding: 14,
  },
  titleNew: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  priceNew: {
    fontSize: 15,
    color: '#4f46e5',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categoryNew: {
    fontSize: 12,
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
    marginTop: 2,
  },
  endDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: { position: 'absolute', right: 20, bottom: 30, backgroundColor: '#4f46e5', padding: 16, borderRadius: 30, elevation: 5 },
});
