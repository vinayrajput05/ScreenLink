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
    <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Share URL</h2>
              <p className="text-xs text-slate-400">Viewers open this local link in their web browser</p>
            </div>
          </div>

          {isRunning && ipAddresses.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Interface:</span>
              <select
                value={selectedIp}
                onChange={(e) => onSelectIp(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-700/70 rounded text-xs text-slate-300 focus:outline-none"
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
            className={`flex items-center justify-between px-4 py-3.5 rounded-xl border font-mono text-sm transition ${
              isRunning
                ? 'bg-slate-900/90 border-indigo-500/40 text-indigo-300 shadow-inner'
                : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Globe className={`w-4 h-4 shrink-0 ${isRunning ? 'text-indigo-400' : 'text-slate-600'}`} />
              <span className="truncate select-all">{isRunning ? url : 'http://--.--.--.--:8080'}</span>
            </div>

            {isRunning && (
              <span className="text-[10px] px-1.5 py-0.5 uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shrink-0">
                LAN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-800/60">
        <button
          onClick={handleCopy}
          disabled={!isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/70 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
        </button>

        <button
          onClick={onShowQr}
          disabled={!isRunning}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-indigo-400" />
          <span>Show QR Code</span>
        </button>
      </div>
    </div>
  );
};
