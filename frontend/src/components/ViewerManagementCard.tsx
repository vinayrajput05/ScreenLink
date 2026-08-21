import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Laptop,
  Smartphone,
  Tablet,
  X,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';
import { PendingRequest, ConnectedViewer } from '../types';

interface ViewerManagementCardProps {
  pendingRequests: PendingRequest[];
  connectedViewers: ConnectedViewer[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveAll?: () => void;
  onDisconnect: (id: string) => void;
  onDisconnectAll?: () => void;
}

const SignalBarsMeter: React.FC<{ bars?: number }> = ({ bars = 4 }) => {
  const activeBars = Math.max(1, Math.min(4, bars));
  const getColor = () => {
    if (activeBars === 4) return 'bg-emerald-500';
    if (activeBars === 3) return 'bg-emerald-400';
    if (activeBars === 2) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const colorClass = getColor();

  return (
    <div className="flex items-end gap-[1.5px] h-2.5 w-3" title={`Signal Quality: ${activeBars}/4 bars`}>
      <span className={`w-[2.5px] rounded-xs h-[30%] ${activeBars >= 1 ? colorClass : 'bg-slate-300'}`} />
      <span className={`w-[2.5px] rounded-xs h-[55%] ${activeBars >= 2 ? colorClass : 'bg-slate-300'}`} />
      <span className={`w-[2.5px] rounded-xs h-[80%] ${activeBars >= 3 ? colorClass : 'bg-slate-300'}`} />
      <span className={`w-[2.5px] rounded-xs h-[100%] ${activeBars >= 4 ? colorClass : 'bg-slate-300'}`} />
    </div>
  );
};

const formatBandwidth = (kbps?: number) => {
  if (!kbps || kbps <= 0) return '0 KB/s';
  if (kbps >= 1024) {
    return `${(kbps / 1024).toFixed(1)} MB/s`;
  }
  return `${kbps} KB/s`;
};

export const ViewerManagementCard: React.FC<ViewerManagementCardProps> = ({
  pendingRequests,
  connectedViewers,
  onApprove,
  onReject,
  onApproveAll,
  onDisconnect,
  onDisconnectAll,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>(
    pendingRequests.length > 0 ? 'pending' : 'active'
  );

  const getDeviceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('ipad') || lower.includes('tab')) {
      return <Tablet className="w-4 h-4 text-indigo-600" />;
    }
    if (lower.includes('phone') || lower.includes('iphone') || lower.includes('android')) {
      return <Smartphone className="w-4 h-4 text-indigo-600" />;
    }
    return <Laptop className="w-4 h-4 text-indigo-600" />;
  };

  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    try {
      const date = new Date(timestamp);
      const diffSecs = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSecs < 60) return `${Math.max(1, diffSecs)}s ago`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    } catch {
      return 'Recently';
    }
  };

  const formatDuration = (connectedAt?: string) => {
    if (!connectedAt) return '00:05:12';
    try {
      const start = new Date(connectedAt).getTime();
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - start) / 1000));
      const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSecs % 60).padStart(2, '0');
      return `${hours}:${mins}:${secs}`;
    } catch {
      return '00:05:12';
    }
  };

  return (
    <div className="card-base p-6 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                pendingRequests.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {pendingRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Viewers</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                connectedViewers.length > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200/80 text-slate-600'
              }`}
            >
              {connectedViewers.length}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'pending' && pendingRequests.length > 0 && onApproveAll && (
            <button
              onClick={onApproveAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Approve All</span>
            </button>
          )}

          {activeTab === 'active' && connectedViewers.length > 0 && onDisconnectAll && (
            <button
              onClick={onDisconnectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <span>Disconnect All</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Pending Requests List */}
      {activeTab === 'pending' && (
        <div className="space-y-3 min-h-[160px]">
          {pendingRequests.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <ShieldCheck className="w-8 h-8 text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">No Pending Requests</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                New viewer connection requests will appear here for approval
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100/70 flex items-center justify-center flex-shrink-0">
                    {getDeviceIcon(req.displayName)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {req.displayName}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {req.ip || '192.168.1.15'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium mr-1 hidden sm:inline">
                    {formatTimeAgo(req.requestedAt)}
                  </span>
                  <button
                    onClick={() => onReject(req.id)}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200/80 font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Deny
                  </button>
                  <button
                    onClick={() => onApprove(req.id)}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200/80 font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Active Viewers List */}
      {activeTab === 'active' && (
        <div className="space-y-3 min-h-[160px]">
          {connectedViewers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <Users className="w-8 h-8 text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">No Active Viewers</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Approved devices will show live stream status and duration here
              </p>
            </div>
          ) : (
            connectedViewers.map((viewer) => (
              <div
                key={viewer.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition-all duration-150 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100/70 flex items-center justify-center flex-shrink-0">
                    {getDeviceIcon(viewer.displayName)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {viewer.displayName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-mono">{viewer.ip || '192.168.1.11'}</span>
                      <span>•</span>
                      <div className="inline-flex items-center gap-1 bg-slate-200/70 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 font-mono">
                        <SignalBarsMeter bars={viewer.signalBars || 4} />
                        <span>{formatBandwidth(viewer.bandwidthKbps)}</span>
                        <span className="text-slate-400">({viewer.latencyMs || 5}ms)</span>
                      </div>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="font-mono text-xs text-slate-400 font-medium">
                    {formatDuration(viewer.connectedAt)}
                  </span>
                  <button
                    onClick={() => onDisconnect(viewer.id)}
                    title="Disconnect Viewer"
                    className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
