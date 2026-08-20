import React from 'react';
import { UserCheck, Check, X, Laptop, Smartphone, Tablet, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { PendingRequest } from '../types';

interface PendingRequestsCardProps {
  requests: PendingRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll: () => void;
}

export const PendingRequestsCard: React.FC<PendingRequestsCardProps> = ({
  requests,
  onApprove,
  onReject,
  onApproveAll,
}) => {
  const getDeviceIcon = (browser: string, name: string) => {
    const text = (browser + ' ' + name).toLowerCase();
    if (text.includes('iphone') || text.includes('android') || text.includes('mobile') || text.includes('phone')) {
      return <Smartphone className="w-4 h-4 text-amber-400" />;
    }
    if (text.includes('ipad') || text.includes('tablet')) {
      return <Tablet className="w-4 h-4 text-amber-400" />;
    }
    return <Laptop className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shadow-inner">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Pending Access Requests</h2>
              {requests.length > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full animate-bounce shadow-glow-amber">
                  {requests.length} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Viewers waiting for host authorization</p>
          </div>
        </div>

        {requests.length > 1 && (
          <button
            onClick={onApproveAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-[0.98] text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition cursor-pointer shadow-glow-emerald"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve All ({requests.length})</span>
          </button>
        )}
      </div>

      {/* Requests List or Empty State */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-800/80 rounded-2xl bg-slate-900/20">
            <div className="p-3 bg-slate-800/40 rounded-2xl text-slate-500 mb-2.5">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-300">No Pending Requests</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
              When someone opens your share URL on their phone or laptop, their connection request will appear here for one-click approval.
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3.5 bg-[#0a0e1a]/90 border border-amber-500/30 rounded-2xl hover:border-amber-500/50 transition shadow-lg animate-fadeIn"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800/80 rounded-xl text-slate-300 border border-slate-700/50">
                  {getDeviceIcon(req.browser, req.displayName)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">{req.displayName}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span className="text-indigo-300 font-semibold">{req.ip}</span>
                    <span>•</span>
                    <span className="font-sans text-slate-300">{req.browser}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      {req.requestedAt}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onApprove(req.id)}
                  title="Approve Device"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold rounded-xl shadow-glow-emerald transition active:scale-[0.98] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => onReject(req.id)}
                  title="Reject Request"
                  className="flex items-center gap-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30 transition active:scale-[0.98] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
