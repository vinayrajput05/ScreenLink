import React, { useState } from 'react';
import { Send, Clock, Code2, MessageSquare, Copy, Check, Terminal, Trash2, Sparkles } from 'lucide-react';
import { ChatMessage, ServerStatus } from '../types';

interface AnnouncementCardProps {
  status: ServerStatus;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSendCode: (title: string, code: string, language: string) => void;
  onClearMessages?: () => void;
}

const PRESET_MESSAGES = [
  '📢 Starting live screen demonstration',
  '📌 Please follow along with the code on screen',
  '⚠️ 5-minute break — resuming shortly',
  '🚀 Download the starter files from GitHub',
];

const PROGRAMMING_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'go',
  'html',
  'css',
  'json',
  'sql',
  'bash',
  'cpp',
  'rust',
  'java',
  'text',
];

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  status,
  messages,
  onSendMessage,
  onSendCode,
  onClearMessages,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'text'>('code');
  
  // Text message state
  const [text, setText] = useState('');
  
  // Code snippet state
  const [codeTitle, setCodeTitle] = useState('script.js');
  const [codeLang, setCodeLang] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeContent.trim()) return;
    onSendCode(codeTitle.trim() || 'Snippet', codeContent.trim(), codeLang);
    setCodeContent('');
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-2xl h-full flex flex-col justify-between">
      <div>
        {/* Header with Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Host Chat & Code Broadcaster</h2>
              <p className="text-[11px] text-slate-400">
                Send instantly to viewer sidebars (with or without screen share)
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-glow-brand'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Send Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-glow-brand'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Quick Message</span>
            </button>
          </div>
        </div>

        {/* Mode 1: Send Source Code */}
        {activeTab === 'code' && (
          <form onSubmit={handleSendCode} className="space-y-3 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  File Title
                </label>
                <input
                  type="text"
                  value={codeTitle}
                  onChange={(e) => setCodeTitle(e.target.value)}
                  placeholder="e.g. index.html, database.sql, App.tsx"
                  className="w-full px-3 py-2 bg-[#090d17]/90 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Language
                </label>
                <select
                  value={codeLang}
                  onChange={(e) => setCodeLang(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090d17]/90 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {PROGRAMMING_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-slate-900 text-slate-200">
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="// Paste source code here (thousands of lines supported)...\nfunction example() {\n  console.log('ScreenLink Live Code');\n}"
                rows={5}
                className="w-full p-3.5 bg-[#06080e]/95 border border-slate-700/90 rounded-2xl font-mono text-xs text-indigo-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition shadow-inner leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-mono">
                {codeContent ? codeContent.split('\n').length : 0} lines • {codeContent.length} chars
              </span>
              <button
                type="submit"
                disabled={!codeContent.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-glow-brand transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Broadcast Code</span>
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Quick Announcement */}
        {activeTab === 'text' && (
          <form onSubmit={handleSendText} className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className="text-[10px] text-slate-400 self-center mr-1">Templates:</span>
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(preset)}
                  className="px-2 py-0.5 bg-slate-800/80 hover:bg-indigo-500/20 hover:text-indigo-200 text-slate-300 text-[10px] font-medium rounded-lg border border-slate-700/60 transition cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message or instruction for all viewers (e.g. 'Open Chapter 5 and run npm start')..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-[#090d17]/90 border border-slate-700/80 rounded-2xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-500 italic">
                🔒 Sends instantly to all connected devices
              </p>
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-glow-brand transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Broadcasted Messages & Code Feed */}
      {messages.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Broadcast History ({messages.length})</span>
            </h4>
            {onClearMessages && (
              <button
                onClick={onClearMessages}
                className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 bg-[#080c16]/90 border border-slate-800 rounded-2xl text-xs space-y-1.5 shadow-md"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold uppercase text-[9px] border border-indigo-500/30">
                      {msg.isCode ? (msg.language || 'CODE') : 'MSG'}
                    </span>
                    {msg.title && <span className="font-mono text-slate-200 font-semibold">{msg.title}</span>}
                  </div>
                  <span className="flex items-center gap-1 font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    {msg.sentAt}
                  </span>
                </div>

                {msg.isCode ? (
                  <div className="relative group">
                    <pre className="p-2.5 bg-[#04060a] border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-32 leading-relaxed select-all">
                      <code>{msg.message}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyCode(msg.id, msg.message)}
                      className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-0.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-bold border border-slate-700 transition shadow-sm"
                    >
                      {copiedId === msg.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-200 font-medium leading-relaxed text-xs">{msg.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
