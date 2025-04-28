import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const AuctionDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [manageBids, setManageBids] = useState(false);
  const [activeTab, setActiveTab] = useState<'bids' | 'comments'>('bids');

  const fetchAuction = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setAuction(data);
      setIsFavorite(data.is_favorite || false);
    } catch (error) {
      console.error('Detay yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsername = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch('http://192.168.0.4:8000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLoginUsername(data.username);
    } catch (error) {
      console.error('Kullanıcı adı alınamadı:', error);
    }
  };

  const fetchBids = async () => {
    try {
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/bids/list/`);
      if (res.ok) {
        const data = await res.json();
        setBids(data);
      }
    } catch (error) {
      console.error('Teklifler yüklenemedi:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/comments/list/`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Yorumlar yüklenemedi:', error);
    }
  };

  const toggleFavorite = async () => {
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
      if (res.ok) setIsFavorite((prev) => !prev);
    } catch (error) {
      console.error('Favori işlem hatası:', error);
    }
  };

  const submitBid = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/bids/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(bidAmount) }),
      });
      if (res.ok) {
        setBidAmount('');
        fetchBids();
      } else {
        Alert.alert('Hata', 'Teklif verilemedi. Bakiye kontrol ediniz.');
      }
    } catch (error) {
      console.error('Teklif verirken hata:', error);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/comments/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        setCommentText('');
        fetchComments();
      }
    } catch (error) {
      console.error('Yorum gönderirken hata:', error);
    }
  };

  const acceptBid = async (bidId: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch(`http://192.168.0.4:8000/api/bids/${bidId}/accept/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchBids();
        fetchAuction();
      }
    } catch (error) {
      console.error('Kabul hatası:', error);
    }
  };

  const rejectBid = async (bidId: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch(`http://192.168.0.4:8000/api/bids/${bidId}/reject/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchBids();
    } catch (error) {
      console.error('Reddetme hatası:', error);
    }
  };

  const cancelBid = async (bidId: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      if (!token) return;
      const res = await fetch(`http://192.168.0.4:8000/api/auctions/bids/${bidId}/cancel/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchBids();
    } catch (error) {
      console.error('İptal etme hatası:', error);
    }
  };

  const deleteAuction = async () => {
    Alert.alert('İlanı Sil', 'Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem('access');
          if (!token) return;
          const res = await fetch(`http://192.168.0.4:8000/api/auctions/${id}/delete/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            Alert.alert('Başarılı', 'İlan silindi.');
            router.back();
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchAuction();
    fetchBids();
    fetchComments();
    fetchUsername();
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />;
  }

  if (!auction) {
    return (
      <View style={styles.center}>
        <Text>İlan bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: auction.image || 'https://via.placeholder.com/600x400' }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity style={styles.favoriteIcon} onPress={toggleFavorite}>
        <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={24} color="red" />
      </TouchableOpacity>
      <Text style={styles.title}>{auction.title}</Text>
      <Text style={styles.owner}>Satıcı: {auction.owner_username || 'Bilinmiyor'}</Text>
      <Text style={styles.price}>Başlangıç Fiyatı: {parseFloat(auction.starting_price).toLocaleString()} ₺</Text>
      <Text style={styles.date}>Bitiş: {new Date(auction.end_time).toLocaleDateString('tr-TR')}</Text>
      <Text style={styles.description}>{auction.description}</Text>

      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bids' && styles.activeTab]}
          onPress={() => setActiveTab('bids')}
        >
          <Text style={styles.tabText}>Teklifler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'comments' && styles.activeTab]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={styles.tabText}>Yorumlar</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs İçerik */}
      {activeTab === 'bids' ? (
        <>
          {/* Teklif Ver */}
          {auction.is_active && auction.status === 'active' && (
            <View style={styles.bidContainer}>
              <TextInput
                style={styles.input}
                placeholder="Teklif Tutarı (₺)"
                keyboardType="numeric"
                value={bidAmount}
                onChangeText={setBidAmount}
              />
              <TouchableOpacity style={styles.bidButton} onPress={submitBid}>
                <Text style={styles.bidButtonText}>Teklif Ver</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Teklifler Listesi */}
          {bids.filter(b => b.status === 'pending' || b.status === 'accepted').length === 0 ? (
            <Text style={{ color: '#9ca3af', marginTop: 10 }}>Henüz teklif yok.</Text>
          ) : (
            bids.filter(b => b.status === 'pending' || b.status === 'accepted').map((bid) => (
              <View key={bid.id} style={styles.bidItem}>
                <Text>{bid.user_username}: {parseFloat(bid.amount).toLocaleString()} ₺</Text>

                {manageBids && loginUsername === auction.owner_username && bid.status === 'pending' && (
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#22c55e' }]} onPress={() => acceptBid(bid.id)}>
                      <Text style={styles.smallButtonText}>Kabul Et</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#ef4444', marginLeft: 10 }]} onPress={() => rejectBid(bid.id)}>
                      <Text style={styles.smallButtonText}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {loginUsername === bid.user_username && bid.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.smallButton, { backgroundColor: '#f59e0b', marginTop: 8 }]}
                    onPress={() => cancelBid(bid.id)}
                  >
                    <Text style={styles.smallButtonText}>İptal Et</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </>
      ) : (
        <>
          {/* Yorum Yap */}
          <TextInput
            style={styles.input}
            placeholder="Yorumunuzu yazın..."
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.bidButton} onPress={submitComment}>
            <Text style={styles.bidButtonText}>Gönder</Text>
          </TouchableOpacity>

          {/* Yorumlar Listesi */}
          {comments.length === 0 ? (
            <Text style={{ color: '#9ca3af', marginTop: 10 }}>Henüz yorum yok.</Text>
          ) : (
            comments.map((comment) => (
              <View key={comment.id} style={styles.bidItem}>
                <Text style={{ fontWeight: 'bold' }}>{comment.user}</Text>
                <Text>{comment.text}</Text>
              </View>
            ))
          )}
        </>
      )}

      {/* İlan Sahibi Alanı */}
      {loginUsername === auction.owner_username && (
        <View style={{ marginTop: 30 }}>
          <TouchableOpacity style={styles.ownerButton} onPress={() => setManageBids(!manageBids)}>
            <Text style={styles.ownerButtonText}>Teklifleri Yönet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ownerButton, { backgroundColor: '#dc2626' }]} onPress={deleteAuction}>
            <Text style={styles.ownerButtonText}>İlanı Sil</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: 'white' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: 250, borderRadius: 8 },
  favoriteIcon: { position: 'absolute', top: 20, right: 20, backgroundColor: '#fff', borderRadius: 25, padding: 8, elevation: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 12 },
  owner: { fontSize: 16, color: '#6b7280' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#4f46e5', marginVertical: 8 },
  date: { fontSize: 15, marginBottom: 10, color: '#6b7280' },
  description: { fontSize: 16, marginTop: 10 },
  tabButton: { flex: 1, padding: 10, borderBottomWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  activeTab: { borderColor: '#4f46e5' },
  tabText: { fontSize: 16, fontWeight: '600' },
  bidContainer: { marginVertical: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, marginBottom: 10 },
  bidButton: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  bidButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  bidItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  ownerButton: { marginTop: 10, backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  ownerButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  smallButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  smallButtonText: { color: 'white', fontWeight: 'bold' },
});

export default AuctionDetailScreen;
