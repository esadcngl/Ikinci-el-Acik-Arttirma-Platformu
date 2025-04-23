import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Link } from 'expo-router';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.hero}>
          <FontAwesomeIcon icon={faGavel} size={50} color="#fff" />
          <Text style={styles.heroTitle}>Mezsat</Text>
          <Text style={styles.heroSubtitle}>
            Açık artırma dünyasına hoş geldin! Sat, teklif ver, kazan!
          </Text>
        </View>

        <View style={styles.actions}>
          <Link href="/login" style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Giriş Yap</Text>
          </Link>
          <Link href="/register" style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Kayıt Ol</Text>
          </Link>
          <Link href="/register" style={styles.ghostBtn}>
            <Text style={styles.ghostText}>İlanlara Göz At</Text>
          </Link>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="person-add" size={24} color="#4f46e5" />
          <Text style={styles.infoTitle}>1. Ücretsiz Üye Ol</Text>
          <Text style={styles.infoText}>
            Hemen katıl, ürünlerini listele ya da teklif ver!
          </Text>
        </View>
        <View style={styles.infoCard}>
        <FontAwesomeIcon icon={faGavel} size={24} color="#4f46e5" />
          <Text style={styles.infoTitle}>2. Teklif Ver veya Sat</Text>
          <Text style={styles.infoText}>
            Açık artırma sistemimiz ile rekabeti başlat!
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#4f46e5" />
          <Text style={styles.infoTitle}>3. Güvenli Alışveriş</Text>
          <Text style={styles.infoText}>
            Güvenli ödeme sistemiyle rahatça alışveriş yap.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#4f46e5',
    paddingVertical: 40,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  heroSubtitle: {
    color: '#e0e7ff',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actions: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  primaryBtn: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#4f46e5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
  ghostBtn: {
    alignItems: 'center',
    marginTop: 10,
  },
  ghostText: {
    color: '#6b7280',
    fontSize: 14,
  },
  infoCard: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1f2937',
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default HomeScreen;
