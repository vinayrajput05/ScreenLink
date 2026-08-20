import React from 'react';
import { Monitor, Play, Square, Pause, RefreshCw, Layers, Radio, Sliders } from 'lucide-react';
import { DisplayInfo, QualityPreset, ServerStatus } from '../types';

interface ScreenControlCardProps {
  status: ServerStatus;
  isScreenActive?: boolean;
  isPaused?: boolean;
  displays: DisplayInfo[];
  selectedDisplay: string;
  onSelectDisplay: (id: string) => void;
  qualityPresets: QualityPreset[];
  selectedQuality: string;
  onSelectQuality: (id: string) => void;
  onStartSharing: () => void;
  onPauseSharing?: () => void;
  onResumeSharing?: () => void;
  onStopSharing: () => void;
}

export const ScreenControlCard: React.FC<ScreenControlCardProps> = ({
  status,
  isScreenActive = false,
  isPaused = false,
  displays,
  selectedDisplay,
  onSelectDisplay,
  qualityPresets,
  selectedQuality,
  onSelectQuality,
  onStartSharing,
  onPauseSharing,
  onResumeSharing,
  onStopSharing,
}) => {
  const isStarting = status === 'starting';
  const isStreaming = status === 'running' && isScreenActive;
  const currentPreset = qualityPresets.find((q) => q.id === selectedQuality) || qualityPresets[0];

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Display & Framerate</h2>
              <p className="text-xs text-slate-400">Configure screen capture monitor and stream speed</p>
            </div>
          </div>

          {isStreaming && currentPreset && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px] font-mono text-emerald-300">
              <Radio className={`w-3 h-3 ${isPaused ? 'text-amber-400' : 'text-emerald-400 animate-pulse'}`} />
              <span>
                {isPaused ? '⏸ PAUSED' : `${currentPreset.targetFps} FPS • ${currentPreset.name}`}
              </span>
            </div>
          )}
        </div>

        {/* Display Selector Box */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Target Screen</span>
            <span className="text-[11px] font-normal text-slate-400">
              {displays.length} monitor{displays.length === 1 ? '' : 's'} available
            </span>
          </label>

          <div className="relative">
            <select
              value={selectedDisplay}
              onChange={(e) => onSelectDisplay(e.target.value)}
              disabled={isStreaming || isStarting}
              className="w-full px-4 py-3 bg-[#090d17]/90 border border-slate-700/80 rounded-2xl text-sm font-semibold text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer transition shadow-inner"
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
        </div>

        {/* Stream Quality & FPS Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Framerate & Performance Profile</span>
            </label>
            {isStreaming && (
              <span className="text-[10px] text-cyan-400 font-medium">✨ Live dynamic adjustment</span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {qualityPresets.map((preset) => {
              const isSelected = selectedQuality === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectQuality(preset.id)}
                  className={`p-2.5 rounded-2xl border text-left transition duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-600/30 to-indigo-900/40 border-indigo-500/80 text-white shadow-glow-brand ring-1 ring-indigo-500/50'
                      : 'bg-[#090d17]/80 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold tracking-tight">{preset.name}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow-cyan" />
                    )}
                  </div>
                  <span className="text-[10px] leading-tight opacity-75 font-mono">
                    {preset.targetFps} FPS • Q{preset.quality}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons: Start / Pause / Resume / Stop */}
      <div className="pt-4 mt-3 border-t border-slate-800/60">
        {!isStreaming ? (
          <button
            onClick={onStartSharing}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-glow-brand hover:shadow-indigo-500/50 transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            {isStarting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Starting Stream...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Sharing Screen</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {isPaused ? (
              <button
                onClick={onResumeSharing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Stream</span>
              </button>
            ) : (
              <button
                onClick={onPauseSharing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause Stream</span>
              </button>
            )}

            <button
              onClick={onStopSharing}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-sm rounded-2xl border border-rose-500/40 transition cursor-pointer"
              title="Stop Screen Streaming"
            >
              <Square className="w-4 h-4 fill-rose-300" />
              <span>Stop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
