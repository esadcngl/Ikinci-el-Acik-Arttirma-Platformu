import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CustomHeaderProps = {
  balance?: number;
  onTopUp?: () => void;
};

const CustomHeader: React.FC<CustomHeaderProps> = ({ balance = 0, onTopUp }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>Mezsat</Text>
      <View style={styles.right}>
        <View style={styles.balanceBox}>
          <Ionicons name="wallet-outline" size={20} color="#4f46e5" style={{ marginRight: 4 }} />
          <Text style={styles.balanceText}>{balance.toLocaleString('tr-TR')} ₺</Text>
        </View>
        <TouchableOpacity style={styles.topUpBtn} onPress={onTopUp}>
          <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.topUpText}>Bakiye Yükle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 24, // iPhone 11 çentiği için
    paddingBottom: 12,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4f46e5',
    letterSpacing: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  balanceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topUpText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CustomHeader;