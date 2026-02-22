'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatSidebar from './ChatSidebar';

const GUEST_LIMIT = 3;
const GUEST_USAGE_KEY = 'dole_guest_usage';

const PROMPT_EXAMPLES = [
  "Recommend authentic Korean restaurants in Daejeon",
  "Find cozy cafes with good WiFi in Daejeon",
  "Plan a 3-day trip to Daejeon with local food and attractions",
  "Create a 2-day itinerary focusing on cultural sites and cafes",
];

export default function Chat() {
  const { data: session } = useSession();
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(new Set());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [guestUsageCount, setGuestUsageCount] = useState(0);

  useEffect(() => {
    if (!session) {
      const stored = parseInt(localStorage.getItem(GUEST_USAGE_KEY) ?? '0', 10);
      setGuestUsageCount(stored);
    }
  }, [session]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onFinish: async ({ messages: finishedMessages }) => {
      if (!session) return;
      await saveConversationWith(finishedMessages as UIMessage[], conversationIdRef.current);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const isFirstInteraction = messages.length === 0;

  useEffect(() => {
    if (session) fetchFavorites();
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const ids = new Set<string>(
          data.favorites
            .filter((f: { place?: { id?: string } }) => f?.place?.id)
            .map((f: { place: { id: string } }) => f.place.id)
        );
        setSavedPlaceIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  const handleSaveToggle = (placeId: string, isSaved: boolean) => {
    setSavedPlaceIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.add(placeId) : next.delete(placeId);
      return next;
    });
  };

  const saveConversationWith = async (currentMessages: UIMessage[], currentConvId: string | null) => {
    try {
      const firstUserMessage = currentMessages.find((m) => m.role === 'user');
      const title = firstUserMessage?.parts
        .filter((p) => p.type === 'text')
        .map((p) => ('text' in p ? p.text : ''))
        .join('')
        .substring(0, 50) ?? 'New Conversation';

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: currentConvId, messages: currentMessages, title }),
      });
      const data = await response.json();
      if (data.conversationId && !currentConvId) {
        setConversationId(data.conversationId);
        setSidebarKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation._id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMessages(data.conversation.messages.map((msg: any) => ({
          ...msg,
          id: msg.id ?? crypto.randomUUID(),
        })));
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setIsSidebarOpen(false);
  };

  const handleSelectConversation = (id: string | null) => {
    if (id) loadConversation(id);
    else startNewConversation();
  };

  const handleSend = (content: string) => {
    if (!session) {
      const next = guestUsageCount + 1;
      setGuestUsageCount(next);
      localStorage.setItem(GUEST_USAGE_KEY, String(next));
    }
    sendMessage({ text: content });
  };

  const guestLimitReached = !session && guestUsageCount >= GUEST_LIMIT;

  return (
    <div className="flex h-full">
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

      <div className={`flex flex-col flex-1 bg-gray-50 dark:bg-black transition-all duration-300 ${session ? 'lg:ml-72' : ''}`}>
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-quicksand)' }}>
            DOL-E - Daejeon Local Guide
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Discover authentic local experiences in Daejeon
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-3xl mx-auto">
            {/* Welcome message */}
            {isFirstInteraction && (
              <div className="flex justify-start mb-6">
                <div className="flex flex-row items-start gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500 text-white">
                    <span className="font-bold text-lg">D</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-1 text-left text-yellow-600 dark:text-yellow-400">DOL-E</div>
                    <div className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                      <p className="text-sm leading-relaxed">
                        Hello! I&apos;m your local guide to Daejeon. I can help you discover amazing restaurants, cafes,
                        accommodations, and attractions. What brings you to Daejeon?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                savedPlaceIds={savedPlaceIds}
                onSaveToggle={handleSaveToggle}
              />
            ))}

            {/* Prompt examples */}
            {isFirstInteraction && !isLoading && (
              <div className="mt-8 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">Try one of these:</p>
                <div className="grid gap-3">
                  {PROMPT_EXAMPLES.map((example, index) => (
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

            {/* Loading indicator */}
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

        {/* Input / Guest Gate */}
        <div className="max-w-3xl w-full mx-auto">
          {guestLimitReached ? (
            <div className="mx-4 mb-4 rounded-2xl border-2 border-yellow-400 bg-amber-50 p-5 text-center shadow-md">
              <p className="text-2xl mb-2">🔒</p>
              <p className="font-semibold text-gray-900 mb-1">You&apos;ve used your 3 free messages</p>
              <p className="text-sm text-gray-500 mb-4">Create a free account to keep chatting with DOL-E and save your favorites.</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/signup"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-full font-medium text-sm transition-all"
                >
                  Sign Up — It&apos;s Free
                </Link>
                <Link
                  href="/login"
                  className="border border-gray-300 hover:border-gray-400 text-gray-700 px-5 py-2 rounded-full font-medium text-sm transition-all"
                >
                  Log In
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative">
              {!session && (
                <p className="text-center text-xs mb-1">
                  <span className={`font-medium ${
                    GUEST_LIMIT - guestUsageCount <= 1
                      ? 'text-red-500'
                      : GUEST_LIMIT - guestUsageCount <= 2
                      ? 'text-orange-400'
                      : 'text-gray-400'
                  }`}>
                    {GUEST_LIMIT - guestUsageCount} free message{GUEST_LIMIT - guestUsageCount !== 1 ? 's' : ''} remaining
                  </span>
                </p>
              )}
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
