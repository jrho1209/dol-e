import { ChatMessage as ChatMessageType } from '@/lib/types';
import PlaceCard from './PlaceCard';

interface ChatMessageProps {
  message: ChatMessageType;
  savedPlaceIds?: Set<string>;
  onSaveToggle?: (placeId: string, isSaved: boolean) => void;
}

export default function ChatMessage({ message, savedPlaceIds, onSaveToggle }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Debug logging
  if (!isUser && message.places) {
    console.log('Places data:', message.places);
  }

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
        </div>
      </div>
    </div>
  );
}
