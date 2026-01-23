import { ChatMessage as ChatMessageType } from '@/lib/types';
import PlaceCard from './PlaceCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ChatMessageProps {
  message: ChatMessageType;
  savedPlaceIds?: Set<string>;
  onSaveToggle?: (placeId: string, isSaved: boolean) => void;
}

export default function ChatMessage({ message, savedPlaceIds, onSaveToggle }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const router = useRouter();

  // Debug logging
  if (!isUser && message.places) {
    console.log('Places data:', message.places);
  }

  const handleSaveItinerary = async () => {
    if (!message.itinerary) return;

    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.itinerary),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/itinerary?id=${data.itinerary._id}`);
      } else {
        alert('Please sign in to save your itinerary');
      }
    } catch (error) {
      console.error('Failed to save itinerary:', error);
      alert('Failed to save itinerary');
    }
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[85%]`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white'
        }`}>
          <span className="font-bold text-lg">
            {isUser ? 'U' : 'D'}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex-1">
          {/* Name Label */}
          <div className={`text-xs font-semibold mb-1 ${
            isUser ? 'text-right text-blue-600 dark:text-blue-400' : 'text-left text-yellow-600 dark:text-yellow-400'
          }`}>
            {isUser ? 'You' : 'DOL-E'}
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-500 text-white drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
            }`}
          >
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            {message.timestamp && (
              <div
                className={`text-xs mt-1 ${
                  isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>

          {/* Place Cards - Only for assistant messages */}
          {!isUser && message.places && message.places.length > 0 && (
            <div className="mt-4 space-y-3">
              {message.places.map((place) => (
                <PlaceCard 
                  key={place.id} 
                  place={place}
                  isSaved={savedPlaceIds?.has(place.id)}
                  onSaveToggle={onSaveToggle}
                />
              ))}
            </div>
          )}

          {/* Itinerary Preview - Only for assistant messages with itinerary */}
          {!isUser && message.itinerary && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    {message.itinerary.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {message.itinerary.totalDays} days • {message.itinerary.days.reduce((sum, day) => sum + day.items.length, 0)} activities
                  </p>
                </div>
                <span className="text-2xl">🗺️</span>
              </div>

              {/* Quick preview of first day */}
              {message.itinerary.days[0] && (
                <div className="mb-3 text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {message.itinerary.days[0].title}
                  </p>
                  <div className="space-y-1">
                    {message.itinerary.days[0].items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-xs">{item.time}</span>
                        <span>•</span>
                        <span>{item.place?.name_en}</span>
                      </div>
                    ))}
                    {message.itinerary.days[0].items.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{message.itinerary.days[0].items.length - 3} more activities
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveItinerary}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                View Full Itinerary & Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
