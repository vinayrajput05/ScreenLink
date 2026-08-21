import React, { useState } from 'react';
import {
  Send,
  Code2,
  MessageSquare,
  Sparkles,
  Trash2,
  Check,
  Copy,
  Clock,
  FileCode2,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface AnnouncementCardProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onSendCode: (code: string, language: string, title?: string) => Promise<void>;
  onClearHistory?: () => Promise<void>;
}

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'html', label: 'HTML/CSS' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'bash', label: 'Shell / Bash' },
];

const PRESET_MESSAGES = [
  'Welcome to the stream! 👋',
  'Taking a 5-minute break ☕',
  'Please check your audio & video 🎧',
  'Q&A Session starting now 💬',
  'Check out the code in the sidebar 💻',
];

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  messages,
  onSendMessage,
  onSendCode,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'text'>('code');
  const [text, setText] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeTitle, setCodeTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(content);
      setText('');
    } catch (err) {
      console.error('Send text error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = codeContent.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      await onSendCode(content, codeLanguage, codeTitle.trim() || undefined);
      setCodeContent('');
      setCodeTitle('');
    } catch (err) {
      console.error('Send code error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy code error:', err);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="card-base p-5 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Live Code & Chat</h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              Host Broadcast
            </span>
          </div>

          {messages.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              title="Clear History"
              className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Broadcast</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Quick Announcement</span>
          </button>
        </div>

        {/* Mode 1: Code Broadcast Form */}
        {activeTab === 'code' && (
          <form onSubmit={handleSendCode} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Language</label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Title (Optional)</label>
                <input
                  type="text"
                  value={codeTitle}
                  onChange={(e) => setCodeTitle(e.target.value)}
                  placeholder="e.g. server.go or Solution"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <textarea
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                placeholder="// Write or paste code snippet here...&#10;function hello() {&#10;  console.log('ScreenLink Live');&#10;}"
                rows={5}
                className="w-full px-3 py-2.5 bg-[#0d1322] border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[11px] text-slate-500 font-mono">
                {codeContent ? codeContent.split('\n').length : 0} lines • {codeContent.length} chars
              </span>
              <button
                type="submit"
                disabled={!codeContent.trim() || isSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Broadcast Code</span>
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Quick Announcement Form */}
        {activeTab === 'text' && (
          <form onSubmit={handleSendText} className="space-y-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">Quick Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_MESSAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(preset)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[10px] font-medium rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message or instruction for all viewers (e.g. 'Open Chapter 5 and run npm start')..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 resize-none shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-400 italic">
                🔒 Sends instantly to all connected viewers
              </p>
              <button
                type="submit"
                disabled={!text.trim() || isSending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Broadcasted Messages Feed - Full Top to Bottom Space */}
      <div className="pt-3 border-t border-slate-100 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Broadcast History ({messages.length})</span>
          </h4>
        </div>

        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 min-h-[240px]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400 text-xs">
              <Sparkles className="w-6 h-6 text-slate-300 mb-2" />
              <span>No broadcasts yet. Sent code and messages will appear here.</span>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold uppercase text-[9px] border border-indigo-200">
                      {msg.isCode ? (msg.language || 'CODE') : 'MSG'}
                    </span>
                    {msg.title && (
                      <span className="font-mono text-slate-800 font-bold flex items-center gap-1">
                        <FileCode2 className="w-3 h-3 text-indigo-500" />
                        {msg.title}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 font-mono text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(msg.sentAt)}
                  </span>
                </div>

                {msg.isCode ? (
                  <div className="relative group rounded-lg overflow-hidden bg-[#0d1322] border border-slate-800">
                    <pre className="p-2.5 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-28 leading-relaxed select-all">
                      <code>{msg.message}</code>
                    </pre>
                    <button
                      onClick={() => handleCopyCode(msg.id, msg.message)}
                      className="absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[9px] font-bold border border-slate-700 transition cursor-pointer shadow-xs"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-800 font-medium leading-relaxed text-xs pl-0.5">
                    {msg.message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
