import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, Wifi } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 mb-1">Scan with Phone Camera</h3>
        <p className="text-xs text-slate-500 mb-5">
          Connect instantly from any phone or tablet on the same Wi-Fi
        </p>

        <div className="inline-flex p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mb-5 ring-4 ring-indigo-50">
          <QRCodeSVG value={url} size={180} level="M" />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-mono text-indigo-600 mb-4">
          <span className="truncate mr-2 font-bold">{url}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-all shrink-0 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-slate-600 text-left font-medium">
          <Wifi className="w-4 h-4 shrink-0 text-indigo-600" />
          <span>Device must be on the same local Wi-Fi. Host approval is requested automatically.</span>
        </div>
      </div>
    </div>
  );
};
