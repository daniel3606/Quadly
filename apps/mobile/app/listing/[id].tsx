import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMarketplaceStore } from '../../src/store/marketplaceStore';
import { useAuthStore } from '../../src/store/authStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentListing, fetchListingDetail, updateListingStatus, openConversation } =
    useMarketplaceStore();
  const { user } = useAuthStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isOwner = user?.id === currentListing?.seller_id;

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      fetchListingDetail(id).then(() => setIsLoading(false));
    }
  }, [id]);

  const handleMessageSeller = async () => {
    if (!currentListing) return;
    const conversationId = await openConversation(
      currentListing.id,
      currentListing.seller_id
    );
    if (conversationId) {
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    }
  };

  const handleMarkAsSold = () => {
    Alert.alert('Mark as Sold', 'Are you sure you want to mark this as sold?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark as Sold',
        onPress: () => {
          updateListingStatus(id!, 'sold');
          router.back();
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          updateListingStatus(id!, 'deleted');
          router.back();
        },
      },
    ]);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveImageIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00274C" />
      </View>
    );
  }

  if (!currentListing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#ffffff', '#f6f6f6']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentListing.title}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Carousel */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={styles.carousel}
          >
            {currentListing.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Pagination dots */}
          {currentListing.images.length > 1 && (
            <View style={styles.pagination}>
              {currentListing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === activeImageIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}

          <View style={styles.details}>
            {/* Price & Title */}
            <Text style={styles.price}>${currentListing.price.toFixed(2)}</Text>
            <Text style={styles.title}>{currentListing.title}</Text>

            {/* Status badge */}
            {currentListing.status !== 'active' && (
              <View style={[styles.statusBadge, currentListing.status === 'sold' && styles.soldBadge]}>
                <Text style={styles.statusText}>
                  {currentListing.status === 'sold' ? 'SOLD' : 'DELETED'}
                </Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.description}>{currentListing.description}</Text>

            {/* Actions */}
            {!isOwner && currentListing.status === 'active' && (
              <TouchableOpacity style={styles.messageButton} onPress={handleMessageSeller}>
                <Text style={styles.messageButtonText}>Message Seller</Text>
              </TouchableOpacity>
            )}

            {isOwner && currentListing.status === 'active' && (
              <View style={styles.ownerActions}>
                <TouchableOpacity style={styles.soldButton} onPress={handleMarkAsSold}>
                  <Text style={styles.soldButtonText}>Mark as Sold</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>Delete Listing</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  backLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#00274C',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#00274C',
  },
  headerPlaceholder: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  carousel: {
    height: SCREEN_WIDTH,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#f0f0f0',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d0d0d0',
  },
  activeDot: {
    backgroundColor: '#00274C',
  },
  details: {
    padding: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00274C',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 26,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  soldBadge: {
    backgroundColor: '#FF9500',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
    marginBottom: 24,
  },
  messageButton: {
    backgroundColor: '#00274C',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerActions: {
    gap: 12,
  },
  soldButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  soldButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
});
