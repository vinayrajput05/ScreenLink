import React, { useState } from 'react';
import { Link2, Copy, Check, QrCode, Wifi, Monitor, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

interface ShareUrlCardProps {
  shareUrl: string;
  availableUrls: string[];
  onSelectShareUrl?: (url: string) => void;
  onShowQr: (url?: string) => void;
}

export const ShareUrlCard: React.FC<ShareUrlCardProps> = ({
  shareUrl,
  availableUrls,
  onSelectShareUrl,
  onShowQr,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const displayUrls = availableUrls && availableUrls.length > 0
    ? availableUrls
    : [shareUrl || 'http://127.0.0.1:8080'];

  const handleCopy = async (urlToCopy: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!urlToCopy) return;
    const ok = await copyToClipboard(urlToCopy);
    if (ok) {
      setCopiedUrl(urlToCopy);
      setTimeout(() => {
        setCopiedUrl((prev) => (prev === urlToCopy ? null : prev));
      }, 2000);
    }
  };

  const handleOpenBrowser = (urlToOpen: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (typeof BrowserOpenURL === 'function') {
        BrowserOpenURL(urlToOpen);
        return;
      }
    } catch {
      // Fallback
    }
    window.open(urlToOpen, '_blank');
  };

  const getUrlTypeInfo = (url: string, index: number) => {
    const isLocalhost = url.includes('127.0.0.1') || url.includes('localhost');
    if (isLocalhost) {
      return {
        label: 'Localhost',
        subtitle: 'For testing in local browser on this device',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/90',
        icon: Monitor,
        isPrimary: false,
      };
    }

    const isPrimaryLan = index === 0 || (!displayUrls[0].includes('127.0.0.1') && index === 0);
    if (isPrimaryLan) {
      return {
        label: 'Wi-Fi / LAN',
        badgeSuffix: 'RECOMMENDED',
        subtitle: 'For phones, tablets & laptops on the same Wi-Fi',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 shadow-2xs',
        icon: Wifi,
        isPrimary: true,
      };
    }

    return {
      label: `Network #${index + 1}`,
      subtitle: 'Alternative network adapter / subnet',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/90',
      icon: Globe,
      isPrimary: false,
    };
  };

  return (
    <div className="card-base p-6 flex flex-col justify-between space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Available Share Links</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Viewers on your network can open any of these URLs
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 shadow-2xs">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>{displayUrls.length} {displayUrls.length === 1 ? 'Link' : 'Links'} Ready</span>
        </span>
      </div>

      {/* Available Links List */}
      <div className="space-y-2.5">
        {displayUrls.map((url, idx) => {
          const isSelected = (shareUrl === url) || (displayUrls.length === 1);
          const typeInfo = getUrlTypeInfo(url, idx);
          const TypeIcon = typeInfo.icon;
          const isCopied = copiedUrl === url;

          return (
            <div
              key={url}
              onClick={() => onSelectShareUrl?.(url)}
              className={`group relative rounded-xl p-3.5 border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-[#f8fafc] border-slate-200/90 hover:border-indigo-200 hover:bg-slate-50/90'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Left info & URL */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-500 border-slate-200 group-hover:border-indigo-200'
                    }`}
                  >
                    <TypeIcon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeInfo.badgeClass}`}>
                        {typeInfo.label}
                      </span>
                      {typeInfo.badgeSuffix && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-indigo-600 text-white shadow-2xs">
                          {typeInfo.badgeSuffix}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] font-semibold text-indigo-600 ml-1">
                          ● Selected
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm md:text-base text-slate-800 tracking-tight font-mono select-all break-all group-hover:text-indigo-600 transition-colors">
                      {url}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {typeInfo.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-1 sm:pt-0">
                  <button
                    type="button"
                    title="Copy URL"
                    onClick={(e) => handleCopy(url, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    title="Show QR Code for this link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectShareUrl?.(url);
                      onShowQr(url);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">QR</span>
                  </button>

                  <button
                    type="button"
                    title="Open in default browser"
                    onClick={(e) => handleOpenBrowser(url, e)}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Quick Tip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
        <span>💡 For mobile devices, choose the <strong className="text-emerald-700 font-semibold">Wi-Fi / LAN</strong> link.</span>
        <button
          type="button"
          onClick={() => onShowQr(shareUrl)}
          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Open Fullscreen QR</span>
        </button>
      </div>
    </div>
  );
};
