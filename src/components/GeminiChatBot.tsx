import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Crown,
  MapPin,
  Tag,
  Plus,
  Compass,
  ArrowRight,
  Utensils,
  Maximize2,
  Minimize2,
  RefreshCw,
  Gift
} from 'lucide-react';
import { MenuItem, Location } from '../types/models';
import { api } from '../services/api';

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  content: string;
  suggestedDishes?: MenuItem[];
  offerCode?: string;
  timestamp: string;
}

interface GeminiChatBotProps {
  activeLocation?: Location | null;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem, qty?: number, addons?: string[]) => void;
  onApplyCoupon?: (code: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  onOpen?: () => void;
}

const STARTER_PROMPTS = [
  { text: 'Tell me about the 5% discount on orders of ₹3k+', icon: '🎁' },
  { text: 'What are your featured signature dishes?', icon: '⭐' },
  { text: 'Difference between Hazratganj and Highway Dhaba?', icon: '🏛️' },
  { text: 'How do I reach the Highway Dhaba?', icon: '🗺️' },
  { text: 'Recommend a royal feast for 4 guests', icon: '👑' }
];

export const GeminiChatBot: React.FC<GeminiChatBotProps> = ({
  activeLocation,
  menuItems,
  onAddToCart,
  onApplyCoupon,
  isOpen: controlledIsOpen,
  onToggle,
  onClose,
  onOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = () => {
    if (isOpen) {
      if (onClose) onClose();
      else if (onToggle) onToggle();
      else setInternalIsOpen(false);
    } else {
      if (onOpen) onOpen();
      else if (onToggle) onToggle();
      else setInternalIsOpen(true);
    }
  };

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    return [
      {
        id: 'msg-welcome',
        role: 'model',
        content: `Adaab Huzoor! I am **Nawab AI**, your royal culinary concierge for **SHANGRILLA Lucknow**.

I can recommend our authentic melt-in-mouth Galouti kebabs & dum biryanis, guide you with live directions to our **Hazratganj** or **24/7 Highway Dhaba** branches via Google Maps, or help you claim our **5% instant discount on orders of ₹3,000+** (Coupon code: **ROYAL3K**)!

How may I assist your dastarkhwan today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      // Build history payload for server-side multi-turn context
      const historyPayload = messages
        .filter(m => m.id !== 'msg-welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await api.sendChatMessage(
        textToSend.trim(),
        historyPayload,
        activeLocation?.id
      );

      // Enhance with full dish objects if matching ids/names found
      let matchedDishes: MenuItem[] = [];
      if (res.suggestedDishes && res.suggestedDishes.length > 0) {
        matchedDishes = res.suggestedDishes;
      } else {
        const queryLower = (textToSend + ' ' + res.reply).toLowerCase();
        matchedDishes = menuItems.filter(m => {
          const nameLower = m.name.toLowerCase();
          return (
            (m.isFeatured && queryLower.includes('featured')) ||
            (queryLower.includes('galouti') && m.id.includes('galouti')) ||
            (queryLower.includes('biryani') && m.id.includes('biryani')) ||
            (queryLower.includes('dal') && m.id.includes('dal')) ||
            (queryLower.includes('butter chicken') && m.id.includes('butter-chicken')) ||
            (queryLower.includes('chai') && m.id.includes('kulhad-chai'))
          );
        }).slice(0, 3);
      }

      const botMsg: ChatMessageItem = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: res.reply,
        suggestedDishes: matchedDishes.length > 0 ? matchedDishes : undefined,
        offerCode: res.offerCode || (res.reply.includes('ROYAL3K') ? 'ROYAL3K' : undefined),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat bot error:', err);
      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Adaab Huzoor, our royal kitchen assistant encountered a brief pause, but our kitchen is fully operational! 

✨ **Reminder**: You can enjoy **5% off on all orders above ₹3,000** today with coupon code **ROYAL3K**. Feel free to ask about our signature Galouti Kebabs, Dum Biryani, or Dhaba Dal Makhani!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        offerCode: 'ROYAL3K'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button in Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 pointer-events-auto">
        {!isOpen && (
          <div
            onClick={toggleOpen}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#cba158]/50 shadow-md text-stone-800 text-xs font-semibold animate-apple-pill apple-press cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ask Nawab AI · 5% Off ₹3k+</span>
          </div>
        )}

        <button
          onClick={toggleOpen}
          aria-label={isOpen ? 'Close Nawab AI Assistant' : 'Open Nawab AI Assistant'}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#cba158] via-[#dfb872] to-[#b8860b] hover:from-[#dfb872] hover:to-[#cba158] text-stone-950 shadow-2xl flex items-center justify-center transition-all duration-300 apple-press cursor-pointer ring-4 ring-white"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-stone-950 transition-transform duration-300 rotate-90" />
          ) : (
            <>
              <Crown className="w-6 h-6 text-stone-950" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </>
          )}
        </button>
      </div>

      {/* Chat Window Panel with Apple Fluid Motion */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_25px_65px_rgba(0,0,0,0.22)] rounded-2xl bg-white border border-stone-200 flex flex-col overflow-hidden animate-apple-modal ${
            isExpanded
              ? 'bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[540px] h-[85vh] max-h-[750px]'
              : 'bottom-22 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-[420px] h-[580px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-200 bg-gradient-to-r from-[#faf8f5] via-white to-[#faf8f5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#cba158] to-[#996e1e] flex items-center justify-center text-stone-950 shadow-sm">
                <Crown className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-['Oswald',sans-serif] text-base font-bold uppercase tracking-tight text-stone-900">
                    Nawab AI Concierge
                  </h3>
                  <span className="px-1.5 py-0.5 rounded bg-[#cba158]/15 text-[#855e18] text-[9px] font-mono font-bold uppercase tracking-wider border border-[#cba158]/30">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                  <span>Awadhi Gastronomy & Maps Assistant</span>
                  {activeLocation && (
                    <>
                      <span>·</span>
                      <span className="text-[#855e18] font-semibold">{activeLocation.name.split(' ')[0]}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-stone-400">
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-1.5 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: 'msg-welcome-reset',
                      role: 'model',
                      content: `Adaab Huzoor! How may I assist your Lucknow dining experience today? Ask me about our featured dishes or our **5% discount on orders above ₹3,000** (code **ROYAL3K**)!`,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                  ]);
                }}
                className="p-1.5 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title="Restart chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={toggleOpen}
                className="p-1.5 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Special Offer Banner at top of chat */}
          <div className="px-4 py-2 bg-gradient-to-r from-[#fdfbf7] via-[#f7f0e3] to-[#fdfbf7] border-b border-[#cba158]/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#cba158]/20 flex items-center justify-center text-[#855e18] shrink-0 font-bold">
                🎁
              </span>
              <span className="text-stone-700 font-medium text-[11px]">
                Orders ₹3,000+: <strong className="text-[#855e18]">Flat 5% Off</strong> with code <strong>ROYAL3K</strong>
              </span>
            </div>
            {onApplyCoupon && (
              <button
                type="button"
                onClick={() => onApplyCoupon('ROYAL3K')}
                className="text-[10px] font-bold text-[#855e18] hover:underline uppercase tracking-wider cursor-pointer"
              >
                Apply Code →
              </button>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf8f5]/60">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-[#cba158] to-[#dfb872] text-stone-950 font-medium rounded-tr-xs'
                        : 'bg-white border border-stone-200 text-stone-800 rounded-tl-xs shadow-sm'
                    }`}
                  >
                    {/* Assistant header icon */}
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase font-bold text-[#855e18]">
                        <Crown className="w-3 h-3 text-[#996e1e]" />
                        <span>Nawab AI</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Quick Offer Button if message mentions ROYAL3K */}
                    {msg.offerCode && onApplyCoupon && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#855e18]">
                          Coupon Code: {msg.offerCode} (5% Off ₹3,000+)
                        </span>
                        <button
                          type="button"
                          onClick={() => onApplyCoupon(msg.offerCode!)}
                          className="px-2.5 py-1 rounded-lg bg-[#cba158] hover:bg-[#dfb872] text-stone-950 text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Copy & Apply
                        </button>
                      </div>
                    )}

                    {/* Interactive Suggested Dish Cards */}
                    {msg.suggestedDishes && msg.suggestedDishes.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200/80 space-y-2">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-[#996e1e]" />
                          <span>Recommended Dishes to Order</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {msg.suggestedDishes.map((dish) => (
                            <div
                              key={dish.id}
                              className="p-2 rounded-xl bg-[#faf8f5] border border-stone-200 flex items-center justify-between gap-2 hover:border-[#cba158]/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {dish.imageUrl && (
                                  <img
                                    src={dish.imageUrl}
                                    alt={dish.name}
                                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-200"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        dish.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                                      }`}
                                    />
                                    <span className="font-bold text-stone-900 truncate text-[11px]">
                                      {dish.name}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono font-bold text-[#855e18]">
                                    ₹{dish.price}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onAddToCart(dish, 1, [])}
                                className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs transform hover:scale-105 active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-stone-400 font-mono px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="p-3 bg-white border border-stone-200 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#cba158] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#cba158] animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-[#cba158] animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-stone-500 font-medium pl-1">
                    Nawab AI is consulting the royal archives...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Suggestions */}
          <div className="p-2 border-t border-stone-200 bg-white">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt.text)}
                  className="px-2.5 py-1 rounded-full bg-[#faf8f5] hover:bg-[#f7f0e3] border border-stone-200 hover:border-[#cba158]/50 text-stone-700 text-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-stone-200 bg-[#faf8f5]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about dishes, 5% discount, locations, or banquets..."
                className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#cba158] focus:ring-1 focus:ring-[#cba158] transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-md disabled:opacity-40 text-stone-950 font-bold transition-all shrink-0 cursor-pointer shadow-xs transform hover:-translate-y-0.5 active:translate-y-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1.5 px-1 font-sans">
              <span>Powered by Gemini 3.8 Flash & Google Maps Grounding</span>
              <span className="text-[#855e18] font-bold">SHANGRILLA Lucknow</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
