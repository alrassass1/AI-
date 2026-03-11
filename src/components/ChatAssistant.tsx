import React from 'react';
import { 
  Send, Bot, User, Sparkles, Loader2, Copy, Check, RotateCcw, Clock, Shield, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  handleSend: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  userName: string;
  setUserName: (value: string) => void;
  showNamePrompt: boolean;
  setShowNamePrompt: (value: boolean) => void;
  t: any;
  theme: 'light' | 'dark';
  lang: 'ar' | 'en';
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  messages, 
  isLoading, 
  input, 
  setInput, 
  handleSend, 
  messagesEndRef, 
  userName, 
  setUserName, 
  showNamePrompt, 
  setShowNamePrompt, 
  t, 
  theme, 
  lang 
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`group relative max-w-[85%] lg:max-w-[75%] p-4 rounded-2xl shadow-sm transition-all select-text ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : theme === 'dark' 
                    ? 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none' 
                    : 'bg-white text-slate-900 border border-slate-100 rounded-tl-none'
              }`}>
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      msg.role === 'bot' ? 'bg-blue-100 text-blue-600' : 'bg-white/20 text-white'
                    }`}>
                      {msg.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                      {msg.role === 'bot' ? 'Roaya AI' : (userName || (lang === 'ar' ? 'أنت' : 'You'))}
                    </span>
                  </div>
                  
                  {/* Action Buttons (Visible on Hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button 
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className={`p-1 rounded-md transition-colors ${
                        msg.role === 'user' ? 'hover:bg-white/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={lang === 'ar' ? 'نسخ النص' : 'Copy Text'}
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Message Content */}
                <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                </div>

                {/* Message Footer */}
                <div className={`text-[8px] mt-2 opacity-50 flex items-center gap-1 ${lang === 'ar' ? 'justify-start' : 'justify-end'}`}>
                  <Clock size={8} />
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-start"
          >
            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} border shadow-sm flex items-center gap-3`}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.processing}</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 lg:p-6 border-t ${theme === 'dark' ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-white/50'} backdrop-blur-md`}>
        {showNamePrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'} border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200">{t.name_prompt}</p>
                <p className="text-[10px] text-slate-500">{lang === 'ar' ? 'لنقدم لك تجربة أكثر تخصيصاً' : 'To provide a more personalized experience'}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t.enter_name}
                className={`flex-1 sm:w-48 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'} rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
              />
              <button 
                onClick={() => setShowNamePrompt(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </motion.div>
        )}

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(e); }}
          className="relative flex items-center gap-3"
        >
          <div className="relative flex-1 group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.type_placeholder}
              className={`w-full ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-700 text-white focus:bg-slate-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
              } rounded-[1.5rem] py-4 px-6 pr-14 text-sm outline-none border-2 focus:border-blue-500 transition-all shadow-inner`}
            />
            <div className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400`}>
              {input.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setInput('')}
                  className="p-1 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`
              w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-all shadow-xl
              ${isLoading || !input.trim() 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 active:scale-90 hover:-translate-y-0.5'
              }
            `}
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <Send size={24} className={`${lang === 'ar' ? 'rotate-180' : ''} transition-transform group-hover:translate-x-1`} />
            )}
          </button>
        </form>
        
        <div className="mt-3 flex items-center justify-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Shield size={10} className="text-blue-500" />
            {t.secure_data}
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <div className="flex items-center gap-1">
            <Activity size={10} className="text-blue-500" />
            {t.premium_service}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
