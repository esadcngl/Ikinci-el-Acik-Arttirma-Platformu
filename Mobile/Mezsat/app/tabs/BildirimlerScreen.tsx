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
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadCard,
      ]}
      activeOpacity={0.85}
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
      <View style={[styles.statusBar, !item.is_read && styles.statusBarUnread]} />
      <View style={styles.cardContent}>
        <Text style={[styles.message, !item.is_read && styles.unreadMessage]}>
          {item.message}
        </Text>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleString('tr-TR')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={markAllAsRead}>
          <Text style={styles.actionBtnText}>Tümünü Okundu Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={clearAll}>
          <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Tümünü Sil</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f3f4f6' },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#4f46e5',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    padding: 0,
    overflow: 'hidden',
    alignItems: 'center',
  },
  unreadCard: {
    backgroundColor: '#eef6ff',
  },
  statusBar: {
    width: 6,
    height: '100%',
    backgroundColor: 'transparent',
  },
  statusBarUnread: {
    backgroundColor: '#4f46e5',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  message: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  unreadMessage: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
});
