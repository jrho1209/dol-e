'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Place {
  name: string;
  category: string;
  time: string;
  spending?: number;
  prompt?: string;
  conversation?: string;
}

interface DiaryDay {
  date: string;
  places: Place[];
}

interface TravelDiary {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  days: DiaryDay[];
  totalSpending: number;
  createdAt: string;
}

export default function DiaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diaries, setDiaries] = useState<TravelDiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDiaries();
    }
  }, [session]);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      // 실제로는 API 호출, 지금은 목 데이터
      const mockDiaries: TravelDiary[] = [
        {
          _id: '1',
          title: '대전 2박3일 여행',
          startDate: '2026-01-25',
          endDate: '2026-01-27',
          totalDays: 3,
          totalSpending: 285000,
          createdAt: '2026-01-27T10:00:00Z',
          days: [
            {
              date: '2026-01-25',
              places: [
                {
                  name: '성심당',
                  category: 'bakery',
                  time: '10:30',
                  spending: 25000,
                  prompt: '대전에서 꼭 가봐야할 빵집 추천해줘',
                  conversation: 'AI: 대전 하면 성심당이죠! 튀김소보로와 부추빵이 시그니처입니다...'
                },
                {
                  name: '은행동 카페거리',
                  category: 'cafe',
                  time: '14:00',
                  spending: 18000,
                  prompt: '점심 먹고 커피 마실만한 조용한 카페',
                  conversation: 'AI: 은행동 카페거리는 힙한 로컬 카페들이 모여있어요...'
                },
                {
                  name: '대청호',
                  category: 'nature',
                  time: '17:00',
                  spending: 0,
                  prompt: '저녁 전에 가볼만한 자연 경치 좋은 곳',
                }
              ]
            },
            {
              date: '2026-01-26',
              places: [
                {
                  name: '대전 엑스포 과학공원',
                  category: 'attraction',
                  time: '10:00',
                  spending: 15000,
                  prompt: '대전에서 가족과 함께 가볼만한 관광지',
                },
                {
                  name: '중앙시장 칼국수',
                  category: 'restaurant',
                  time: '13:00',
                  spending: 32000,
                  prompt: '현지인들이 가는 점심 맛집',
                },
              ]
            }
          ]
        },
        {
          _id: '2',
          title: '대전 당일치기',
          startDate: '2026-01-20',
          endDate: '2026-01-20',
          totalDays: 1,
          totalSpending: 65000,
          createdAt: '2026-01-20T15:00:00Z',
          days: [
            {
              date: '2026-01-20',
              places: [
                {
                  name: '계룡산 국립공원',
                  category: 'nature',
                  time: '09:00',
                  spending: 5000,
                },
                {
                  name: '유성온천',
                  category: 'spa',
                  time: '15:00',
                  spending: 45000,
                },
              ]
            }
          ]
        }
      ];
      
      setDiaries(mockDiaries);
    } catch (error) {
      console.error('Error fetching diaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      bakery: '🥐',
      cafe: '☕',
      restaurant: '🍽️',
      nature: '🌲',
      attraction: '🎡',
      spa: '♨️',
      shopping: '🛍️',
    };
    return icons[category] || '📍';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      bakery: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      cafe: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      restaurant: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      nature: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      attraction: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      spa: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      shopping: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-24 pb-20 px-4 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-quicksand)' }}>
            📔 My Travel Diary
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your Daejeon adventures, powered by AI conversations
          </p>
        </div>

        {diaries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✈️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No travel diaries yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start chatting with DOL-E to plan your Daejeon trip!
            </p>
            <Link
              href="/chat"
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Start Planning
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {diaries.map((diary) => (
              <div
                key={diary._id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800"
              >
                {/* Diary Header */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{diary.title}</h2>
                      <div className="flex items-center gap-4 text-yellow-50">
                        <span className="flex items-center gap-1">
                          📅 {new Date(diary.startDate).toLocaleDateString('ko-KR')}
                          {diary.totalDays > 1 && ` - ${new Date(diary.endDate).toLocaleDateString('ko-KR')}`}
                        </span>
                        <span>•</span>
                        <span>{diary.totalDays}일</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">₩{diary.totalSpending.toLocaleString()}</div>
                      <div className="text-yellow-50 text-sm">Total Spending</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-6">
                  {diary.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="mb-8 last:mb-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold">
                          Day {dayIndex + 1}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {new Date(day.date).toLocaleDateString('ko-KR', { 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </div>
                      </div>

                      <div className="ml-8 space-y-4">
                        {day.places.map((place, placeIndex) => (
                          <div
                            key={placeIndex}
                            className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0"
                          >
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-0 w-4 h-4 bg-yellow-500 rounded-full -ml-[9px] ring-4 ring-gray-50 dark:ring-black"></div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{getCategoryIcon(place.category)}</span>
                                  <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                      {place.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span>🕐 {place.time}</span>
                                      {place.spending !== undefined && place.spending > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>💰 ₩{place.spending.toLocaleString()}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(place.category)}`}>
                                  {place.category}
                                </span>
                              </div>

                              {/* AI Prompt Section */}
                              {place.prompt && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <button
                                    onClick={() => setSelectedPrompt(selectedPrompt === place.prompt ? null : place.prompt)}
                                    className="w-full text-left"
                                  >
                                    <div className="flex items-start gap-2 text-sm">
                                      <span className="text-blue-500 flex-shrink-0">💬</span>
                                      <div className="flex-1">
                                        <span className="text-gray-600 dark:text-gray-400 italic">
                                          "{place.prompt}"
                                        </span>
                                        {place.conversation && selectedPrompt === place.prompt && (
                                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-gray-700 dark:text-gray-300">
                                            {place.conversation}
                                          </div>
                                        )}
                                      </div>
                                      {place.conversation && (
                                        <svg 
                                          className={`w-4 h-4 text-gray-400 transition-transform ${selectedPrompt === place.prompt ? 'rotate-180' : ''}`} 
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      )}
                                    </div>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Stats */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      📍 {diary.days.reduce((sum, day) => sum + day.places.length, 0)} places visited
                    </span>
                    <span>
                      Created {new Date(diary.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create New Diary CTA */}
        {diaries.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Plan New Trip
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
