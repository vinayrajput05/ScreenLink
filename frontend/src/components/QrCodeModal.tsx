import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, Wifi, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  availableUrls?: string[];
  onSelectUrl?: (url: string) => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  url,
  availableUrls,
  onSelectUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = url || (availableUrls && availableUrls[0]) || 'http://127.0.0.1:8080';

  const handleCopy = async () => {
    const ok = await copyToClipboard(currentUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenBrowser = () => {
    try {
      if (typeof BrowserOpenURL === 'function') {
        BrowserOpenURL(currentUrl);
        return;
      }
    } catch {
      // Fallback
    }
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 bg-white border border-slate-200 rounded-3xl shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3 shadow-2xs">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">Scan with Phone Camera</h3>
        <p className="text-xs text-slate-500 mb-4">
          Connect instantly from any phone or tablet on the same Wi-Fi
        </p>

        {/* Link Switcher if multiple available */}
        {availableUrls && availableUrls.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 p-1 bg-slate-100/80 rounded-xl">
            {availableUrls.map((u) => {
              const isSelected = u === currentUrl;
              const isLocal = u.includes('127.0.0.1') || u.includes('localhost');
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => onSelectUrl?.(u)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {isLocal ? 'Localhost' : 'Wi-Fi / LAN'}
                </button>
              );
            })}
          </div>
        )}

        <div className="inline-flex p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 ring-4 ring-indigo-50">
          <QRCodeSVG value={currentUrl} size={180} level="M" />
        </div>

        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-mono text-indigo-600 mb-4">
          <span className="truncate mr-2 font-bold">{currentUrl}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleOpenBrowser}
              title="Open link"
              className="p-1 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-slate-600 text-left font-medium">
          <Wifi className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>Device must be on the same local Wi-Fi. Host approval is requested automatically.</span>
        </div>
      </div>
    </div>
  );
};
