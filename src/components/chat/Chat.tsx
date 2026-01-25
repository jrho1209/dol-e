'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';
import { ChatMessage as ChatMessageType } from '@/lib/types';

const promptExamples = [
  "Recommend authentic Korean restaurants near Daejeon Station",
  "Find cozy cafes with good WiFi in Dunsan-dong",
  "Plan a 3-day trip to Daejeon with local food and attractions",
  "Create a 2-day itinerary focusing on cultural sites and cafes"
];

const initialMessage: ChatMessageType = {
  role: 'assistant',
  content: "Hello! I'm your local guide to Daejeon. I can help you discover amazing restaurants, cafes, accommodations, and attractions in the city. What brings you to Daejeon, or what would you like to explore?",
  timestamp: new Date(),
};

export default function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessageType[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0); // Force sidebar refresh
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if this is the first interaction (only initial assistant message)
  const isFirstInteraction = messages.length === 1 && messages[0].role === 'assistant';

  // Fetch saved favorites
  useEffect(() => {
    if (session) {
      fetchFavorites();
    }
  }, [session]);

  // Auto-save conversation when messages change
  useEffect(() => {
    if (session && messages.length > 1) {
      saveConversation();
    }
  }, [messages, session]);

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation._id);
        
        // Clean up messages to filter out invalid places
        const cleanedMessages = data.conversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          places: msg.places ? msg.places.filter((p: any) => p && p.id) : undefined,
        }));
        
        setMessages(cleanedMessages);
        setIsSidebarOpen(false); // Close sidebar on mobile after selection
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const saveConversation = async () => {
    try {
      // Generate title from first user message
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage 
        ? firstUserMessage.content.substring(0, 50) 
        : 'New Conversation';

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          messages,
          title,
        }),
      });
      const data = await response.json();
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        // Refresh sidebar to show new conversation
        setSidebarKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([initialMessage]);
    setConversationId(null);
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleSelectConversation = (id: string | null) => {
    if (id) {
      loadConversation(id);
    } else {
      startNewConversation();
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const ids = new Set<string>(
          data.favorites
            .filter((f: any) => f && f.place && f.place.id)
            .map((f: any) => f.place.id as string)
        );
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
      
      // Filter out any null/undefined places
      const validPlaces = (data.places || []).filter((p: any) => p && p.id);
      
      console.log('Valid places after filtering:', validPlaces.length); // Debug log
      
      // Add assistant message with structured data
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.text || "I'm sorry, I couldn't generate a response.",
          places: validPlaces,
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
    <div className="flex h-full">
      {/* Sidebar */}
      {session && (
        <ChatSidebar
          key={sidebarKey}
          currentConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={startNewConversation}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          refreshKey={sidebarKey}
        />
      )}

      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 bg-gray-50 dark:bg-black transition-all duration-300 ${session ? 'lg:ml-72' : ''}`}>
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
    </div>
  );
}
