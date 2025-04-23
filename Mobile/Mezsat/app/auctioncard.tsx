import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface AuctionCardProps {
  image: string;
  title: string;
  endTime: string;
  price: number;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  image,
  title,
  endTime,
  price,
  isFavorite,
  onPress,
  onToggleFavorite
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: image }} style={styles.image} />
      <TouchableOpacity style={styles.favoriteIcon} onPress={onToggleFavorite}>
        <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={20} color="red" />
      </TouchableOpacity>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.date}>Bitiş: {endTime}</Text>
        <Text style={styles.price}>{price.toLocaleString()} ₺</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    elevation: 2,
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginTop: 6,
  }
});

export default AuctionCard;
