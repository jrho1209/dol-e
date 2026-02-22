'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  image?: string;
  rating?: number;
  estimatedDuration?: string;
  aiPrompt?: string;
}

interface ScheduleItem {
  id: string;
  startTime: string;
  place: Place;
  duration: number;
}

function CategoryIcon({ category }: { category: string }) {
  const cls = "w-4 h-4 text-yellow-500 flex-shrink-0";
  switch (category) {
    case 'restaurant':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'cafe':
    case 'bakery':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" /></svg>;
    case 'attraction':
    case 'culture':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
    case 'nature':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>;
    case 'shopping':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
    default:
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
  }
}

function PlaceCard({ place, isDragging }: { place: Place; isDragging?: boolean }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-move border border-gray-200 dark:border-gray-700 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {place.image && (
        <div className="h-20 overflow-hidden">
          <img
            src={place.image}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-start gap-2">
          <CategoryIcon category={place.category} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{place.name}</h3>
              {place.rating && (
                <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600 flex-shrink-0">
                  <svg className="w-3 h-3 fill-yellow-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {place.rating}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">{place.description}</p>
            {place.estimatedDuration && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {place.estimatedDuration}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleItemCard({ item, onDurationChange, onRemove }: {
  item: ScheduleItem;
  onDurationChange: (itemId: string, change: number) => void;
  onRemove: (itemId: string) => void;
}) {
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-24 pt-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {item.startTime}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              ↓
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {calculateEndTime(item.startTime, item.duration)}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="relative group">
            <PlaceCard place={item.place} />
            
            {/* AI Prompt Display */}
            {item.place.aiPrompt && (
              <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                    &ldquo;{item.place.aiPrompt}&rdquo;
                  </p>
                </div>
              </div>
            )}
            
            {/* Remove Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRemove(item.id)}
                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-lg"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Duration Controls */}
            <div className="mt-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
              <span className="text-xs text-gray-600 dark:text-gray-400">Duration:</span>
              <button
                onClick={() => onDurationChange(item.id, -0.5)}
                disabled={item.duration <= 0.5}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[60px] text-center">
                {item.duration}h
              </span>
              <button
                onClick={() => onDurationChange(item.id, 0.5)}
                disabled={item.duration >= 4}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
              {item.place.estimatedDuration && (
                <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                  ({item.place.estimatedDuration} recommended)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropZone({ time, onManualAdd }: {
  time: string;
  onManualAdd: (name: string, category: string, time: string) => void;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: `drop-zone-${time}`,
  });
  const [showForm, setShowForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('restaurant');

  const handleAdd = () => {
    if (!manualName.trim()) return;
    onManualAdd(manualName.trim(), manualCategory, time);
    setManualName('');
    setShowForm(false);
  };

  return (
    <div ref={setNodeRef} className="mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-24 pt-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {time}
          </div>
        </div>
        <div className="flex-1">
          {showForm ? (
            <div className="border-2 border-yellow-400 rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Add place manually</span>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Place name (e.g. Sungsimdang)"
                  autoFocus
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="bakery">Bakery</option>
                  <option value="attraction">Attraction</option>
                  <option value="nature">Nature</option>
                  <option value="shopping">Shopping</option>
                  <option value="culture">Culture</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!manualName.trim()}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-semibold transition-all"
                  >
                    Add to Timeline
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isOver
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 scale-105 shadow-lg'
                  : 'border-gray-300 dark:border-gray-700 hover:border-yellow-400 dark:hover:border-yellow-600'
              }`}
            >
              {isOver ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-yellow-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Drop here!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-gray-400 dark:text-gray-600">Drag a place here</span>
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-xs text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 underline mt-1 transition-colors"
                  >
                    or type manually
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TripSetupScreen({ onStart }: { onStart: (setup: { startDate: string; numNights: number; startTime: string }) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [numNights, setNumNights] = useState(2);
  const [startTime, setStartTime] = useState('09:00');

  return (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-black">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 w-full max-w-sm mx-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Plan Your Trip</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Set your travel dates to get started</p>

        <div className="space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Duration</label>
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={() => setNumNights(n => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl flex items-center justify-center transition-all"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{numNights}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1.5">박</span>
                <div className="text-sm text-gray-400 mt-0.5">{numNights + 1}일</div>
              </div>
              <button
                onClick={() => setNumNights(n => Math.min(14, n + 1))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xl flex items-center justify-center transition-all"
              >
                +
              </button>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 7].map(n => (
                <button
                  key={n}
                  onClick={() => setNumNights(n)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    numNights === n
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {n}박
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart({ startDate, numNights, startTime })}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold text-base transition-all"
          >
            Start Planning →
          </button>
        </div>
      </div>
    </div>
  );
}

function ItineraryContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'planner'>('list');
  const [savedItineraries, setSavedItineraries] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [placesHeight, setPlacesHeight] = useState(300);
  
  // AI Chat state
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { 
      role: 'assistant', 
      content: '안녕하세요! 대전 여행 계획을 도와드리겠습니다. 원하는 장소를 물어보시면 RAG 시스템에서 실제 장소 데이터를 찾아드립니다.\n\n예시:\n• "대전에서 유명한 빵집 추천해줘"\n• "점심 먹을 한식당 찾아줘"\n• "은행동 근처 카페 알려줘"'
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Recommended places from AI (initially empty, populated by chat)
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);

  // Trip setup & multi-day timeline state
  const [tripSetup, setTripSetup] = useState<{ startDate: string; numNights: number; startTime: string } | null>(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [daySchedules, setDaySchedules] = useState<ScheduleItem[][]>([[]]);

  // Current day's items (computed)
  const scheduleItems = daySchedules[currentDay] ?? [];

  const updateDaySchedule = (updater: (items: ScheduleItem[]) => ScheduleItem[]) => {
    setDaySchedules(prev => {
      const next = [...prev];
      next[currentDay] = updater(next[currentDay] ?? []);
      return next;
    });
  };

  const getDayDate = (dayIndex: number): string => {
    if (!tripSetup) return '';
    const date = new Date(tripSetup.startDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calculateNextTime = () => {
    if (scheduleItems.length === 0) return tripSetup?.startTime ?? '09:00';

    const lastItem = scheduleItems[scheduleItems.length - 1];
    const [hours, minutes] = lastItem.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + lastItem.duration * 60;
    const nextHours = Math.floor(totalMinutes / 60) % 24;
    const nextMinutes = totalMinutes % 60;
    return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
  };

  const [activePlace, setActivePlace] = useState<Place | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  useEffect(() => {
    if (!session) return;
    setListLoading(true);
    fetch('/api/itinerary')
      .then(res => res.json())
      .then(data => setSavedItineraries(data.itineraries || []))
      .catch(err => console.error('Failed to load itineraries:', err))
      .finally(() => setListLoading(false));
  }, [session]);

  useEffect(() => {
    const itineraryId = searchParams.get('id');
    if (!itineraryId || !session) return;

    setActiveTab('planner');
    setIsLoading(true);
    fetch(`/api/itinerary?id=${itineraryId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.itinerary) return;
        const itinerary = data.itinerary;

        // Flatten all days' items into scheduleItems
        const allItems: ScheduleItem[] = [];
        const uniquePlaces: Place[] = [];
        const seenIds = new Set<string>();

        itinerary.days?.forEach((day: any) => {
          day.items?.forEach((item: any, index: number) => {
            if (!item.place) return;
            const placeId = item.place.id || `place-${day.day}-${index}`;
            const mappedPlace: Place = {
              id: placeId,
              name: item.place.name_en || item.place.name,
              category: item.place.category,
              description: item.place.description_en || item.place.description,
              image: item.place.specialty_images?.[0] || item.place.image_url,
              rating: item.place.rating,
              estimatedDuration: estimateDuration(item.place.category),
            };
            allItems.push({
              id: `item-${day.day}-${index}`,
              startTime: item.time,
              duration: Math.max(0.5, (item.duration || 60) / 60),
              place: mappedPlace,
            });
            if (!seenIds.has(placeId)) {
              seenIds.add(placeId);
              uniquePlaces.push(mappedPlace);
            }
          });
        });

        setDaySchedules([allItems]);
        setCurrentDay(0);
        setTripSetup({ startDate: new Date().toISOString().split('T')[0], numNights: Math.max(0, (itinerary.totalDays || 1) - 1), startTime: '09:00' });
        setRecommendedPlaces(uniquePlaces);
      })
      .catch(err => console.error('Failed to load itinerary:', err))
      .finally(() => setIsLoading(false));
  }, [session, searchParams]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const place = recommendedPlaces.find(p => p.id === active.id);
    if (place) {
      setActivePlace(place);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && over.id.toString().startsWith('drop-zone-')) {
      const place = recommendedPlaces.find(p => p.id === active.id);
      if (place) {
        // Parse estimated duration to hours
        const durationMatch = place.estimatedDuration?.match(/(\d+\.?\d*)/);
        const defaultDuration = durationMatch ? parseFloat(durationMatch[1]) : 1;
        
        const newItem: ScheduleItem = {
          id: `item-${Date.now()}`,
          startTime: calculateNextTime(),
          place,
          duration: defaultDuration
        };
        
        updateDaySchedule(prev => [...prev, newItem]);
      }
    }

    setActivePlace(null);
  };

  const handleDurationChange = (itemId: string, change: number) => {
    updateDaySchedule(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newDuration = Math.max(0.5, Math.min(4, item.duration + change));
          return { ...item, duration: newDuration };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    updateDaySchedule(prev => prev.filter(item => item.id !== itemId));
  };

  const handleManualAdd = (name: string, category: string, startTime: string) => {
    const newItem: ScheduleItem = {
      id: `item-${Date.now()}`,
      startTime,
      place: {
        id: `manual-${Date.now()}`,
        name,
        category,
        description: '',
      },
      duration: 1,
    };
    updateDaySchedule(prev => [...prev, newItem]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/planner-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const newPlaces: Place[] = (data.places ?? []).map((place: any, index: number) => ({
        id: place.id || place._id || `place-${Date.now()}-${index}`,
        name: place.name_en || place.name || 'Unknown Place',
        category: place.category || 'restaurant',
        description: place.description_en || place.description || '',
        estimatedDuration: estimateDuration(place.category),
        aiPrompt: currentInput,
        rating: place.rating,
        image: place.specialty_images?.[0] || place.images?.[0],
      }));

      const aiResponseContent = data.text ||
        (newPlaces.length > 0
          ? `${newPlaces.length}개의 장소를 찾았습니다! 왼쪽에서 드래그해서 시간표에 배치해보세요.`
          : '장소 정보를 찾을 수 없습니다. 다른 질문을 시도해보세요.');

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponseContent }]);
      if (newPlaces.length > 0) setRecommendedPlaces(newPlaces);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenInPlanner = (itinerary: any) => {
    const allItems: ScheduleItem[] = [];
    const uniquePlaces: Place[] = [];
    const seenIds = new Set<string>();

    itinerary.days?.forEach((day: any) => {
      day.items?.forEach((item: any, index: number) => {
        if (!item.place) return;
        const placeId = item.place.id || `place-${day.day}-${index}`;
        const mappedPlace: Place = {
          id: placeId,
          name: item.place.name_en || item.place.name,
          category: item.place.category,
          description: item.place.description_en || item.place.description,
          image: item.place.specialty_images?.[0] || item.place.image_url,
          rating: item.place.rating,
          estimatedDuration: estimateDuration(item.place.category),
        };
        allItems.push({
          id: `item-${day.day}-${index}`,
          startTime: item.time,
          duration: Math.max(0.5, (item.duration || 60) / 60),
          place: mappedPlace,
        });
        if (!seenIds.has(placeId)) {
          seenIds.add(placeId);
          uniquePlaces.push(mappedPlace);
        }
      });
    });

    setDaySchedules([allItems]);
    setCurrentDay(0);
    setTripSetup({ startDate: new Date().toISOString().split('T')[0], numNights: Math.max(0, (itinerary.totalDays || 1) - 1), startTime: '09:00' });
    setRecommendedPlaces(uniquePlaces);
    setActiveTab('planner');
  };

  const handleDeleteItinerary = async (id: string) => {
    try {
      const res = await fetch(`/api/itinerary?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedItineraries(prev => prev.filter((it: any) => it._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
    }
  };

  // Helper function to estimate duration based on category
  const estimateDuration = (category?: string): string => {
    const durations: { [key: string]: string } = {
      restaurant: '1-2시간',
      cafe: '30분-1시간',
      bakery: '30-45분',
      attraction: '1-3시간',
      nature: '2-4시간',
      shopping: '1-2시간',
      culture: '1-2시간',
    };
    return durations[category || 'restaurant'] || '1-2시간';
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pt-16 bg-gray-50 dark:bg-black">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'list'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          My Itineraries
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'planner'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Planner
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">

        {/* My Itineraries Tab */}
        {activeTab === 'list' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Itineraries</h1>
                <button
                  onClick={() => { setDaySchedules([[]]); setCurrentDay(0); setTripSetup(null); setRecommendedPlaces([]); setActiveTab('planner'); }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  + New Plan
                </button>
              </div>

              {listLoading ? (
                <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : savedItineraries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="text-lg font-medium">No saved itineraries yet</p>
                  <p className="text-sm mt-1">Go to the chat to generate a plan!</p>
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Open Planner →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedItineraries.map((it: any) => {
                    const totalPlaces = it.days?.reduce(
                      (sum: number, day: any) => sum + (day.items?.length || 0), 0
                    ) || 0;
                    return (
                      <div
                        key={it._id}
                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate">{it.title}</h3>
                        {it.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{it.description}</p>
                        )}
                        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {it.totalDays} days
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {totalPlaces} places
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {new Date(it.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenInPlanner(it)}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-semibold transition-all"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleDeleteItinerary(it._id)}
                            className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Planner Tab */}
        {activeTab === 'planner' && (tripSetup === null ? (
          <TripSetupScreen onStart={(setup) => {
            setTripSetup(setup);
            setDaySchedules(Array.from({ length: setup.numNights + 1 }, () => []));
            setCurrentDay(0);
          }} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full flex">
              {/* Left Panel - AI Chat & Recommended Places */}
              <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    AI Travel Planner
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ask me about places in Daejeon
                  </p>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Places */}
                <div className="bg-gray-50 dark:bg-gray-800 flex flex-col">
                  {/* Resize Handle */}
                  <div
                    className="h-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-yellow-500 dark:hover:bg-yellow-600 cursor-ns-resize transition-colors"
                    onMouseDown={(e) => {
                      const startY = e.clientY;
                      const startHeight = placesHeight;

                      const handleMouseMove = (e: MouseEvent) => {
                        const delta = e.clientY - startY;
                        const newHeight = Math.max(150, Math.min(600, startHeight - delta));
                        setPlacesHeight(newHeight);
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  />

                  <div className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Recommended Places
                        <span className="text-xs text-gray-500 font-normal">({recommendedPlaces.length})</span>
                      </h3>
                      <span className="text-xs text-gray-400">Drag to resize</span>
                    </div>
                  </div>

                  <div
                    className="overflow-y-auto px-4 pb-2"
                    style={{ height: `${placesHeight}px` }}
                  >
                    <SortableContext items={recommendedPlaces.map(p => p.id)}>
                      <div className="grid grid-cols-2 gap-2">
                        {recommendedPlaces.map(place => (
                          <div key={place.id}>
                            <DraggablePlaceCard place={place} />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </div>

                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Drag places to the timeline on the right
                    </p>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="어떤 장소를 찾으시나요?"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Timeline */}
              <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                {/* Timeline Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Your Itinerary
                    </h2>
                    <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                      Save Plan
                    </button>
                  </div>
                  {/* Day navigator */}
                  {tripSetup && tripSetup.numNights > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
                      {Array.from({ length: tripSetup.numNights + 1 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentDay(i)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                            currentDay === i
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          Day {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Day {currentDay + 1} — {getDayDate(currentDay)}
                    </p>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-gray-400">Start</span>
                      <input
                        type="time"
                        value={tripSetup?.startTime ?? '09:00'}
                        onChange={(e) => setTripSetup(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {scheduleItems.map((item) => (
                    <ScheduleItemCard
                      key={item.id}
                      item={item}
                      onDurationChange={handleDurationChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}

                  {/* Drop Zone for next item */}
                  <SortableContext items={[`drop-zone-${calculateNextTime()}`]}>
                    <DropZone time={calculateNextTime()} onManualAdd={handleManualAdd} />
                  </SortableContext>
                </div>
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activePlace ? <PlaceCard place={activePlace} /> : null}
            </DragOverlay>
          </DndContext>
        ))}

      </div>
    </div>
  );
}

function DraggablePlaceCard({ place }: { place: Place }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: place.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlaceCard place={place} isDragging={isDragging} />
    </div>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItineraryContent />
    </Suspense>
  );
}
