import React from 'react';
import { Users, UserX, Laptop, Globe2, Radio } from 'lucide-react';
import { ConnectedViewer } from '../types';

interface ConnectedViewersCardProps {
  viewers: ConnectedViewer[];
  onDisconnect: (id: string) => void;
  onDisconnectAll: () => void;
}

export const ConnectedViewersCard: React.FC<ConnectedViewersCardProps> = ({
  viewers,
  onDisconnect,
  onDisconnectAll,
}) => {
  return (
    <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Connected Viewers</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                {viewers.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">Viewers currently receiving live screen updates</p>
          </div>
        </div>

        {viewers.length > 0 && (
          <button
            onClick={onDisconnectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Disconnect All</span>
          </button>
        )}
      </div>

      {/* Viewers List or Empty State */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
        {viewers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-900/30">
            <div className="p-3 bg-slate-800/50 rounded-full text-slate-500 mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-400">No viewers connected</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
              Once requests are approved, active viewers receiving screen frames will appear here.
            </p>
          </div>
        ) : (
          viewers.map((viewer) => (
            <div
              key={viewer.id}
              className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700/80 transition shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="relative p-2 bg-slate-800 rounded-lg text-slate-300">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#111726] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{viewer.displayName}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{viewer.ip}</span>
                    <span>•</span>
                    <span className="font-sans text-slate-400">{viewer.browser}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      Connected {viewer.durationMinutes} min ago
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDisconnect(viewer.id)}
                title="Disconnect Viewer"
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-medium rounded-lg border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
