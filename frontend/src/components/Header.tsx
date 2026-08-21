import React from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { ServerStatus } from '../types';
import appLogo from '../assets/images/logo-universal.png';

interface HeaderProps {
  status: ServerStatus;
  viewerCount: number;
}

export const Header: React.FC<HeaderProps> = ({ status, viewerCount }) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold shadow-glow-emerald">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sharing Active</span>
          </div>
        );
      case 'starting':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-semibold shadow-glow-amber">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Starting Screen Stream...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Streaming Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full text-slate-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Ready to Share</span>
          </div>
        );
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#0d121f]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40">
      <div className="flex items-center gap-3.5">
        <img
          src={appLogo}
          alt="ScreenLink Logo"
          className="w-10 h-10 rounded-2xl shadow-glow-brand object-contain p-1 bg-[#090e1a] border border-cyan-500/30"
        />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              ScreenLink
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              LAN v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400">Zero-install local network screen mirroring</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {getStatusBadge()}

        {status === 'running' && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800/80 border border-slate-700/70 rounded-full text-slate-200 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{viewerCount} viewer{viewerCount === 1 ? '' : 's'}</span>
          </div>
        )}

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-full text-slate-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Host Controlled Access</span>
        </div>
      </div>
    </header>
  );
};
