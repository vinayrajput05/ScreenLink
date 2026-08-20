import React from 'react';
import { Monitor, Play, Square, RefreshCw, Layers } from 'lucide-react';
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

  return (
    <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Screen Sharing</h2>
            <p className="text-xs text-slate-400">Choose display output to share with LAN viewers</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Display Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
            <span>Select Display</span>
            <span className="text-[11px] text-slate-500">
              {displays.length} display{displays.length === 1 ? '' : 's'} detected
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedDisplay}
              onChange={(e) => onSelectDisplay(e.target.value)}
              disabled={isRunning || isStarting}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer transition font-medium"
            >
              {displays.map((disp) => (
                <option key={disp.id} value={disp.id} className="bg-slate-900 text-slate-200">
                  {disp.name} — {disp.resolution} {disp.isPrimary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!isRunning ? (
            <button
              onClick={onStartSharing}
              disabled={isStarting}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Starting Server & Capture...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Sharing</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onStopSharing}
              className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/35 active:scale-[0.99] transition cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Sharing</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
