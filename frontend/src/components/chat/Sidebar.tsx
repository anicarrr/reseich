import Image from 'next/image';
import Link from 'next/link';
import { Plus, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import { useState } from 'react';

interface Chat {
  id: number;
  title: string;
}

interface SidebarProps {
  chats: Chat[];
  selectedChatId: number;
  onSelect: (chatId: number) => void;
  onNewChat: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ chats, selectedChatId, onSelect, onNewChat, sidebarOpen }: SidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<number | null>(null);

  return (
    <aside
      className={`fixed z-40 top-16 left-0 h-[calc(100vh-4rem)] bg-[#1f263e] backdrop-blur-ultra border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-[280px]`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-main.svg" alt="ReSeich" height={28} width={100} className="h-7 w-auto" />
        </Link>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200"
          title="New chat"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#e9407a] to-[#ff8a00] text-white font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
          onClick={onNewChat}
        >
          <MessageSquare size={18} />
          Start New Research
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="text-xs font-medium text-gray-400 mb-3 px-2">Recent Chats</div>
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="relative group"
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => setHoveredChat(null)}
            >
              <button
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  selectedChatId === chat.id
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'hover:bg-white/10 text-white/80 hover:text-white'
                }`}
                onClick={() => onSelect(chat.id)}
              >
                <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
                <span className="truncate text-sm">{chat.title}</span>
              </button>

              {/* Chat Actions */}
              {hoveredChat === chat.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    className="p-1.5 rounded-md bg-[#1f263e]/80 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-200"
                    title="Edit chat"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    className="p-1.5 rounded-md bg-[#1f263e]/80 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all duration-200"
                    title="Delete chat"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-gray-400 text-center">Powered by ReSeich AI</div>
      </div>
    </aside>
  );
}
