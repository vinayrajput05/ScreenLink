import React from 'react';
import { Monitor, Play, Square, RefreshCw, Layers, Radio, Sparkles } from 'lucide-react';
import { DisplayInfo, ServerStatus } from '../types';

interface ScreenControlCardProps {
  status: ServerStatus;
  displays: DisplayInfo[];
  selectedDisplay: string;
  onSelectDisplay: (id: string) => void;
  onStartSharing: () => void;
  onStopSharing: () => void;
}

export const ScreenControlCard: React.FC<ScreenControlCardProps> = ({
  status,
  displays,
  selectedDisplay,
  onSelectDisplay,
  onStartSharing,
  onStopSharing,
}) => {
  const isRunning = status === 'running';
  const isStarting = status === 'starting';

  const currentDisplay = displays.find((d) => d.id === selectedDisplay) || displays[0];

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Display & Capture</h2>
              <p className="text-xs text-slate-400">Select which monitor to mirror to LAN viewers</p>
            </div>
          </div>

          {isRunning && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-[11px] font-mono text-indigo-300">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>18-20 FPS</span>
            </div>
          )}
        </div>

        {/* Display Selector Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Target Screen</span>
            <span className="text-[11px] font-normal text-slate-400">
              {displays.length} monitor{displays.length === 1 ? '' : 's'} available
            </span>
          </label>

          <div className="relative">
            <select
              value={selectedDisplay}
              onChange={(e) => onSelectDisplay(e.target.value)}
              disabled={isRunning || isStarting}
              className="w-full px-4 py-3.5 bg-[#090d17]/90 border border-slate-700/80 rounded-2xl text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer transition shadow-inner"
            >
              {displays.map((disp) => (
                <option key={disp.id} value={disp.id} className="bg-slate-900 text-slate-200">
                  {disp.name} — {disp.resolution} {disp.isPrimary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          {currentDisplay && (
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Output: <strong className="text-slate-200">{currentDisplay.resolution}</strong>
              </span>
              <span className="text-[11px] text-slate-500">Hardware Framebuffer</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-5 mt-4 border-t border-slate-800/60">
        {!isRunning ? (
          <button
            onClick={onStartSharing}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-glow-brand hover:shadow-indigo-500/50 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isStarting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Starting Screen Stream...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Sharing Screen</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onStopSharing}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition duration-200 cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Sharing</span>
          </button>
        )}
      </div>
    </div>
  );
};
