import React from 'react';
import { ScreenShare, Wifi, ShieldCheck, Activity } from 'lucide-react';
import { ServerStatus } from '../types';

interface HeaderProps {
  status: ServerStatus;
  viewerCount: number;
}

export const Header: React.FC<HeaderProps> = ({ status, viewerCount }) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sharing Active</span>
          </div>
        );
      case 'starting':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Starting Server...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Server Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-slate-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Stopped</span>
          </div>
        );
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#111726]/80 backdrop-blur border-b border-slate-800/80 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
          <ScreenShare className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">LANMirror</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Host MVP
            </span>
          </div>
          <p className="text-xs text-slate-400">Local-network view-only screen sharing</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getStatusBadge()}

        {status === 'running' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/70 border border-slate-700/60 rounded-full text-slate-300 text-xs">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>{viewerCount} connected viewer{viewerCount === 1 ? '' : 's'}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-slate-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Host Approval Required</span>
        </div>
      </div>
    </header>
  );
};
