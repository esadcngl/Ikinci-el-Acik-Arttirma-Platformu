// BildirimlerScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useNotification } from '../context/NotificationContext';
export default function BildirimlerScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ws = useRef<WebSocket | null>(null);
  const router = useRouter();
  const { setUnreadCount } = useNotification();
  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);
  const markAllAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      await fetch('http://192.168.0.4:8000/api/notifications/mark-all-read/', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
  
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.log("❌ Tümünü okundu yaparken hata:", err);
    }
  };
  
  const clearAll = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      await fetch('http://192.168.0.4:8000/api/notifications/clear/', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
  
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.log("❌ Bildirimleri silerken hata:", err);
    }
  };
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('access');
      const res = await fetch('http://192.168.0.4:8000/api/notifications/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNotifications(data);

      const unread = data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log(err);
      Alert.alert("Hata", "Bildirimler alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = async () => {
    const token = await AsyncStorage.getItem('access');
    if (!token) return;

    // WebSocket bağlantısı (token query param ile)
    ws.current = new WebSocket(`ws://192.168.0.4:8000/ws/notifications/?token=${token}`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        setNotifications((prev) => [
          {
            id: Date.now(),
            message: data.message,
            link: data.link,
            is_read: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    };

    ws.current.onopen = () => console.log('🔌 WS bağlantısı açık');
    ws.current.onerror = (err) => console.log('❌ WS hata:', err);
    ws.current.onclose = () => console.log('🔌 WS bağlantı kapalı');
  };

  const markAsRead = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('access');
      await fetch(`http://192.168.0.4:8000/api/notifications/${id}/read/`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.log('❌ Bildirim okundu hatası:', err);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.item, !item.is_read && styles.unread]}
      onPress={() => {
        if (item.link) {
          const auctionId = item.link.split('/').filter(Boolean).pop();
          router.push({
            pathname: '/auction/[id]',
            params: { id: auctionId } 
          });
        }
        markAsRead(item.id);
      }}
    >
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString('tr-TR')}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
  <TouchableOpacity onPress={markAllAsRead}>
    <Text style={{ color: '#4f46e5', fontWeight: 'bold',}}>Tümünü Okundu Yap</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={clearAll}>
    <Text style={{ color: 'red', fontWeight: 'bold' }}>Tümünü Sil</Text>
  </TouchableOpacity>
</View>

    </View>
    
  );
  
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  unread: {
    backgroundColor: '#eef6ff',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
