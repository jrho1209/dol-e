'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
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

function PlaceCard({ place, isDragging }: { place: Place; isDragging?: boolean }) {
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      restaurant: '🍽️',
      cafe: '☕',
      bakery: '🥐',
      attraction: '🎡',
      nature: '🌲',
      shopping: '🛍️',
      culture: '🎨',
    };
    return icons[category] || '📍';
  };

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
          <span className="text-lg">{getCategoryIcon(place.category)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{place.name}</h3>
              {place.rating && (
                <span className="text-xs text-yellow-600 flex-shrink-0">⭐{place.rating}</span>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">{place.description}</p>
            <div className="flex items-center gap-2 text-xs">
              {place.estimatedDuration && (
                <span className="text-gray-500 dark:text-gray-500">
                  ⏱️ {place.estimatedDuration}
                </span>
              )}
            </div>
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
                  <span className="text-blue-500 dark:text-blue-400 flex-shrink-0">💬</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                    "{item.place.aiPrompt}"
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
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                ({item.place.estimatedDuration} recommended)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropZone({ time }: { time: string }) {
  const { setNodeRef, isOver } = useSortable({
    id: `drop-zone-${time}`,
  });

  return (
    <div ref={setNodeRef} className="mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-24 pt-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {time}
          </div>
        </div>
        <div className="flex-1">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItineraryContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [placesHeight, setPlacesHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  
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

  // Timeline state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  
  const calculateNextTime = () => {
    if (scheduleItems.length === 0) return '09:00';
    
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
        
        setScheduleItems(prev => [...prev, newItem]);
      }
    }

    setActivePlace(null);
  };

  const handleDurationChange = (itemId: string, change: number) => {
    setScheduleItems(prev =>
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
    setScheduleItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = { role: 'user', content: input };
    const currentInput = input;
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      // 실제 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      console.log('API Response:', data);

      let aiResponseContent = '';
      let newPlaces: Place[] = [];

      // Check if response has places (new format)
      if (data.places && Array.isArray(data.places) && data.places.length > 0) {
        // Extract places from response
        newPlaces = data.places.map((place: any, index: number) => ({
          id: place.id || place._id || `place-${Date.now()}-${index}`,
          name: place.name_en || place.name || 'Unknown Place',
          category: place.category || 'restaurant',
          description: place.description_en || place.description || '',
          estimatedDuration: estimateDuration(place.category),
          aiPrompt: currentInput,
          rating: place.rating,
          image: place.specialty_images?.[0] || place.images?.[0],
        }));

        aiResponseContent = data.text || `찾았습니다! ${newPlaces.length}개의 장소를 추천드립니다. 왼쪽에서 원하는 장소를 드래그해서 시간표에 배치해보세요.`;
      } 
      // Check for recommendations (old format, for backward compatibility)
      else if (data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        newPlaces = data.recommendations.map((rec: any, index: number) => ({
          id: rec.place?.id || `place-${Date.now()}-${index}`,
          name: rec.place?.name_en || rec.place?.name || 'Unknown Place',
          category: rec.place?.category || 'restaurant',
          description: rec.place?.description_en || rec.place?.description || '',
          estimatedDuration: estimateDuration(rec.place?.category),
          aiPrompt: currentInput,
          rating: rec.place?.rating,
          image: rec.place?.specialty_images?.[0] || rec.place?.images?.[0],
        }));

        aiResponseContent = data.message || data.text || `찾았습니다! ${newPlaces.length}개의 장소를 추천드립니다. 왼쪽에서 원하는 장소를 드래그해서 시간표에 배치해보세요.`;
      } 
      // Just text message (no places found or general response)
      else if (data.text || data.message) {
        aiResponseContent = data.text || data.message;
      } 
      // Error case
      else if (data.error) {
        aiResponseContent = '죄송합니다. 일시적인 오류가 발생했습니다.';
      }
      // Fallback
      else {
        aiResponseContent = '응답을 받았지만 장소 정보를 찾을 수 없습니다. 다른 질문을 시도해보세요.';
      }

      console.log('Extracted places:', newPlaces);
      console.log('AI message:', aiResponseContent);

      const aiResponse = {
        role: 'assistant',
        content: aiResponseContent,
      };
      setMessages(prev => [...prev, aiResponse]);

      // Replace places with new recommendations (not append)
      if (newPlaces.length > 0) {
        setRecommendedPlaces(newPlaces);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <main className="h-screen pt-16 bg-gray-50 dark:bg-black overflow-hidden">
        <div className="h-full flex">
          {/* Left Panel - AI Chat & Recommended Places */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                🤖 AI Travel Planner
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
                  setIsResizing(true);
                  const startY = e.clientY;
                  const startHeight = placesHeight;

                  const handleMouseMove = (e: MouseEvent) => {
                    const delta = e.clientY - startY;
                    const newHeight = Math.max(150, Math.min(600, startHeight - delta));
                    setPlacesHeight(newHeight);
                  };

                  const handleMouseUp = () => {
                    setIsResizing(false);
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
                    <span>📍</span>
                    <span>Recommended Places</span>
                    <span className="text-xs text-gray-500">({recommendedPlaces.length})</span>
                  </h3>
                  <span className="text-xs text-gray-400">⇕ Drag to resize</span>
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
                <p className="text-xs text-gray-500 dark:text-gray-600">
                  💡 Drag places to the timeline on the right →
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
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📅 Your Itinerary
                </h2>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                  Save Plan
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Day 1 - {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              </p>
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
                <DropZone time={calculateNextTime()} />
              </SortableContext>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePlace ? <PlaceCard place={activePlace} /> : null}
        </DragOverlay>
      </main>
    </DndContext>
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
