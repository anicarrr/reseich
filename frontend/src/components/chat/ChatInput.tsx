import { Send, Paperclip } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  showSendButton?: boolean;
  showTopBorder?: boolean;
}

export function ChatInput({ input, setInput, onSend, showSendButton = true, showTopBorder = true }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`sticky bottom-0 left-0 w-full bg-[#1a2035] ${showTopBorder ? 'border-t border-white/10' : ''}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form
          className="relative flex items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          {/* Input Container */}
          <div className="flex-1 relative">
            <textarea
              className="w-full px-4 py-3 pr-12 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#e9407a] focus:border-[#e9407a] transition-all duration-300 min-h-[52px] max-h-32"
              placeholder="Message ReSeich AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '52px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />

            {/* Attach Button */}
            <button
              type="button"
              className="absolute right-3 bottom-3 p-1.5 text-gray-400 hover:text-white transition-colors"
              title="Attach file"
            >
              <Paperclip size={16} />
            </button>
          </div>

          {/* Send Button */}
          {showSendButton && (
            <button
              type="submit"
              disabled={!input.trim()}
              className={`p-3 rounded-xl transition-all duration-300 ${
                input.trim()
                  ? 'bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22] text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-white/10 text-gray-400 cursor-not-allowed backdrop-blur-sm'
              }`}
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </form>

        {/* Helper Text */}
        <div className="text-xs text-gray-400 text-center mt-3">
          ReSeich AI can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
}
