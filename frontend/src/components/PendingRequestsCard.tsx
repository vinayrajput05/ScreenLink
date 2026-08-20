import React from 'react';
import { UserCheck, Check, X, Laptop, Clock, ShieldAlert } from 'lucide-react';
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
  return (
    <div className="bg-[#111726] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Pending Requests</h2>
              {requests.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full animate-pulse">
                  {requests.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Viewers waiting for host authorization</p>
          </div>
        </div>

        {requests.length > 1 && (
          <button
            onClick={onApproveAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-500/30 transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve All</span>
          </button>
        )}
      </div>

      {/* Requests List or Empty State */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-64 pr-1">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-900/30">
            <div className="p-3 bg-slate-800/50 rounded-full text-slate-500 mb-2">
              <UserCheck className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-400">No pending connection requests</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
              When someone opens your share URL and requests access, it will appear here for approval.
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700/80 transition shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{req.displayName}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{req.ip}</span>
                    <span>•</span>
                    <span className="font-sans text-slate-400">{req.browser}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {req.requestedAt}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onApprove(req.id)}
                  title="Approve Viewer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/30 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => onReject(req.id)}
                  title="Reject Viewer"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium rounded-lg border border-rose-500/30 transition cursor-pointer"
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
