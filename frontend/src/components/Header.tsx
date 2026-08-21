import React from 'react';
import { Wifi } from 'lucide-react';
import { ServerStatus } from '../types';
import { appLogoBase64 } from '../assets/logoBase64';

interface HeaderProps {
  status: ServerStatus;
  viewerCount: number;
  isPaused?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ status, isPaused }) => {
  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-40 select-none flex-shrink-0">
      {/* Brand & Online State */}
      <div className="flex items-center gap-3">
        <img
          src={appLogoBase64}
          alt="ScreenLink Logo"
          className="w-8 h-8 rounded-xl object-contain p-0.5 bg-indigo-50/50"
        />
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            ScreenLink
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Server State Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold shadow-2xs">
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {status === 'running'
              ? isPaused
                ? 'Screen Paused'
                : 'Server Running'
              : 'Server Ready'}
          </span>
        </div>

        {/* Host Profile Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100/90 hover:bg-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200/80 transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
            H
          </div>
          <span>Host</span>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  );
};
