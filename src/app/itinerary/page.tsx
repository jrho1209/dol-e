'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Itinerary as ItineraryType } from '@/lib/types';
import Link from 'next/link';

export default function ItineraryPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<ItineraryType[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchItineraries();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && itineraries.length > 0) {
      const itinerary = itineraries.find(it => it._id === id);
      if (itinerary) {
        setSelectedItinerary(itinerary);
      }
    } else if (itineraries.length > 0 && !selectedItinerary) {
      setSelectedItinerary(itineraries[0]);
    }
  }, [searchParams, itineraries]);

  const fetchItineraries = async () => {
    try {
      const response = await fetch('/api/itinerary');
      if (response.ok) {
        const data = await response.json();
        setItineraries(data.itineraries);
      }
    } catch (error) {
      console.error('Failed to fetch itineraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      const response = await fetch(`/api/itinerary?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItineraries(itineraries.filter(it => it._id !== id));
        if (selectedItinerary?._id === id) {
          setSelectedItinerary(itineraries[0] || null);
        }
      }
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your itineraries
          </h1>
          <Link
            href="/login"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No itineraries yet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first travel itinerary by asking the chat assistant to plan a trip for you!
          </p>
          <Link
            href="/chat"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg"
          >
            Go to Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Itineraries
          </h1>
          <Link
            href="/chat"
            className="text-blue-500 hover:text-blue-600 font-semibold"
          >
            ← Back to Chat
          </Link>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Itinerary List */}
          <div className="space-y-3">
            {itineraries.map((itinerary) => (
              <div
                key={itinerary._id}
                onClick={() => setSelectedItinerary(itinerary)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedItinerary?._id === itinerary._id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                }`}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {itinerary.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {itinerary.totalDays} days
                </p>
                {itinerary.createdAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(itinerary.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Itinerary Detail */}
          {selectedItinerary && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedItinerary.title}
                  </h2>
                  {selectedItinerary.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedItinerary.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>📅 {selectedItinerary.totalDays} days</span>
                    {selectedItinerary.budget && (
                      <span>
                        💰 ₩{selectedItinerary.budget.total.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(selectedItinerary._id!)}
                  className="text-red-500 hover:text-red-600 font-semibold"
                >
                  Delete
                </button>
              </div>

              {/* Days */}
              <div className="space-y-6">
                {selectedItinerary.days.map((day) => (
                  <div key={day.day} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      {day.title || `Day ${day.day}`}
                    </h3>

                    {/* Timeline */}
                    <div className="space-y-4">
                      {day.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="flex-shrink-0 w-16 text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {item.place?.name_en || 'Place'}
                              </h4>
                              {item.place && (
                                <>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {item.place.description_en}
                                  </p>
                                  <div className="flex gap-4 text-xs text-gray-500">
                                    <span>⏱️ {item.duration} min</span>
                                    {item.place.category && (
                                      <span>📍 {item.place.category}</span>
                                    )}
                                  </div>
                                </>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                  💡 {item.notes}
                                </p>
                              )}
                              {item.transportation && idx < day.items.length - 1 && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500">
                                  🚇 {item.transportation.method} • {item.transportation.duration} min
                                  {item.transportation.cost && ` • ₩${item.transportation.cost.toLocaleString()}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
