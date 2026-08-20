import React, { useState, useEffect } from 'react';
import { Video, Eye, EyeOff, Radio, ExternalLink, AlertTriangle, CheckCircle, RefreshCw, Key, Settings2 } from 'lucide-react';
import { YouTubeStatus } from '../types';

interface YouTubeLiveCardProps {
  status: YouTubeStatus;
  isFFmpegInstalled: boolean;
  onStartStream: (streamKey: string, rtmpUrl: string) => void;
  onStopStream: () => void;
}

export const YouTubeLiveCard: React.FC<YouTubeLiveCardProps> = ({
  status,
  isFFmpegInstalled,
  onStartStream,
  onStopStream,
}) => {
  const [streamKey, setStreamKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [rtmpUrl, setRtmpUrl] = useState<string>('rtmp://a.rtmp.youtube.com/live2');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('screenlink_yt_stream_key');
    if (savedKey) setStreamKey(savedKey);

    const savedRtmp = localStorage.getItem('screenlink_yt_rtmp_url');
    if (savedRtmp) setRtmpUrl(savedRtmp);
  }, []);

  const handleKeyChange = (val: string) => {
    setStreamKey(val);
    localStorage.setItem('screenlink_yt_stream_key', val);
  };

  const handleRtmpChange = (val: string) => {
    setRtmpUrl(val);
    localStorage.setItem('screenlink_yt_rtmp_url', val);
  };

  const formatUptime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLive = status.status === 'live';
  const isConnecting = status.status === 'connecting';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLive || isConnecting) {
      onStopStream();
    } else {
      if (!streamKey.trim()) return;
      onStartStream(streamKey.trim(), rtmpUrl.trim());
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border-rose-500/30">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/15 text-rose-400 rounded-xl border border-rose-500/30 shadow-inner">
              <Video className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">YouTube Live Stream</h2>
                {isLive && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold bg-rose-600 text-white rounded-full animate-pulse shadow-lg shadow-rose-600/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    LIVE {formatUptime(status.uptimeSeconds)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Stream your screen directly to YouTube via RTMP</p>
            </div>
          </div>

          <a
            href="https://studio.youtube.com/channel/live/livestreaming"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <span>YouTube Studio</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        {/* FFmpeg status warning if not detected */}
        {!isFFmpegInstalled && (
          <div className="p-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="font-semibold">FFmpeg Not Detected:</strong> Install FFmpeg via{' '}
              <code className="px-1.5 py-0.5 bg-black/40 rounded text-amber-200">brew install ffmpeg</code> to enable RTMP live streaming.
            </div>
          </div>
        )}

        {status.errorMessage && (
          <div className="p-3 mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
            {status.errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Stream Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-rose-400" />
                <span>YouTube Stream Key</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
              >
                <Settings2 className="w-3 h-3" />
                <span>{showAdvanced ? 'Hide RTMP Settings' : 'Custom RTMP'}</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={streamKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                disabled={isLive || isConnecting}
                placeholder="Paste your YouTube stream key (e.g. abcd-1234-efgh-5678)..."
                className="w-full pl-4 pr-11 py-3 bg-[#090d17]/90 border border-slate-700/80 rounded-2xl text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 disabled:opacity-60 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Advanced RTMP Server */}
          {showAdvanced && (
            <div className="animate-fadeIn">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                RTMP Ingest Server URL
              </label>
              <input
                type="text"
                value={rtmpUrl}
                onChange={(e) => handleRtmpChange(e.target.value)}
                disabled={isLive || isConnecting}
                placeholder="rtmp://a.rtmp.youtube.com/live2"
                className="w-full px-4 py-2.5 bg-[#090d17]/90 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!isLive ? (
              <button
                type="submit"
                disabled={!streamKey.trim() || isConnecting}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting to YouTube RTMP...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 text-white animate-pulse" />
                    <span>Go Live on YouTube</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopStream}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.99] text-rose-300 hover:text-white font-bold text-sm rounded-2xl border border-rose-500/40 transition duration-200 cursor-pointer shadow-md"
              >
                <span>End YouTube Live Stream</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
