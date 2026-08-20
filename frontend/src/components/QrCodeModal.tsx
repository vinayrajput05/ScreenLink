import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, Wifi } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, url }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 bg-[#0e1322] border border-cyan-500/30 rounded-3xl shadow-2xl text-center ring-1 ring-cyan-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl mb-3">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Scan with Phone Camera</h3>
        <p className="text-xs text-slate-400 mb-5">
          Connect instantly from any phone or tablet on the same Wi-Fi
        </p>

        <div className="inline-flex p-4 bg-white rounded-2xl shadow-xl shadow-black/50 mb-5 ring-4 ring-cyan-500/20">
          <QRCodeSVG value={url} size={190} level="M" />
        </div>

        <div className="flex items-center justify-between p-3 bg-[#080b14] border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 mb-4">
          <span className="truncate mr-2 font-semibold">{url}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-sans font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 text-left">
          <Wifi className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>Device must be on the same local Wi-Fi. Host approval will be requested automatically.</span>
        </div>
      </div>
    </div>
  );
};
