import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm p-6 bg-[#111726] border border-slate-700/60 rounded-2xl shadow-2xl text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-white mb-1">Scan to Connect</h3>
        <p className="text-xs text-slate-400 mb-5">
          Scan this QR code on any phone, tablet, or laptop on the same Wi-Fi
        </p>

        <div className="inline-flex p-4 bg-white rounded-xl shadow-inner mb-5">
          <QRCodeSVG value={url} size={180} level="M" />
        </div>

        <div className="flex items-center justify-between p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 mb-4">
          <span className="truncate mr-2">{url}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-indigo-300 bg-indigo-500/20 hover:bg-indigo-500/30 rounded transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
          Note: Devices must be connected to the same local network. Host approval is required.
        </p>
      </div>
    </div>
  );
};
