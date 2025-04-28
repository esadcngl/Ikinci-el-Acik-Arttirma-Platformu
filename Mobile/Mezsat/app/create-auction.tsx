import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react'; // başta importlar arasında
import { Modal } from 'react-native';
export default function CreateAuctionScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [buyNowPrice, setBuyNowPrice] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<{ id: number; name: string } | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const res = await fetch('http://192.168.0.4:8000/api/categories/');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        console.error('Kategoriler yüklenemedi');
      }
    } catch (error) {
      console.error('Kategori çekme hatası:', error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleCreateAuction = async () => {
    if (!title || !description || !startingPrice || !endDate || !selectedCategory || !image) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun ve bir görsel seçin.');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('starting_price', startingPrice);
      if (buyNowPrice) {
        formData.append('buy_now_price', buyNowPrice);
      }
      formData.append('end_time', endDate.toISOString());
      if (selectedCategory) {
        formData.append('category', selectedCategory.id.toString());
      }
      formData.append('image', {
        uri: image.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const res = await fetch('http://192.168.0.4:8000/api/auctions/create/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        Alert.alert('Başarılı', 'İlan oluşturuldu!');
        router.push('/tabs/IlanlarimScreen');
      } else {
        console.error('İlan oluşturulamadı:', await res.text());
        Alert.alert('Hata', 'İlan oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      console.error('İlan oluşturma hatası:', error);
      Alert.alert('Hata', 'İlan oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput style={styles.input} placeholder="Başlık" value={title} onChangeText={setTitle} placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} placeholder="Açıklama" value={description} onChangeText={setDescription} multiline placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} placeholder="Başlangıç Fiyatı (₺)" value={startingPrice} onChangeText={setStartingPrice} keyboardType="numeric" placeholderTextColor="#9ca3af" />
      <TextInput style={styles.input} placeholder="Hemen Al Fiyatı (Opsiyonel)" value={buyNowPrice} onChangeText={setBuyNowPrice} keyboardType="numeric" placeholderTextColor="#9ca3af" />
      <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
      <Text style={{ color: selectedCategory ? '#111827' : '#6b7280' }}>
        {selectedCategory ? selectedCategory.name : 'Kategori Seç'}
      </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButtonText}>Bitiş Tarihi: {endDate.toLocaleDateString('tr-TR')}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}
<Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.modalItem}
          onPress={() => {
            setSelectedCategory({ id: cat.id, name: cat.name });
            setShowCategoryModal(false);
          }}
        >
          <Text style={styles.modalItemText}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
</Modal>
      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image.uri }} style={styles.image} />
        ) : (
          <Text style={{ color: '#6b7280' }}>Görsel Seç</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleCreateAuction} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveButtonText}>İlanı Kaydet</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: 'white' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, color: '#111827' },
  imagePicker: { height: 200, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  saveButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dateButton: { padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  dateButtonText: { color: '#111827', fontSize: 16 },
  selectButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'center',
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '80%',
    padding: 20,
  },
  modalItem: {
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
