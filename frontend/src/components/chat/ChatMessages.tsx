import { User, Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export function ChatMessages({ messages, isLoading = false }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1a2035]">
      {messages.map((msg, i) => (
        <div key={i} className={`w-full py-6 px-4 ${msg.role === 'user' ? 'bg-[#1a2035]' : 'bg-[#1f263e]/80'}`}>
          <div className="max-w-4xl mx-auto flex gap-4">
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-[#e9407a] to-[#ff8a00]'
                  : 'bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8]'
              }`}
            >
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium mb-2 ${msg.role === 'user' ? 'text-[#e9407a]' : 'text-[#3b82f6]'}`}>
                {msg.role === 'user' ? 'You' : 'ReSeich AI'}
              </div>
              <div className="text-white leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="w-full py-6 px-4 bg-[#1f263e]/80">
          <div className="max-w-4xl mx-auto flex gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8]">
              <Bot size={16} className="text-white" />
            </div>

            {/* Loading Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium mb-2 text-[#3b82f6]">ReSeich AI</div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#ff8a00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div
                    className="w-2 h-2 bg-[#ff8a00] rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-[#ff8a00] rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
                <span className="text-gray-400 text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
