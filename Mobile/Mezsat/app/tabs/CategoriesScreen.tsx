import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const categories = [
  { id: 1, name: 'Elektronik', icon: 'laptop' },
  { id: 2, name: 'Moda', icon: 'tshirt' },
  { id: 3, name: 'Kitap', icon: 'book' },
  { id: 4, name: 'Mobilya', icon: 'couch' },
  { id: 5, name: 'Spor', icon: 'running' },
  { id: 6, name: 'Koleksiyon', icon: 'chess-queen' },
  { id: 7, name: 'Otomotiv', icon: 'car' },
  { id: 8, name: 'Ev & Yaşam', icon: 'home' },
  { id: 9, name: 'Anne & Bebek', icon: 'baby' },
  { id: 10, name: 'Müzik', icon: 'music' },
  { id: 11, name: 'Film & Dizi', icon: 'film' },
  { id: 12, name: 'Diğer', icon: 'ellipsis-h' },
];

const CategoriesScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      alert('Lütfen bir arama terimi girin.');
      return;
    }
    router.push({ pathname: '/search/[query]', params: { query: searchQuery.trim() } });
  };

  const handleCategoryPress = (category: any) => {
    router.push({ pathname: '/category/[id]', params: { id: category.id } });
  };

  return (
    <View style={styles.container}>
      {/* Arama Kutusu + Buton */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ne aramıştınız?"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <FontAwesome5 name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Kategoriler Listesi */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategoryPress(item)}>
            <FontAwesome5 name={item.icon} size={24} color="#4f46e5" />
            <Text style={styles.categoryText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ marginTop: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: 'white' },
  searchContainer: { flexDirection: 'row', marginBottom: 16 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
  },
  searchButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItem: { alignItems: 'center', justifyContent: 'center', marginBottom: 20, flex: 1 },
  categoryText: { marginTop: 8, fontSize: 14, color: '#374151', textAlign: 'center' },
});

export default CategoriesScreen;
