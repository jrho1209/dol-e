'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ChatMessage as ChatMessageType } from '@/lib/types';

const promptExamples = [
  "Recommend authentic Korean restaurants near Daejeon Station",
  "Find cozy cafes with good WiFi in Dunsan-dong",
  "Plan a 3-day trip to Daejeon with local food and attractions",
  "Create a 2-day itinerary focusing on cultural sites and cafes"
];

export default function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your local guide to Daejeon. I can help you discover amazing restaurants, cafes, accommodations, and attractions in the city. What brings you to Daejeon, or what would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if this is the first interaction (only initial assistant message)
  const isFirstInteraction = messages.length === 1 && messages[0].role === 'assistant';

  // Fetch saved favorites
  useEffect(() => {
    if (session) {
      fetchFavorites();
      loadConversation();
    }
  }, [session]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (session && messages.length > 1) {
      saveConversation();
    }
  }, [messages, session]);

  const loadConversation = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        if (data.conversations.length > 0) {
          const latestConversation = data.conversations[0];
          setConversationId(latestConversation._id);
          setMessages(latestConversation.messages);
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const saveConversation = async () => {
    try {
      await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messages,
        }),
      }).then(res => res.json()).then(data => {
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([{
      role: 'assistant',
      content: "Hello! I'm your local guide to Daejeon. I can help you discover amazing restaurants, cafes, accommodations, and attractions in the city. What brings you to Daejeon, or what would you like to explore?",
      timestamp: new Date(),
    }]);
    setConversationId(null);
  };

  const fetchFavorites = async () {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const ids = new Set<string>(data.favorites.map((f: any) => f.place.id as string));
        console.log('Fetched favorite IDs:', Array.from(ids));
        setSavedPlaceIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const handleSaveToggle = (placeId: string, isSaved: boolean) => {
    console.log('handleSaveToggle called:', placeId, isSaved);
    setSavedPlaceIds((prev) => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.add(placeId);
      } else {
        newSet.delete(placeId);
      }
      console.log('Updated favorite IDs:', Array.from(newSet));
      return newSet;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to get response');
      }

      // Parse JSON response
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      // Add assistant message with structured data
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.text || "I'm sorry, I couldn't generate a response.",
          places: data.places || [],
          itinerary: data.itinerary || undefined,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-quicksand)' }}>
              DOL-E - Daejeon Local Guide
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Discover authentic local experiences in Daejeon
            </p>
          </div>
          {messages.length > 1 && (
            <button
              onClick={startNewConversation}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage 
              key={index} 
              message={message}
              savedPlaceIds={savedPlaceIds}
              onSaveToggle={handleSaveToggle}
            />
          ))}
          
          {/* Prompt Examples - Show only on first interaction */}
          {isFirstInteraction && !isLoading && (
            <div className="mt-8 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Try one of these:
              </p>
              <div className="grid gap-3">
                {promptExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(example)}
                    className="w-full p-4 text-left bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {example}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-3xl w-full mx-auto">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
