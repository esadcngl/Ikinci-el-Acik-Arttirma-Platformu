import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, FlatList, Alert , Modal, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ProfilScreen() {
  const [activeTab, setActiveTab] = useState<'favoriler' | 'degerlendirmeler' | 'ayarlar'>('favoriler');
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const router = useRouter(); 
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'favoriler') {
        fetchFavorites();
      }
    }, [activeTab])
  );

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;

      const res = await fetch('http://192.168.0.4:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Profil verisi çekilemedi:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoadingFavorites(true);
      const token = await AsyncStorage.getItem('access');
      if (!token) return;

      const res = await fetch('http://192.168.0.4:8000/api/favorites/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFavorites(data);
    } catch (error) {
      console.error('Favoriler çekilemedi:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleFavorite = async (auctionId: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;

      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${auctionId}/favorite/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.auction.id !== auctionId));
      } else {
        Alert.alert('Hata', 'Favori kaldırılamadı.');
      }
    } catch (error) {
      console.error('Favori toggle hatası:', error);
    }
  };
  const openImagePickerAsync = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Fotoğraf seçme izni verilmedi.");
      return;
    }
  
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  
    if (pickerResult.canceled === false && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedImage = pickerResult.assets[0]; 
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
  
      const formData = new FormData();
      formData.append('profile_image', {
        uri: selectedImage.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);
  
      const res = await fetch('http://192.168.0.4:8000/api/profile/update/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      if (res.ok) {
        fetchProfile();
        Alert.alert('Başarılı', 'Profil resmi güncellendi.');
      } else {
        Alert.alert('Hata', 'Profil resmi güncellenemedi.');
      }
    }
  };
  
  const resetProfileImage = async () => {
    const token = await AsyncStorage.getItem('access');
    if (!token) return;
  
    const res = await fetch('http://192.168.0.4:8000/api/profile/update/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile_image: null }),
    });
  
    if (res.ok) {
      fetchProfile();
      Alert.alert('Başarılı', 'Profil resmi sıfırlandı.');
    } else {
      Alert.alert('Hata', 'Profil resmi sıfırlanamadı.');
    }
  };
  
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler uyuşmuyor.');
      return;
    }
  
    const token = await AsyncStorage.getItem('access');
    if (!token) return;
  
    const res = await fetch('http://192.168.0.4:8000/api/change-password/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: newPassword }),
    });
  
    if (res.ok) {
      Alert.alert('Başarılı', 'Şifre değiştirildi.');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Alert.alert('Hata', 'Şifre değiştirilemedi.');
    }
  };
  const renderFavorites = () => {
    if (loadingFavorites) {
      return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 30 }} />;
    }

    if (favorites.length === 0) {
      return <Text style={styles.tabContentText}>Favori ürün bulunamadı.</Text>;
    }

    return (
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.favoriteCard}
            activeOpacity={0.8}
            // navigation.navigate yerine router.push kullanın
            onPress={() => router.push(`/auction/${item.auction.id}`)}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: item.auction.image
                    ? item.auction.image
                    : 'http://192.168.0.4:8000/media/auction/picture.png',
                }}
                style={styles.favoriteImage}
              />
              <TouchableOpacity style={styles.heartIcon} onPress={() => toggleFavorite(item.auction.id)}>
                <Ionicons name="heart" size={24} color="red" />
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.favoriteTitle}>{item.auction.title}</Text>
              <Text style={styles.favoritePrice}>
                {parseFloat(item.auction.starting_price).toLocaleString()} ₺
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ gap: 16, padding: 16 }}
      />
    );
  };

  if (loadingProfile) {
    return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Üst Kısım: Kullanıcı Bilgisi */}
      <View style={styles.header}>
        <Image
          source={{
            uri: profile?.profile_image_url
              ? `http://192.168.0.4:8000${profile.profile_image_url}`
              : 'http://192.168.0.4:8000/media/user/user_default.png',
          }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{profile?.username || 'Kullanıcı'}</Text>
        <Text style={styles.joinedDate}>
          Katılım Tarihi: {new Date(profile?.date_joined).toLocaleDateString('tr-TR')}
        </Text>
      </View>

      {/* Sekmeler */}
      <View style={styles.tabs}>
        {['favoriler', 'degerlendirmeler', 'ayarlar'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'favoriler' ? 'Favoriler' : tab === 'degerlendirmeler' ? 'Değerlendirmeler' : 'Ayarlar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* İçerik */}
      <View style={{ flex: 1 }}>
        {activeTab === 'favoriler' && renderFavorites()}
        {activeTab === 'degerlendirmeler' && (
          <View style={styles.tabContent}><Text style={styles.tabContentText}>Değerlendirmeler burada listelenecek.</Text></View>
        )}
        {activeTab === 'ayarlar' && (
  <View style={styles.tabContent}>
    <TouchableOpacity style={styles.settingButton} onPress={openImagePickerAsync}>
      <Text style={styles.settingButtonText}>Profil Fotoğrafını Değiştir</Text>
    </TouchableOpacity>
    {/* <TouchableOpacity style={styles.settingButton} onPress={resetProfileImage}>
      <Text style={styles.settingButtonText}>Profil Fotoğrafını Kaldır</Text>
    </TouchableOpacity> */}
    <TouchableOpacity style={styles.settingButton} onPress={() => setShowPasswordModal(true)}>
      <Text style={styles.settingButtonText}>Şifre Değiştir</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.settingButton} onPress={() => {
      AsyncStorage.clear();
      router.replace('/');
    }}>
      <Text style={styles.settingButtonText}>Çıkış Yap</Text>
    </TouchableOpacity>
    <Modal visible={showPasswordModal} animationType="slide" transparent>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Şifre Değiştir</Text>
      <TextInput
        placeholder="Yeni Şifre"
        secureTextEntry
        style={styles.modalInput}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        placeholder="Şifreyi Onayla"
        secureTextEntry
        style={styles.modalInput}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.modalButton} onPress={changePassword}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Değiştir</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={{ marginTop: 10 }}>
        <Text style={{ color: '#4f46e5' }}>Vazgeç</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
  </View>
)}
      </View>
    </View>



  );
  
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#4f46e5',
    paddingVertical: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  joinedDate: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 16,
    gap: 12,
  },
  tabContentText: {
    fontSize: 16,
    color: '#374151',
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  favoritePrice: {
    fontSize: 14,
    color: '#4f46e5',
  },
  settingButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
  },
  settingButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  
});

// Favori ilan resim URL'sine backend adresini eklemeyi unutmayın!
// Önceki yanıtta eklemiştim ama burada tekrar kontrol ettim.
// uri: item.auction.image ? `http://192.168.0.4:8000${item.auction.image}` : ...
