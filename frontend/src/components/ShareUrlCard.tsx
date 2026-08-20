import React from 'react';
import { Link2, Copy, Check, QrCode, Globe, Wifi } from 'lucide-react';
import { ServerStatus } from '../types';

interface ShareUrlCardProps {
  status: ServerStatus;
  url: string;
  ipAddresses: string[];
  selectedIp: string;
  onSelectIp: (ip: string) => void;
  onShowQr: () => void;
}

export const ShareUrlCard: React.FC<ShareUrlCardProps> = ({
  status,
  url,
  ipAddresses,
  selectedIp,
  onSelectIp,
  onShowQr,
}) => {
  const [copied, setCopied] = React.useState(false);
  const isRunning = status === 'running';

  const handleCopy = () => {
    if (!isRunning) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shadow-inner">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Viewer Connection URL</h2>
              <p className="text-xs text-slate-400">Viewers open this link in mobile or desktop browser</p>
            </div>
          </div>

          {isRunning && ipAddresses.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">IP:</span>
              <select
                value={selectedIp}
                onChange={(e) => onSelectIp(e.target.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {ipAddresses.map((ip) => (
                  <option key={ip} value={ip}>
                    {ip}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Share Link Display Box */}
        <div className="relative">
          <div
            className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border font-mono text-sm transition-all duration-200 ${
              isRunning
                ? 'bg-[#090d17]/95 border-cyan-500/50 text-cyan-300 shadow-inner ring-1 ring-cyan-500/20'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <Wifi className={`w-4 h-4 shrink-0 ${isRunning ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
              <span className="truncate select-all font-semibold tracking-wide">
                {isRunning ? url : 'http://--.--.--.--:8080'}
              </span>
            </div>

            {isRunning && (
              <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider rounded-md bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shrink-0">
                LAN Ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 px-1">
            {isRunning
              ? '✨ Devices on the same Wi-Fi can open this link to request screen view.'
              : 'Click "Start Sharing Screen" above to activate the local URL.'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-800/60">
        <button
          onClick={handleCopy}
          disabled={!isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-2xl border border-slate-700 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
          <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
        </button>

        <button
          onClick={onShowQr}
          disabled={!isRunning}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-2xl border border-cyan-500/30 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-glow-cyan"
        >
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>Show QR Code</span>
        </button>
      </div>
    </div>
  );
};
