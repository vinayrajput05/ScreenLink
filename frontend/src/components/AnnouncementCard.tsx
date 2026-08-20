import React, { useState } from 'react';
import { Megaphone, Send, Clock, MessageSquareQuote } from 'lucide-react';
import { Announcement, ServerStatus } from '../types';

interface AnnouncementCardProps {
  status: ServerStatus;
  announcements: Announcement[];
  onSendAnnouncement: (message: string) => void;
}

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

  return (
    <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Host Announcement</h2>
          <p className="text-xs text-slate-400">
            Broadcast a one-way message banner to all approved viewers
          </p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-3">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLength))}
            disabled={!isRunning}
            placeholder={
              isRunning
                ? "Type message for viewers (e.g. 'Open Chapter 5 and start Exercise 2')..."
                : "Start screen sharing to send announcements to viewers..."
            }
            rows={2}
            className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition"
          />
          <div className="absolute right-3 bottom-3 text-[11px] text-slate-500 font-mono">
            {text.length}/{maxLength}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 italic">
            Viewers cannot reply. Messages are displayed as prominent notification banners.
          </p>
          <button
            type="submit"
            disabled={!isRunning || !text.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/25 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Announcement</span>
          </button>
        </div>
      </form>

      {/* Recent Announcements Log */}
      {announcements.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <h4 className="text-xs font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recent Broadcasts ({announcements.length})</span>
          </h4>
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="flex items-start justify-between p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg text-xs"
              >
                <p className="text-slate-300 font-normal leading-relaxed pr-3">{ann.message}</p>
                <span className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0 font-mono mt-0.5">
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
