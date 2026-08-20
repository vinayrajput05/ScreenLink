import React from 'react';
import { Monitor, Play, Square, RefreshCw, Layers, Radio, Sliders } from 'lucide-react';
import { DisplayInfo, QualityPreset, ServerStatus } from '../types';

interface ScreenControlCardProps {
  status: ServerStatus;
  displays: DisplayInfo[];
  selectedDisplay: string;
  onSelectDisplay: (id: string) => void;
  qualityPresets: QualityPreset[];
  selectedQuality: string;
  onSelectQuality: (id: string) => void;
  onStartSharing: () => void;
  onStopSharing: () => void;
}

export const ScreenControlCard: React.FC<ScreenControlCardProps> = ({
  status,
  displays,
  selectedDisplay,
  onSelectDisplay,
  qualityPresets,
  selectedQuality,
  onSelectQuality,
  onStartSharing,
  onStopSharing,
}) => {
  const isRunning = status === 'running';
  const isStarting = status === 'starting';

  const currentDisplay = displays.find((d) => d.id === selectedDisplay) || displays[0];
  const currentPreset = qualityPresets.find((q) => q.id === selectedQuality) || qualityPresets[1];

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
              <h2 className="text-base font-bold text-white tracking-tight">Display & Stream Quality</h2>
              <p className="text-xs text-slate-400">Configure monitor capture and resolution profile</p>
            </div>
          </div>

          {isRunning && currentPreset && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px] font-mono text-emerald-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{currentPreset.targetFps} FPS • {currentPreset.name}</span>
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
              disabled={isRunning || isStarting}
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

        {/* Stream Quality Selector Grid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Stream Quality Preset</span>
            </label>
            {isRunning && (
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

      {/* Action Button */}
      <div className="pt-4 mt-3 border-t border-slate-800/60">
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
