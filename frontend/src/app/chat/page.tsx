'use client';

import { useState } from 'react';
import { Menu, Sun, Moon, Brain, Sparkles } from 'lucide-react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { ChatInput } from '@/components/chat/ChatInput';
import { WalletConnect } from '@/components/chat/WalletConnect';
import { WebhookDebugTool } from '@/components/chat/WebhookDebugTool';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useMutation } from '@tanstack/react-query';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import { useAuth } from '@/lib/hooks/useAuth';

// Import Sei constants
import { SEI_CONSTANTS } from '@/lib/constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
}

const suggestedPrompts = [
  'Explain quantum computing applications in cryptography',
  'What are the latest developments in gene therapy?',
  'How can blockchain improve scientific publishing?',
  'Analyze the environmental impact of renewable energy'
];

export default function ChatPage() {
  usePageTitle('AI Research Chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | undefined>(undefined);
  const [input, setInput] = useState('');
  const { isDemoMode, user } = useAuth();
  const [isShowingSpinner, setIsShowingSpinner] = useState(false);
  const [webhookDebugData, setWebhookDebugData] = useState({
    key: SEI_CONSTANTS.DEFAULT_WEBHOOK_DEBUG_DATA?.key || 'form-id',
    value: SEI_CONSTANTS.DEFAULT_WEBHOOK_DEBUG_DATA?.value || 'chat',
    enabled: SEI_CONSTANTS.DEFAULT_WEBHOOK_DEBUG_DATA?.enabled || false
  });

  const { primaryWallet } = useDynamicContext();
  const selectedChat = chats.find((c) => c?.id === selectedChatId);

  // Webhook mutation
  const webhookMutation = useMutation({
    mutationFn: async ({ message, address, username }: { message: string; address?: string; username: string }) => {
      const startTime = Date.now();

      // Build the request body
      const requestBody: Record<string, string | undefined> = {
        message,
        address,
        username,
        'form-id': 'chat' // Add form-id for n8n routing
      };

      // Add dynamic key-value pair if enabled (but don't override form-id)
      if (webhookDebugData.enabled && webhookDebugData.key.trim() && webhookDebugData.key !== 'form-id') {
        requestBody[webhookDebugData.key] = webhookDebugData.value;
      }

      // Ensure form-id is always present and correct
      requestBody['form-id'] = 'chat';

      console.log('Final webhook request body:', requestBody);
      console.log('Webhook debug data:', webhookDebugData);
      console.log('Webhook URL:', SEI_CONSTANTS.WEBHOOK_URL);

      const response = await fetch(SEI_CONSTANTS.WEBHOOK_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure minimum 2 second delay
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      return data;
    },
    onMutate: () => {
      setIsShowingSpinner(true);
    },
    onSuccess: (data) => {
      setIsShowingSpinner(false);

      // Add assistant response
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: 'assistant' as const,
                    content: data.response || data.message || JSON.stringify(data)
                  }
                ]
              }
            : chat
        )
      );
    },
    onError: (error) => {
      setIsShowingSpinner(false);
      console.error('Error calling webhook:', error);

      // Add error message
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    role: 'assistant' as const,
                    content: 'Sorry, I encountered an error while processing your request. Please try again later.'
                  }
                ]
              }
            : chat
        )
      );
    }
  });

  // Add a new chat
  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: 'New Research Chat',
      messages: []
    };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
    setSidebarOpen(false);
  };

  // Select a chat
  const handleSelectChat = (id: number) => {
    setSelectedChatId(id);
    setSidebarOpen(false);
  };

  // Send a message
  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // If no chat exists or no chat is selected, create a new one
    if (!selectedChat || chats.length === 0) {
      const newChat: Chat = {
        id: Date.now(),
        title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
        messages: [{ role: 'user' as const, content: userMessage }]
      };
      setChats([newChat]);
      setSelectedChatId(newChat.id);
    } else {
      // Add user message to existing chat
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                title:
                  chat.messages.length === 0
                    ? userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
                    : chat.title,
                messages: [...chat.messages, { role: 'user' as const, content: userMessage }]
              }
            : chat
        )
      );
    }

    // Call the webhook using mutation
    webhookMutation.mutate({
      message: userMessage,
      address: primaryWallet?.address,
      username: isDemoMode ? 'demoUser' : user?.username || 'user'
    });
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-screen flex header-spacer-lg">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        selectedChatId={selectedChatId || 0}
        onSelect={handleSelectChat}
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-20 left-4 z-40 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Main Chat Area */}
      <main className="flex-1 ml-0 md:ml-[280px] flex flex-col h-[calc(100vh-5rem)]">
        {/* Messages or Welcome */}
        {!selectedChat || selectedChat.messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-2xl">
              {/* Welcome Header */}
              <div className="mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#e9407a] to-[#ff8a00] flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">What would you like to research today?</h1>
                <p className="text-gray-400 text-lg">
                  Ask me anything about science, technology, or research. I&apos;m here to help you explore and discover.
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="p-4 text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 group backdrop-blur-sm"
                  >
                    <div className="text-gray-300 group-hover:text-white text-sm">{prompt}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input at bottom */}
            <div className="w-full">
              <ChatInput
                input={input}
                setInput={setInput}
                onSend={handleSend}
                showSendButton={false}
                showTopBorder={false}
              />
            </div>
          </div>
        ) : (
          <>
            <ChatMessages messages={selectedChat.messages} isLoading={isShowingSpinner} />
            <ChatInput input={input} setInput={setInput} onSend={handleSend} />
          </>
        )}
      </main>

      {/* Webhook Debug Tool */}
      {SEI_CONSTANTS.USE_WEBHOOK_TOOL && <WebhookDebugTool onDataChange={setWebhookDebugData} />}
    </div>
  );
}
