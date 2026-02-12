'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';
import { Header } from '@/components/Header';

interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: string;
  created_at: string;
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user, loading: userLoading } = useUser();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    fetchListing();
  }, [listingId, userLoading]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase.rpc('get_listing_detail', {
        p_listing_id: listingId,
      });
      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user || !listing) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_listing_id: listing.id,
        p_seller_id: listing.seller_id,
      });
      if (error) throw error;
      router.push(`/messages/${data}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!listing) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .update({ status })
        .eq('id', listing.id);
      if (error) throw error;
      setListing({ ...listing, status });
    } catch (error) {
      console.error('Failed to update listing:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || userLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-umich-blue mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  if (!listing) return null;

  const isOwner = user?.id === listing.seller_id;
  const images = listing.images || [];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        <div className="mb-6">
          <Link
            href="/marketplace"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
          >
            ← Back to Marketplace
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="bg-gray-100 dark:bg-gray-700">
              {images.length > 0 ? (
                <div className="relative">
                  <div className="aspect-square">
                    <img
                      src={images[currentImage]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      >
                        ›
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImage(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${
                              i === currentImage ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center text-gray-400">
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {listing.title}
                </h1>
                {listing.status !== 'active' && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    listing.status === 'sold'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {listing.status}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-umich-blue mb-6">
                ${Number(listing.price).toFixed(2)}
              </p>

              {listing.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>
              )}

              <div className="mt-auto space-y-3">
                {isOwner ? (
                  <>
                    {listing.status === 'active' && (
                      <button
                        onClick={() => handleUpdateStatus('sold')}
                        disabled={actionLoading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        Mark as Sold
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus('deleted')}
                      disabled={actionLoading}
                      className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      Delete Listing
                    </button>
                  </>
                ) : (
                  listing.status === 'active' && (
                    <button
                      onClick={handleMessageSeller}
                      disabled={actionLoading}
                      className="w-full py-3 bg-umich-blue text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors font-medium text-lg"
                    >
                      {actionLoading ? 'Starting chat...' : 'Message Seller'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
