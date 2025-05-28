import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Alert, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

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
  const [aiCategory, setAiCategory] = useState('');
  const [aiPrice, setAiPrice] = useState('');
  const [predicting, setPredicting] = useState(false);

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

  const handleAIPredict = async () => {
    if (!title || !description) {
      Alert.alert("Uyarı", "Başlık ve açıklama dolu olmalı.");
      return;
    }
  
    setPredicting(true);
    try {
      const response = await fetch('http://192.168.0.4:5001/predict/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
  
      const result = await response.json();
  
      if (!response.ok) throw new Error(result.error || "Tahmin başarısız.");
  
      setAiCategory(result.predicted_category);
      setAiPrice(result.estimated_price_web);
  
      Alert.alert("Tahminler", `Kategori: ${result.predicted_category}\nFiyat: ${result.estimated_price_web}`);
    } catch (err: any) {
      Alert.alert("Hata", err.message || "Tahmin sırasında sorun oluştu.");
    } finally {
      setPredicting(false);
    }
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Yeni İlan Oluştur</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.image} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <FontAwesome name="image" size={36} color="#a5b4fc" />
                <Text style={{ color: '#6b7280', marginTop: 8 }}>Görsel Seç</Text>
              </View>
            )}
          </TouchableOpacity>
          <TextInput style={styles.input} placeholder="Başlık" value={title} onChangeText={setTitle} placeholderTextColor="#9ca3af" />
          <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Açıklama" value={description} onChangeText={setDescription} multiline placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Başlangıç Fiyatı (₺)" value={startingPrice} onChangeText={setStartingPrice} keyboardType="numeric" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.input} placeholder="Hemen Al Fiyatı (Opsiyonel)" value={buyNowPrice} onChangeText={setBuyNowPrice} keyboardType="numeric" placeholderTextColor="#9ca3af" />
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
            <Text style={{ color: selectedCategory ? '#111827' : '#6b7280' }}>
              {selectedCategory ? selectedCategory.name : 'Kategori Seç'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.aiButton, predicting && { opacity: 0.6 }]}
            onPress={handleAIPredict}
            disabled={predicting}
          >
            {predicting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>🤖 Yapay Zeka ile Tahmin Et</Text>
            )}
          </TouchableOpacity>
          {aiCategory || aiPrice ? (
            <View style={styles.aiPredictionBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <FontAwesome name="lightbulb-o" size={18} color="#4338ca" style={{ marginRight: 6 }} />
                <Text style={styles.aiPredictionTitle}>Yapay Zeka Tahminleri</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiPredictionLabel}>Tahmini Kategori:</Text>
                  <Text style={styles.aiPredictionValue}>{aiCategory}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiPredictionLabel}>Tahmini Piyasa Değeri:</Text>
                  <Text style={styles.aiPredictionValue}>{aiPrice}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.aiApplyButton}
                onPress={() => {
                  const match = categories.find(cat =>
                    aiCategory && cat.name.toLowerCase().includes(aiCategory.toLowerCase())
                  );
                  if (match) setSelectedCategory(match);

                  const priceMatch = aiPrice.match(/₺([\d.,]+)\s*-\s*₺([\d.,]+)\s*\(ort:\s*₺([\d.,]+)\)/i);
                  if (priceMatch) {
                    const min = parseInt(priceMatch[1].replace(/\D/g, ''));
                    const max = parseInt(priceMatch[2].replace(/\D/g, ''));
                    const avg = parseInt(priceMatch[3].replace(/\D/g, ''));
                    setStartingPrice(avg.toString());
                    setBuyNowPrice(max.toString());
                  }

                  Alert.alert("Uygulandı", "Tahminler forma yansıtıldı.");
                }}
              >
                <FontAwesome name="check-circle" size={16} color="#4338ca" style={{ marginRight: 6 }} />
                <Text style={styles.aiApplyButtonText}>Tahminleri Uygula</Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
          <TouchableOpacity style={styles.saveButton} onPress={handleCreateAuction} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>İlanı Kaydet</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4f46e5', marginBottom: 18, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#6366f1', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, color: '#111827', backgroundColor: '#f9fafb' },
  imagePicker: { height: 180, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#f3f4f6' },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  saveButton: { backgroundColor: '#4f46e5', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dateButton: { padding: 12, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 16, alignItems: 'center', marginTop: 15, backgroundColor: '#f9fafb' },
  dateButtonText: { color: '#111827', fontSize: 16 },
  selectButton: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, justifyContent: 'center', height: 50, backgroundColor: '#f9fafb' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 8, width: '80%', padding: 20 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontSize: 16, textAlign: 'center' },
  aiButton: { backgroundColor: '#4338ca', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  aiPredictionBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  aiPredictionTitle: {
    color: '#4338ca',
    fontWeight: 'bold',
    fontSize: 16,
  },
  aiPredictionLabel: {
    color: '#6366f1',
    fontWeight: '500',
    fontSize: 13,
  },
  aiPredictionValue: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  aiApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  aiApplyButtonText: {
    color: '#4338ca',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
