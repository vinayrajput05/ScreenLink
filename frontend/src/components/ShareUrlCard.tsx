import React, { useState } from 'react';
import { Link2, Copy, Check, QrCode, Wifi } from 'lucide-react';

interface ShareUrlCardProps {
  shareUrl: string;
  onShowQr: () => void;
}

export const ShareUrlCard: React.FC<ShareUrlCardProps> = ({ shareUrl, onShowQr }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="card-base p-6 flex flex-col justify-between h-full space-y-4">
      {/* Card Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Link2 className="w-4 h-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-800 tracking-tight">Share Link</h2>
      </div>

      {/* URL Display Box */}
      <div className="bg-[#f8fafc] border border-slate-200/90 rounded-xl p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-lg md:text-xl text-indigo-600 tracking-tight select-all break-all">
            {shareUrl || 'http://127.0.0.1:8080'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs">
            <Wifi className="w-3 h-3" />
            <span>LAN READY</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Devices on the same Wi-Fi can open this link to request access.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-xs transition-all duration-150 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={onShowQr}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-200/90 font-semibold text-xs rounded-xl shadow-2xs transition-all duration-150 cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
          <span>Show QR Code</span>
        </button>
      </div>
    </div>
  );
};
