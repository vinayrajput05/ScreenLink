import React, { useState, useEffect } from 'react';
import { Wifi, Minus, Square, Copy, X, Gamepad2 } from 'lucide-react';
import { ServerStatus } from '../types';
import { appLogoBase64 } from '../assets/logoBase64';
import {
  WindowMinimise,
  WindowToggleMaximise,
  WindowIsMaximised,
  Quit,
} from '../../wailsjs/runtime/runtime';

interface HeaderProps {
  status: ServerStatus;
  viewerCount: number;
  isPaused?: boolean;
  onOpenGame?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, isPaused, onOpenGame }) => {
  const [isMaximised, setIsMaximised] = useState(false);

  const checkMaximised = async () => {
    try {
      if (typeof WindowIsMaximised === 'function') {
        const max = await WindowIsMaximised();
        setIsMaximised(Boolean(max));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    checkMaximised();
    window.addEventListener('resize', checkMaximised);
    return () => window.removeEventListener('resize', checkMaximised);
  }, []);

  const handleMinimise = () => {
    try {
      if (typeof WindowMinimise === 'function') {
        WindowMinimise();
      }
    } catch (err) {
      console.error('Failed to minimise window:', err);
    }
  };

  const handleToggleMaximise = async () => {
    try {
      if (typeof WindowToggleMaximise === 'function') {
        WindowToggleMaximise();
        setTimeout(checkMaximised, 150);
      }
    } catch (err) {
      console.error('Failed to toggle maximise window:', err);
    }
  };

  const handleClose = () => {
    try {
      if (typeof Quit === 'function') {
        Quit();
      }
    } catch (err) {
      console.error('Failed to close window:', err);
    }
  };

  return (
    <header
      style={{ ['--wails-draggable' as any]: 'drag' }}
      className="h-16 px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-40 select-none flex-shrink-0"
    >
      {/* Brand & Online State */}
      <div
        style={{ ['--wails-draggable' as any]: 'no-drag' }}
        className="flex items-center gap-3"
      >
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
      <div
        style={{ ['--wails-draggable' as any]: 'no-drag' }}
        className="flex items-center gap-3"
      >
        {/* Play 6x6 Memory Game Button */}
        {onOpenGame && (
          <button
            type="button"
            onClick={onOpenGame}
            title="Play 6x6 Memory Game"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Memory Game (6x6)</span>
          </button>
        )}

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
        </div>

        {/* Window Controls (Minimize, Maximize / Restore, Close) */}
        <div className="flex items-center ml-1 pl-2.5 border-l border-slate-200/90 gap-1">
          <button
            type="button"
            title="Minimize"
            onClick={handleMinimise}
            aria-label="Minimize Window"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            title={isMaximised ? 'Restore' : 'Maximize'}
            onClick={handleToggleMaximise}
            aria-label={isMaximised ? 'Restore Window' : 'Maximize Window'}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            {isMaximised ? (
              <Copy className="w-3.5 h-3.5 rotate-180" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            title="Close Application"
            onClick={handleClose}
            aria-label="Close Application"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-rose-500 active:bg-rose-600 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
