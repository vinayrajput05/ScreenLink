import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ScreenControlCard } from './components/ScreenControlCard';
import { ShareUrlCard } from './components/ShareUrlCard';
import { YouTubeLiveCard } from './components/YouTubeLiveCard';
import { PendingRequestsCard } from './components/PendingRequestsCard';
import { ConnectedViewersCard } from './components/ConnectedViewersCard';
import { AnnouncementCard } from './components/AnnouncementCard';
import { QrCodeModal } from './components/QrCodeModal';
import {
  DisplayInfo,
  QualityPreset,
  YouTubeStatus,
  PendingRequest,
  ConnectedViewer,
  Announcement,
  ServerStatus,
} from './types';
import { Sparkles, Cast, CheckCircle2, AlertCircle } from 'lucide-react';

// Import Wails runtime and bindings
import {
  GetDisplays,
  GetQualityPresets,
  SetQualityPreset,
  GetSystemInfo,
  GetSharingStatus,
  StartSharing,
  StopSharing,
  StartYouTubeStream,
  StopYouTubeStream,
  GetYouTubeStreamStatus,
  IsFFmpegInstalled,
  ApproveClient,
  RejectClient,
  ApproveAll,
  DisconnectClient,
  DisconnectAll,
  SendAnnouncement,
  GetClients,
  SelectDisplay,
} from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';

const DEFAULT_PRESETS: QualityPreset[] = [
  { id: 'hd', name: '720p HD', description: 'Smooth (24 FPS) • Low Bandwidth', maxHeight: 720, quality: 60, targetFps: 24 },
  { id: 'fhd', name: '1080p Full HD', description: 'Balanced (20 FPS) • Recommended', maxHeight: 1080, quality: 72, targetFps: 20 },
  { id: '2k', name: '2K / Retina', description: 'Crisp Text (18 FPS) • Code Demos', maxHeight: 1440, quality: 85, targetFps: 18 },
  { id: '4k', name: '4K Ultra', description: 'Max Fidelity (15 FPS) • Lossless Detail', maxHeight: 2160, quality: 93, targetFps: 15 },
];

export default function App() {
  const [status, setStatus] = useState<ServerStatus>('stopped');
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<string>('display-0');
  const [qualityPresets, setQualityPresets] = useState<QualityPreset[]>(DEFAULT_PRESETS);
  const [selectedQuality, setSelectedQuality] = useState<string>('fhd');
  const [ipAddresses, setIpAddresses] = useState<string[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('127.0.0.1');
  const [port, setPort] = useState<number>(8080);
  
  // YouTube Live State
  const [ytStatus, setYtStatus] = useState<YouTubeStatus>({
    status: 'offline',
    isLive: false,
    uptimeSeconds: 0,
    rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
  });
  const [isFFmpegInstalled, setIsFFmpegInstalled] = useState<boolean>(true);

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connectedViewers, setConnectedViewers] = useState<ConnectedViewer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.msg === msg ? null : curr));
    }, 3500);
  };

  const updateClientStateFromData = useCallback((data: any) => {
    if (!data) return;
    const rawPending = Array.isArray(data.pending) ? data.pending : [];
    const rawConnected = Array.isArray(data.connected) ? data.connected : [];

    setPendingRequests(
      rawPending.map((p: any) => ({
        id: p.id,
        displayName: p.displayName || 'Unknown Device',
        ip: p.ip || '',
        browser: p.browser || 'Web Browser',
        requestedAt: p.requestedAt || 'Just now',
      }))
    );

    setConnectedViewers(
      rawConnected.map((c: any) => ({
        id: c.id,
        displayName: c.displayName || 'Connected Viewer',
        ip: c.ip || '',
        browser: c.browser || 'Web Browser',
        connectedAt: c.connectedAt || 'Just now',
        durationMinutes: c.durationMinutes || 0,
      }))
    );
  }, []);

  const syncClients = useCallback(async () => {
    try {
      if (typeof GetClients === 'function') {
        const data = await GetClients();
        updateClientStateFromData(data);
      }
      if (typeof GetSharingStatus === 'function') {
        const running = await GetSharingStatus();
        setStatus(running ? 'running' : 'stopped');
      }
      if (typeof GetYouTubeStreamStatus === 'function') {
        const yt = await GetYouTubeStreamStatus();
        if (yt) setYtStatus(yt);
      }
    } catch (err) {
      console.error('Failed to sync state:', err);
    }
  }, [updateClientStateFromData]);

  useEffect(() => {
    async function init() {
      try {
        if (typeof GetDisplays === 'function') {
          const dispList = await GetDisplays();
          if (dispList && dispList.length > 0) {
            setDisplays(dispList);
            setSelectedDisplay(dispList[0].id);
          }
        }

        if (typeof GetQualityPresets === 'function') {
          const presets = await GetQualityPresets();
          if (presets && presets.length > 0) {
            setQualityPresets(presets);
          }
        }

        if (typeof IsFFmpegInstalled === 'function') {
          const installed = await IsFFmpegInstalled();
          setIsFFmpegInstalled(installed);
        }

        if (typeof GetSystemInfo === 'function') {
          const sys = await GetSystemInfo();
          if (sys && Array.isArray(sys.ipAddresses) && sys.ipAddresses.length > 0) {
            setIpAddresses(sys.ipAddresses);
            setSelectedIp(sys.ipAddresses[0]);
            if (sys.defaultPort) setPort(sys.defaultPort);
          }
        }

        if (typeof GetSharingStatus === 'function') {
          const isRunning = await GetSharingStatus();
          setStatus(isRunning ? 'running' : 'stopped');
        }

        if (typeof GetYouTubeStreamStatus === 'function') {
          const yt = await GetYouTubeStreamStatus();
          if (yt) setYtStatus(yt);
        }

        await syncClients();
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }

    init();

    try {
      if (typeof EventsOn === 'function') {
        EventsOn('clients_updated', (data: any) => {
          updateClientStateFromData(data);
        });

        EventsOn('server_state_changed', (payload: any) => {
          if (payload?.status) {
            setStatus(payload.status);
          }
        });

        EventsOn('youtube_status_changed', (payload: any) => {
          if (payload) {
            setYtStatus(payload);
          }
        });
      }
    } catch (err) {
      console.log('EventsOn not available in standalone web mode');
    }

    const interval = setInterval(syncClients, 1000);
    return () => clearInterval(interval);
  }, [syncClients, updateClientStateFromData]);

  const shareUrl = `http://${selectedIp}:${port}`;

  const handleStartSharing = async () => {
    setStatus('starting');
    try {
      if (typeof StartSharing === 'function') {
        await StartSharing(port);
      }
      setStatus('running');
      await syncClients();
      showNotification(`Live share active on ${shareUrl}`, 'success');
    } catch (err: any) {
      setStatus('error');
      showNotification(`Failed to start sharing: ${err?.message || err}`, 'error');
    }
  };

  const handleStopSharing = async () => {
    try {
      if (typeof StopSharing === 'function') {
        await StopSharing();
      }
      setStatus('stopped');
      setPendingRequests([]);
      setConnectedViewers([]);
      showNotification('Screen sharing stopped', 'info');
    } catch (err: any) {
      showNotification(`Error stopping sharing: ${err?.message || err}`, 'error');
    }
  };

  const handleStartYouTube = async (streamKey: string, rtmpServer: string) => {
    try {
      if (typeof StartYouTubeStream === 'function') {
        await StartYouTubeStream(streamKey, rtmpServer);
      }
      showNotification('Connecting to YouTube Live...', 'info');
    } catch (err: any) {
      showNotification(`YouTube Live Error: ${err?.message || err}`, 'error');
    }
  };

  const handleStopYouTube = async () => {
    try {
      if (typeof StopYouTubeStream === 'function') {
        await StopYouTubeStream();
      }
      showNotification('YouTube live stream ended', 'info');
    } catch (err: any) {
      showNotification(`Error stopping YouTube stream: ${err?.message || err}`, 'error');
    }
  };

  const handleSelectQuality = async (presetId: string) => {
    setSelectedQuality(presetId);
    try {
      if (typeof SetQualityPreset === 'function') {
        await SetQualityPreset(presetId);
      }
      const preset = qualityPresets.find((q) => q.id === presetId);
      if (preset) {
        showNotification(`Stream quality set to ${preset.name} (${preset.targetFps} FPS)`, 'info');
      }
    } catch (err) {
      console.error('Quality preset error:', err);
    }
  };

  const handleSelectDisplay = (id: string) => {
    setSelectedDisplay(id);
    if (typeof SelectDisplay === 'function') {
      SelectDisplay(id);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      if (typeof ApproveClient === 'function') {
        await ApproveClient(id);
      }
      await syncClients();
      showNotification('Viewer approved and connected', 'success');
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      if (typeof RejectClient === 'function') {
        await RejectClient(id);
      }
      await syncClients();
      showNotification('Viewer access rejected', 'info');
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  const handleApproveAll = async () => {
    try {
      if (typeof ApproveAll === 'function') {
        await ApproveAll();
      }
      await syncClients();
      showNotification('Approved all pending viewers', 'success');
    } catch (err) {
      console.error('Approve all error:', err);
    }
  };

  const handleDisconnectViewer = async (id: string) => {
    try {
      if (typeof DisconnectClient === 'function') {
        await DisconnectClient(id);
      }
      await syncClients();
      showNotification('Viewer disconnected', 'info');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const handleDisconnectAll = async () => {
    try {
      if (typeof DisconnectAll === 'function') {
        await DisconnectAll();
      }
      await syncClients();
      showNotification('Disconnected all viewers', 'info');
    } catch (err) {
      console.error('Disconnect all error:', err);
    }
  };

  const handleSendAnnouncement = async (message: string) => {
    try {
      if (typeof SendAnnouncement === 'function') {
        await SendAnnouncement(message);
      }
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        message,
        sentAt: 'Just now',
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
      showNotification('Announcement broadcasted to viewers', 'success');
    } catch (err) {
      console.error('Announcement error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Header status={status} viewerCount={connectedViewers.length} />

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Control Grid: Display & Share URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScreenControlCard
            status={status}
            displays={displays}
            selectedDisplay={selectedDisplay}
            onSelectDisplay={handleSelectDisplay}
            qualityPresets={qualityPresets}
            selectedQuality={selectedQuality}
            onSelectQuality={handleSelectQuality}
            onStartSharing={handleStartSharing}
            onStopSharing={handleStopSharing}
          />

          <ShareUrlCard
            status={status}
            url={shareUrl}
            ipAddresses={ipAddresses}
            selectedIp={selectedIp}
            onSelectIp={setSelectedIp}
            onShowQr={() => setIsQrModalOpen(true)}
          />
        </div>

        {/* YouTube Live Streaming Section */}
        <div>
          <YouTubeLiveCard
            status={ytStatus}
            isFFmpegInstalled={isFFmpegInstalled}
            onStartStream={handleStartYouTube}
            onStopStream={handleStopYouTube}
          />
        </div>

        {/* Middle Section: Pending Requests + Active Viewers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <PendingRequestsCard
            requests={pendingRequests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onApproveAll={handleApproveAll}
          />

          <ConnectedViewersCard
            viewers={connectedViewers}
            onDisconnect={handleDisconnectViewer}
            onDisconnectAll={handleDisconnectAll}
          />
        </div>

        {/* Bottom Section: Host Announcement */}
        <div>
          <AnnouncementCard
            status={status}
            announcements={announcements}
            onSendAnnouncement={handleSendAnnouncement}
          />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-4 border-t border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
        <span className="font-semibold text-slate-300">ScreenLink v1.0</span>
        <span>•</span>
        <span>LAN IP: <strong className="font-mono text-cyan-400">{selectedIp}</strong></span>
        <span>•</span>
        <span>
          YouTube Live: <strong className={ytStatus.isLive ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            {ytStatus.isLive ? '🔴 LIVE' : 'Offline'}
          </strong>
        </span>
      </footer>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#0e1424] border border-indigo-500/40 text-slate-100 text-xs font-semibold rounded-2xl shadow-2xl animate-bounce">
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={shareUrl}
      />
    </div>
  );
}
