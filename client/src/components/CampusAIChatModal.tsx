import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useTimeSim } from '../context/TimeSimContext';
import { CampusAIMessage } from '../types';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User as UserIcon,
  Database,
  ArrowRight,
  Info
} from 'lucide-react';

interface CampusAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

const QUICK_PROMPTS = [
  'What is my next class?',
  'Where can I study right now?',
  'Is the cafeteria crowded?',
  'What is my attendance?',
  'Any events happening today?',
  'Where is the library?',
];

export const CampusAIChatModal: React.FC<CampusAIChatModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { simulatedTime, simulatedDay } = useTimeSim();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<CampusAIMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hi! I'm **CampusAI**, your real-time campus companion. I query live database records to answer questions about your next lecture, attendance, empty study rooms, crowd levels, and campus directions.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: CampusAIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage({
        message: query,
        simulatedTime,
        simulatedDay,
      });

      const aiMsg: CampusAIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: res.intent,
        suggestedActions: res.suggestedActions,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: CampusAIMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue connecting to the campus database. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: { label: string; action: string; payload?: any }) => {
    if (action.action === 'NAVIGATE') {
      onNavigateTab(action.payload);
      onClose();
    } else if (action.action === 'ASK') {
      handleSendMessage(action.payload);
    }
  };

  // Simple Markdown Bold Parser for clean styling
  const renderFormattedText = (text: string) => {
    const parts = text.split('\n');
    return (
      <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
        {parts.map((paragraph, pIdx) => {
          if (!paragraph) return <div key={pIdx} className="h-1.5" />;

          // Process markdown **bold**
          const segments = paragraph.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={pIdx}>
              {segments.map((segment, sIdx) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return (
                    <strong key={sIdx} className="font-bold text-white">
                      {segment.slice(2, -2)}
                    </strong>
                  );
                }
                if (segment.startsWith('*') && segment.endsWith('*')) {
                  return (
                    <em key={sIdx} className="italic text-teal-300">
                      {segment.slice(1, -1)}
                    </em>
                  );
                }
                return segment;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-card max-w-xl w-full h-[620px] max-h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">CampusAI Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Live DB Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Rule-based database retrieval • Zero hallucinations • Modular LLM adapter
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Engine Banner */}
        <div className="bg-slate-900/60 border-b border-slate-800/60 px-4 py-1.5 flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Every number and timetable entry is calculated directly from the MongoDB models.</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                    isUser
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-slate-800 text-teal-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {renderFormattedText(msg.text)}

                  {/* Render Suggested Quick Action Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/15 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 flex items-center gap-1 transition-all"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3 opacity-70" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-slate-400/80 mt-1.5 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 animate-pulse">
              <Bot className="w-4 h-4 text-teal-400" />
              <span>Querying campus records...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:text-teal-300 text-slate-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about classes, crowd, rooms, or attendance..."
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
