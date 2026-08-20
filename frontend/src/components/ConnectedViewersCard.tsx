import React from 'react';
import { Users, UserX, Laptop, Smartphone, Tablet } from 'lucide-react';
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
  const getDeviceIcon = (browser: string, name: string) => {
    const text = (browser + ' ' + name).toLowerCase();
    if (text.includes('iphone') || text.includes('android') || text.includes('mobile') || text.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-emerald-400" />;
    }
    if (text.includes('ipad') || text.includes('tablet')) {
      return <Tablet className="w-4 h-4 text-emerald-400" />;
    }
    return <Laptop className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Active Viewers</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                {viewers.length} active
              </span>
            </div>
            <p className="text-xs text-slate-400">Devices currently receiving live screen updates</p>
          </div>
        </div>

        {viewers.length > 0 && (
          <button
            onClick={onDisconnectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 transition active:scale-[0.98] cursor-pointer shrink-0"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Disconnect All</span>
          </button>
        )}
      </div>

      {/* Viewers List or Empty State */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
        {viewers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/20">
            <div className="p-3 bg-slate-800/40 rounded-2xl text-slate-500 mb-2.5">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No Viewers Connected</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
              Approved viewers receiving real-time screen frames will appear here with live session metrics.
            </p>
          </div>
        ) : (
          viewers.map((viewer) => (
            <div
              key={viewer.id}
              className="flex items-center justify-between gap-3 p-3.5 bg-[#0a0e1a]/90 border border-slate-800 rounded-2xl hover:border-slate-700 transition shadow-lg group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative p-2.5 bg-slate-800/80 rounded-xl text-slate-300 border border-slate-700/50 shrink-0">
                  {getDeviceIcon(viewer.browser, viewer.displayName)}
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0f1422] animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white tracking-wide truncate">{viewer.displayName}</h4>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span className="text-emerald-300 font-semibold">{viewer.ip}</span>
                    <span>•</span>
                    <span className="font-sans text-slate-300">{viewer.browser}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {viewer.durationMinutes === 0 ? 'Just joined' : `${viewer.durationMinutes}m duration`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDisconnect(viewer.id)}
                title="Disconnect Viewer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-xl border border-slate-700 hover:border-rose-500/30 transition active:scale-[0.98] cursor-pointer shrink-0 whitespace-nowrap"
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
