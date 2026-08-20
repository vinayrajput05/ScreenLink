import React, { useState } from 'react';
import { Megaphone, Send, Clock, MessageSquareQuote, Sparkles } from 'lucide-react';
import { Announcement, ServerStatus } from '../types';

interface AnnouncementCardProps {
  status: ServerStatus;
  announcements: Announcement[];
  onSendAnnouncement: (message: string) => void;
}

const PRESET_MESSAGES = [
  '📢 Starting presentation now',
  '📌 Please follow along with the code on screen',
  '⚠️ 5-minute break — resuming shortly',
  '🚀 Code repository link is in the chat',
];

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  status,
  announcements,
  onSendAnnouncement,
}) => {
  const [text, setText] = useState('');
  const isRunning = status === 'running';
  const maxLength = 1000;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !isRunning) return;
    onSendAnnouncement(text.trim());
    setText('');
  };

  const handlePresetClick = (msg: string) => {
    if (!isRunning) return;
    setText(msg);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Host Announcement Broadcast</h2>
            <p className="text-xs text-slate-400">
              Broadcast prominent notification banners to all connected viewers in real time
            </p>
          </div>
        </div>
      </div>

      {/* Preset Chips */}
      {isRunning && (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[11px] text-slate-400 self-center mr-1">Quick templates:</span>
          {PRESET_MESSAGES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-indigo-500/20 hover:text-indigo-200 text-slate-300 text-[11px] font-medium rounded-lg border border-slate-700/60 transition cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-3">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            disabled={!isRunning}
            placeholder={
              isRunning
                ? "Type an announcement for all viewers (e.g. 'Open Chapter 5 and start Exercise 2')..."
                : "Start screen sharing above to broadcast announcements to viewers..."
            }
            rows={2}
            className="w-full px-4 py-3 bg-[#090d17]/90 border border-slate-700/80 rounded-2xl text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition shadow-inner"
          />
          <div className="absolute right-3.5 bottom-3 text-[11px] text-slate-500 font-mono">
            {text.length}/{maxLength}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 italic">
            🔒 View-only mode: Viewers cannot reply. Message appears as an animated top banner on all devices.
          </p>
          <button
            type="submit"
            disabled={!isRunning || !text.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-glow-brand transition duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to All Viewers</span>
          </button>
        </div>
      </form>

      {/* Recent Announcements Log */}
      {announcements.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-2">
            <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recent Broadcasts ({announcements.length})</span>
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start justify-between p-3 bg-[#0a0e1a]/90 border border-slate-800/90 rounded-xl text-xs"
              >
                <p className="text-slate-200 font-medium leading-relaxed pr-4">{ann.message}</p>
                <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 font-mono mt-0.5">
                  <Clock className="w-3 h-3" />
                  {ann.sentAt}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
