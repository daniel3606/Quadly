'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/useUser';
import { Header } from '@/components/Header';
import { DotPattern } from '@/components/ui/dot-pattern';

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  created_at: string;
}

export default function MarketplacePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    fetchListings();
  }, [userLoading]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_marketplace_listings', {
        p_status: 'active',
        p_limit: 50,
        p_offset: 0,
      });
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
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

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      <DotPattern className="opacity-70" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header />

        <div className="mt-8 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Buy and sell items with your campus community
            </p>
          </div>
          <Link
            href="/marketplace/new"
            className="px-5 py-2.5 bg-umich-blue text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
          >
            + Sell Item
          </Link>
        </div>

        <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8">
          {listings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🛍️</p>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No listings yet</p>
              <p className="text-gray-400 dark:text-gray-500 mt-1">Be the first to sell something!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-umich-blue transition-colors">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-umich-blue mt-1">
                      ${Number(listing.price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
