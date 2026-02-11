import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MarketplaceListing } from '../../types/marketplace';
import { cardShadow } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 20 * 2 - 12) / 2;

interface ListingCardProps {
  listing: MarketplaceListing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: listing.images[0] }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    ...cardShadow,
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 18,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00274C',
    marginBottom: 6,
  },
});
