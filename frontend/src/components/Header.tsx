import React from 'react';
import { Wifi } from 'lucide-react';
import { ServerStatus } from '../types';
import { appLogoBase64 } from '../assets/logoBase64';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

interface HeaderProps {
  status: ServerStatus;
  viewerCount: number;
  isPaused?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ status, isPaused }) => {
  const handleOpenAuthorLink = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (typeof BrowserOpenURL === 'function') {
        BrowserOpenURL('https://vinayrajput.in');
        return;
      }
    } catch {
      // Fallback
    }
    window.open('https://vinayrajput.in', '_blank');
  };

  return (
    <header
      style={{ ['--wails-draggable' as any]: 'drag' }}
      className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-40 select-none flex-shrink-0"
    >
      {/* Brand & Author Link */}
      <div
        style={{ ['--wails-draggable' as any]: 'no-drag' }}
        className="flex items-center gap-3"
      >
        <img
          src={appLogoBase64}
          alt="ScreenLink Logo"
          className="w-8 h-8 rounded-xl object-contain p-0.5 bg-indigo-50/50"
        />
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
            ScreenLink
          </h1>
          <a
            href="https://vinayrajput.in"
            target="_blank"
            rel="noreferrer"
            onClick={handleOpenAuthorLink}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors cursor-pointer"
          >
            By https://vinayrajput.in
          </a>
        </div>
      </div>

      {/* Right Controls: Server State Badge */}
      <div
        style={{ ['--wails-draggable' as any]: 'no-drag' }}
        className="flex items-center gap-3"
      >
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
      </div>
    </header>
  );
};
