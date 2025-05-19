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
  const [activeTab, setActiveTab] = useState<'description' | 'bids' | 'comments'>('description');

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

  // Helper function to format currency
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'accepted': return 'Kabul Edildi';
      case 'rejected': return 'Reddedildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#9ca3af' }; // Sarı
      case 'accepted':
        return { backgroundColor: '#4ade80' }; // Yeşil
      case 'rejected':
        return { backgroundColor: '#f87171' }; // Kırmızı
      case 'cancelled':
        return { backgroundColor: '#facc15' }; // Gri
      default:
        return { backgroundColor: '#e5e7eb' }; // Default gri
    }
  };
  const activeBids = bids;
  const highestBid = activeBids.length > 0 ? Math.max(...activeBids.map(b => parseFloat(b.amount))) : null;
  const bidCount = activeBids.length;

  const calculateRemainingTimeParts = () => {
    if (!auction || !auction.end_time) return { text: "N/A", percentage: 0 };
    
    const endTime = new Date(auction.end_time).getTime();
    // Fallback for startTime if created_at is not available or invalid
    let startTime = auction.created_at ? new Date(auction.created_at).getTime() : 0;
    if (isNaN(startTime) || startTime === 0) {
        // If created_at is invalid, estimate a start time (e.g., 10 days before end_time, or now if end_time is in past)
        startTime = endTime > Date.now() ? endTime - (10 * 24 * 60 * 60 * 1000) : Date.now() - (10 * 24 * 60 * 60 * 1000);
    }

    const now = new Date().getTime();
    const difference = endTime - now;
  
    let text = "Süre Doldu";
    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) text = `${days} gün`;
      else if (hours > 0) text = `${hours} saat`;
      else if (minutes > 0) text = `${minutes} dakika`;
      else text = "Az Kaldı";
    }
    
    const totalDuration = endTime - startTime;
    let percentage = 0;
    if (totalDuration > 0 && now > startTime) {
        const elapsedTime = now - startTime;
        percentage = Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
    } else if (now <= startTime) {
        percentage = 0;
    } else { // now >= endTime or totalDuration <= 0
        percentage = 100;
    }
    if (now >= endTime) percentage = 100;

    return { text, percentage };
  };

  const { text: remainingTimeText, percentage: progressPercentage } = calculateRemainingTimeParts();

  const formatAuctionCreationDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Geçersiz Tarih";
        const optionsDate: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
        const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
        return `${date.toLocaleDateString('tr-TR', optionsDate)} ${date.toLocaleTimeString('tr-TR', optionsTime)}`;
    } catch (e) {
        return "Tarih Format Hatası";
    }
  };
  const formattedCreationDate = formatAuctionCreationDate(auction?.created_at);


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
      
      <View style={styles.titleAndFavoriteRow}>
          <Text style={styles.title}>{auction.title}</Text>
          <TouchableOpacity style={styles.favoriteIconTopRight} onPress={toggleFavorite}>
              <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={24} color="red" />
          </TouchableOpacity>
      </View>
      {auction.category_name && <Text style={styles.categoryNameText}>{auction.category_name}</Text>}
      {/* Mevcut Teklif, Başlangıç Fiyatı, Satılık Fiyatı */}
      <View style={styles.priceInfoContainer}>
        <View style={styles.priceInfoBlock}>
          <Text style={styles.priceInfoLabel}>Mevcut Teklif</Text>
          <Text style={styles.priceInfoValueBold}>{highestBid ? formatCurrency(highestBid) : 'Teklif Yok ₺'}</Text>
        </View>
        <View style={styles.priceInfoBlock}>
          <Text style={styles.priceInfoLabel}>Başlangıç Fiyatı</Text>
          <Text style={styles.priceInfoValue}>{formatCurrency(parseFloat(auction.starting_price))}</Text>
        </View>
        {auction.buy_now_price && parseFloat(auction.buy_now_price) > 0 && (
          <View style={styles.priceInfoBlock}>
            <Text style={styles.priceInfoLabel}>Satılık Fiyatı</Text>
            <Text style={styles.priceInfoValue}>{formatCurrency(parseFloat(auction.buy_now_price))}</Text>
          </View>
        )}
      </View>

      {/* Kalan Süre */}
      <View style={styles.timeRemainingContainer}>
        <View style={styles.timeRemainingHeader}>
            <Text style={styles.timeRemainingLabel}>Kalan Süre</Text>
            <Text style={styles.timeRemainingValue}>{remainingTimeText}</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Teklif Sayısı, İlan Oluşturulma Tarihi */}
      <View style={styles.metaDataContainer}>
        <View style={styles.metaDataBlock}>
          <Text style={styles.metaDataLabel}>Teklif Sayısı</Text>
          <Text style={styles.metaDataValueNum}>{bidCount}</Text>
        </View>
        <View style={styles.metaDataBlock}>
          <Text style={styles.metaDataLabel}>İlan Oluşturulma Tarihi</Text>
          <Text style={styles.metaDataValueDate}>{formattedCreationDate}</Text>
        </View>
      </View>
      
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'description' && styles.activeTab]}
          onPress={() => setActiveTab('description')}
        >
          <Text style={[styles.tabText, activeTab === 'description' && styles.activeTabText]}>Açıklama</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bids' && styles.activeTab]}
          onPress={() => setActiveTab('bids')}
        >
          <Text style={[styles.tabText, activeTab === 'bids' && styles.activeTabText]}>Teklifler ({bidCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'comments' && styles.activeTab]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>Yorumlar ({comments.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs İçerik */}
      {activeTab === 'description' && (
        <View style={styles.tabContent}>
          <Text style={styles.descriptionContentText}>{auction.description}</Text>
          <Text style={styles.ownerText}>Satıcı: {auction.owner_username || 'Bilinmiyor'}</Text>
        </View>
      )}
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
          {bids.length === 0 ? (
            <Text style={{ color: '#9ca3af', marginTop: 10 }}>Henüz teklif yok.</Text>
          ) : (
            bids.filter(b => b.status).map((bid) => (
              <View key={bid.id} style={[styles.bidItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <Text>{bid.user_username}: {parseFloat(bid.amount).toLocaleString()} ₺</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {manageBids && loginUsername === auction.owner_username && bid.status === 'pending' && (
                    <>
                      <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#22c55e' }]} onPress={() => acceptBid(bid.id)}>
                        <Text style={styles.smallButtonText}>Kabul Et</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#ef4444', marginLeft: 10 }]} onPress={() => rejectBid(bid.id)}>
                        <Text style={styles.smallButtonText}>Reddet</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {loginUsername === bid.user_username && bid.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: '#f59e0b', marginLeft: 10 }]}
                      onPress={() => cancelBid(bid.id)}
                    >
                      <Text style={styles.smallButtonText}>İptal Et</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.statusBadge, getStatusStyle(bid.status)]}>
                  <Text style={styles.statusBadgeText}>{getStatusText(bid.status)}</Text>
                </View>
              </View>
            ))
          )}
        </>
      ) : activeTab === 'comments' && (
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
        <View style={{ marginTop: 30, paddingHorizontal: 16 }}>
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
  container: {
    backgroundColor: '#fff', // Arka plan rengi eklendi
    paddingBottom: 20, // Örnek olarak bu satırın var olduğunu varsayıyorum, sizdeki duruma göre ayarlayın
  },
  image: {
    width: '100%',
    height: 250, // Yüksekliği biraz artırdım, isteğe bağlı
    // resizeMode: 'cover', // Zaten vardı, tekrar etmeye gerek yok
  },
  titleAndFavoriteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Dikey hizalama için
    paddingHorizontal: 16,
    marginTop: 12, // Resimden sonra biraz boşluk
    // marginBottom: 4, // Kaldırıldı veya ayarlandı
  },
  title: {
    fontSize: 22, // Biraz büyütüldü
    fontWeight: 'bold',
    color: '#1f2937', // Koyu renk
    flex: 1, // Başlığın kalan alanı kaplaması için
    marginRight: 8, // Favori ikonundan boşluk bırakmak için
  },
  favoriteIconTopRight: {
    padding: 8, // Dokunma alanını artırmak için
  },
  categoryNameText: {
    fontSize: 14,
    color: '#6b7280', // Gri tonu
    paddingHorizontal: 16,
    marginBottom: 12, // Fiyat bilgilerinden önce boşluk
  },
  priceInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Eşit dağılım
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb', // Hafif bir arka plan
    paddingVertical: 12,
    borderRadius: 8,
  },
  priceInfoBlock: {
    alignItems: 'center', // İçeriği ortala
  },
  priceInfoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  priceInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  priceInfoValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5', // Vurgu rengi
  },
  timeRemainingContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timeRemainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeRemainingLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  timeRemainingValue: {
    fontSize: 14,
    color: '#4f46e5', // Vurgu rengi
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8, // Biraz kalınlaştırıldı
    backgroundColor: '#e5e7eb', // Açık gri arka plan
    borderRadius: 4,
    overflow: 'hidden', // İçindeki barın taşmasını engelle
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5', // Vurgu rengi
    borderRadius: 4,
  },
  metaDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    borderTopWidth: 1, // Ayırıcı çizgi
    borderBottomWidth: 1, // Ayırıcı çizgi
    borderColor: '#e5e7eb', // Çizgi rengi
    paddingVertical: 12,
  },
  metaDataBlock: {
    alignItems: 'flex-start', // Sola yaslı
    flex: 1, // Eşit genişlik
  },
  metaDataLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  metaDataValueNum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  metaDataValueDate: {
    fontSize: 14, // Biraz küçültüldü
    color: '#374151',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Sekmeleri eşit dağıt
    backgroundColor: '#f3f4f6', // Sekme barı arka planı
    // marginBottom: 16, // Kaldırıldı, içerik padding'i ile yönetilecek
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabButton: {
    paddingVertical: 12, // Dikey padding artırıldı
    paddingHorizontal: 16, // Yatay padding
    alignItems: 'center', // İçeriği ortala
    flex: 1, // Sekmelerin eşit genişlikte olması için
  },
  activeTab: {
    borderBottomWidth: 2, // Aktif sekme için alt çizgi
    borderBottomColor: '#4f46e5', // Vurgu rengi
  },
  tabText: {
    fontSize: 14, // Font boyutu ayarlandı
    color: '#6b7280', // Pasif sekme rengi
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4f46e5', // Aktif sekme rengi
    fontWeight: 'bold', // Aktif sekme fontu kalın
  },
  tabContent: {
    padding: 16, // İçerik için padding
  },
  descriptionContentText: {
    fontSize: 15, // Font boyutu ayarlandı
    lineHeight: 22, // Satır yüksekliği
    color: '#374151', // Koyu gri
    marginBottom: 12,
  },
  ownerText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  bidContainer: {
    // flexDirection: 'row', // Kaldırıldı, input ve buton alt alta daha iyi olabilir
    // alignItems: 'center', // Kaldırıldı
    paddingHorizontal: 16, // Yatay padding
    paddingVertical: 12, // Dikey padding
    // marginBottom: 16, // Kaldırıldı veya ayarlandı
    backgroundColor: '#f9fafb', // Hafif arka plan
    borderRadius: 8,
    marginTop: 8, // Sekme içeriğinden sonra boşluk
  },
  input: {
    // flex: 1, // Kaldırıldı
    borderWidth: 1,
    borderColor: '#d1d5db', // Kenarlık rengi
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10, // Dikey padding
    fontSize: 15,
    backgroundColor: '#fff', // Input arka planı
    marginBottom: 10, // Butondan önce boşluk
  },
  bidButton: {
    backgroundColor: '#4f46e5', // Vurgu rengi
    paddingVertical: 12, // Dikey padding
    paddingHorizontal: 20, // Yatay padding
    borderRadius: 8,
    alignItems: 'center', // Metni ortala
    // marginLeft: 10, // Kaldırıldı
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bidButtonText: {
    color: '#fff', // Beyaz metin
    fontWeight: 'bold',
    fontSize: 15,
  },
  bidItem: {
    paddingVertical: 10, // Dikey padding
    paddingHorizontal: 16, // Yatay padding
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb', // Ayırıcı çizgi rengi
    backgroundColor: '#fff', // Teklif öğesi arka planı
    marginBottom: 8, // Teklifler arası boşluk
    borderRadius: 6,
  },
  smallButton: {
    paddingVertical: 6, // Dikey padding
    paddingHorizontal: 10, // Yatay padding
    borderRadius: 6,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 13, // Font boyutu
    fontWeight: '500',
  },
  ownerButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10, // Butonlar arası boşluk
  },
  ownerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Hata durumu için de arka plan
  },
  // ... Diğer stilleriniz burada devam eder
});

export default AuctionDetailScreen;
