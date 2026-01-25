'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Conversation {
  _id: string;
  title: string;
  updatedAt: Date;
  messages: any[];
}

interface ChatSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string | null) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
  refreshKey?: number; // To force refresh
}

export default function ChatSidebar({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  isOpen,
  onToggle,
  refreshKey,
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session, refreshKey]); // Add refreshKey to dependencies

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 대화를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Update local state immediately
        setConversations(prev => prev.filter(c => c._id !== conversationId));
        
        // If deleted conversation was active, start new chat
        if (currentConversationId === conversationId) {
          onNewChat();
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to delete:', errorData);
        alert('대화 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('대화 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } w-64 lg:w-72`}
      >
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all shadow-md font-semibold"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8 px-4">
                아직 대화가 없습니다.
                <br />
                새 대화를 시작해보세요!
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    onClick={() => onSelectConversation(conversation._id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      currentConversationId === conversation._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(conversation.updatedAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.messages.length}개 메시지
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(conversation._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                        title="삭제"
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
        />
      )}
    </>
  );
}
