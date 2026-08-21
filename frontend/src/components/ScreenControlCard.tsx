import React from 'react';
import { Play, Square, Pause, Tv, Zap, Monitor } from 'lucide-react';
import { ServerStatus, DisplayInfo, QualityPreset } from '../types';

interface ScreenControlCardProps {
  status: ServerStatus;
  isScreenActive: boolean;
  isPaused: boolean;
  displays: DisplayInfo[];
  selectedDisplayId: string;
  qualityPresets: QualityPreset[];
  selectedQuality: string;
  onStartShare: () => void;
  onStopShare: () => void;
  onPauseShare: () => void;
  onResumeShare: () => void;
  onSelectDisplay: (id: string) => void;
  onSelectQuality: (id: string) => void;
}

export const ScreenControlCard: React.FC<ScreenControlCardProps> = ({
  isScreenActive,
  isPaused,
  displays,
  selectedDisplayId,
  qualityPresets,
  selectedQuality,
  onStartShare,
  onStopShare,
  onPauseShare,
  onResumeShare,
  onSelectDisplay,
  onSelectQuality,
}) => {
  return (
    <div className="card-base p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Screen Capture Controls</h2>
            <p className="text-[11px] text-slate-500">Live display selection and framerate tuning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isScreenActive ? (
            isPaused ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Stream Paused
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Streaming Live
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Idle
            </span>
          )}
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Display Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select Display</span>
          </label>
          <select
            value={selectedDisplayId}
            onChange={(e) => onSelectDisplay(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 shadow-2xs cursor-pointer"
          >
            {displays.length === 0 ? (
              <option value="0">Primary Screen (Default)</option>
            ) : (
              displays.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.isPrimary ? '• Primary' : ''} ({d.resolution || 'HD'})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Quality Presets */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Framerate & Quality</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {qualityPresets.map((preset) => {
              const isSelected = selectedQuality === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectQuality(preset.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90'
                  }`}
                >
                  {preset.targetFps} FPS
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Stream Action Buttons */}
      <div className="pt-2">
        {!isScreenActive ? (
          <button
            onClick={onStartShare}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Sharing Screen</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {isPaused ? (
              <button
                onClick={onResumeShare}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume Stream</span>
              </button>
            ) : (
              <button
                onClick={onPauseShare}
                className="py-3 px-4 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause Stream</span>
              </button>
            )}

            <button
              onClick={onStopShare}
              className="py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Stop Stream</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
