import { UIMessage } from 'ai';
import PlaceCard from './PlaceCard';
import { useRouter } from 'next/navigation';
import { Place, Itinerary } from '@/lib/types';

interface ChatMessageProps {
  message: UIMessage;
  savedPlaceIds?: Set<string>;
  onSaveToggle?: (placeId: string, isSaved: boolean) => void;
}

export default function ChatMessage({ message, savedPlaceIds, onSaveToggle }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const router = useRouter();

  // Extract text content from parts
  const textContent = message.parts
    .filter((p) => p.type === 'text')
    .map((p) => ('text' in p ? p.text : ''))
    .join('');

  // Extract tool results from static tool parts (type: 'tool-{name}')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allParts = message.parts as any[];

  const recommendPart = allParts.find(
    (p) => p.type === 'tool-recommendPlaces' && p.state === 'output-available'
  );
  const places: Place[] = (recommendPart?.output?.places ?? []).filter(
    (p: Place) => p && p.id
  );

  const itineraryPart = allParts.find(
    (p) => p.type === 'tool-createItinerary' && p.state === 'output-available'
  );
  const itinerary: Itinerary | undefined = itineraryPart?.output?.itinerary;

  const handleSaveItinerary = async () => {
    if (!itinerary) return;
    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itinerary),
      });
      if (response.ok) {
        const data = await response.json();
        router.push(`/itinerary?id=${data.itinerary._id}`);
      } else {
        alert('Please sign in to save your itinerary');
      }
    } catch {
      alert('Failed to save itinerary');
    }
  };

  // Don't render messages with no displayable content (e.g. intermediate tool steps)
  if (!textContent && places.length === 0 && !itinerary) return null;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 max-w-[85%]`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-white'
          }`}
        >
          <span className="font-bold text-lg">{isUser ? 'U' : 'D'}</span>
        </div>

        {/* Message Content */}
        <div className="flex-1">
          {/* Name Label */}
          <div
            className={`text-xs font-semibold mb-1 ${
              isUser ? 'text-right text-blue-600 dark:text-blue-400' : 'text-left text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {isUser ? 'You' : 'DOL-E'}
          </div>

          {/* Text bubble — only render if there's text */}
          {textContent && (
            <div
              className={`rounded-2xl px-4 py-3 ${
                isUser
                  ? 'bg-blue-500 text-white drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{textContent}</div>
            </div>
          )}

          {/* Place Cards */}
          {!isUser && places.length > 0 && (
            <div className="mt-4 space-y-3">
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isSaved={savedPlaceIds?.has(place.id)}
                  onSaveToggle={onSaveToggle}
                />
              ))}
            </div>
          )}

          {/* Itinerary Preview */}
          {!isUser && itinerary && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{itinerary.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {itinerary.totalDays} days •{' '}
                    {itinerary.days.reduce((sum, day) => sum + day.items.length, 0)} activities
                  </p>
                </div>
                <span className="text-2xl">🗺️</span>
              </div>

              {itinerary.days[0] && (
                <div className="mb-3 text-sm">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {itinerary.days[0].title}
                  </p>
                  <div className="space-y-1">
                    {itinerary.days[0].items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span className="text-xs">{item.time}</span>
                        <span>•</span>
                        <span>{item.place?.name_en}</span>
                      </div>
                    ))}
                    {itinerary.days[0].items.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{itinerary.days[0].items.length - 3} more activities
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveItinerary}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
