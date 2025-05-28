import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AuctionCardProps {
  id: number;
  image: string;
  title: string;
  endTime: string;
  price: number;
  category?: string;
  bidCount?: number;
  lastBid?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const AuctionCard: React.FC<AuctionCardProps> = ({
  id,
  image,
  title,
  endTime,
  price,
  isFavorite,
  onToggleFavorite,
  category,
  bidCount,
  lastBid
}) => {
  const router = useRouter();

  const calculateProgress = (endTime: string): number => {
    const end = new Date(endTime);
    const start = new Date(end);
    start.setDate(start.getDate() - 30); // 30 gün önceki tarih
  
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
  
    const progress = Math.max(0, Math.min((elapsed / total) * 100, 100));
    return progress;
  };
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-indexed
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  const handlePress = () => {
    router.push({
      pathname: '/auction/[id]',
      params: { id: id }
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image source={{ uri: image }} style={styles.image} />
      <TouchableOpacity style={styles.favoriteIcon} onPress={onToggleFavorite}>
        <FontAwesome name={isFavorite ? 'heart' : 'heart-o'} size={20} color="red" />
      </TouchableOpacity>
      <View style={styles.info}>
        <View style={styles.titleanddate}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.price}>
            {typeof price === 'number' ? price.toLocaleString() : '-'} ₺
          </Text>
        </View>
        <View style={styles.dateandprice}>
          {category && <Text style={styles.category}>{category}</Text>}
        </View>

        {/* Progress bar */}
        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progressBar,
              { width: `${calculateProgress(endTime)}%` }
            ]}
          />
        </View>
      <View style={styles.bottomInfo}>
      {(typeof bidCount === 'number' && typeof lastBid === 'number') && (
  <Text style={styles.bidInfo}>
    {bidCount} teklif (Son: {lastBid.toLocaleString()} ₺)
  </Text>
)}
        <Text style={styles.date}>Bitiş Tarihi: {formatDate(endTime)}</Text>
      </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  bottomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  favoriteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    elevation: 2,
    zIndex: 1,
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
  },
  category: {
    fontSize: 12,
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 2,
  },
  bidInfo: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#4f46e5',
    borderRadius: 3,
  },
  titleanddate:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
  },
  dateandprice:{
    flexDirection:'row',
    justifyContent:'space-between'
  }
});

export default AuctionCard;
