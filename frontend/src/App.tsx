import React, { useState, useEffect, useCallback } from 'react';
import {
  DisplayInfo,
  QualityPreset,
  PendingRequest,
  ConnectedViewer,
  ChatMessage,
  ServerStatus,
} from './types';
import { ScreenControlCard } from './components/ScreenControlCard';
import { ShareUrlCard } from './components/ShareUrlCard';
import { PendingRequestsCard } from './components/PendingRequestsCard';
import { ConnectedViewersCard } from './components/ConnectedViewersCard';
import { AnnouncementCard } from './components/AnnouncementCard';
import { QrCodeModal } from './components/QrCodeModal';
import {
  GetSystemInfo,
  GetDisplays,
  SelectDisplay,
  GetQualityPresets,
  SetQualityPreset,
  StartSharing,
  StopSharing,
  PauseScreenShare,
  ResumeScreenShare,
  IsScreenPaused,
  IsScreenStreaming,
  GetSharingStatus,
  GetClients,
  ApproveClient,
  RejectClient,
  ApproveAll,
  DisconnectClient,
  DisconnectAll,
  SendCodeSnippet,
  SendChatMessage,
  GetChatMessages,
  ClearChatHistory,
} from '../wailsjs/go/main/App';
import { EventsOn } from '../wailsjs/runtime/runtime';

const DEFAULT_PRESETS: QualityPreset[] = [
  { id: '30fps', name: '30 FPS (Smooth 1080p)', description: 'Minimum 30 FPS • Recommended', maxHeight: 1080, quality: 82, targetFps: 30 },
  { id: '60fps', name: '60 FPS (Pro Motion)', description: '60 FPS Ultra • Zero Stutter', maxHeight: 1080, quality: 78, targetFps: 60 },
  { id: '45fps', name: '45 FPS (High Action)', description: '45 FPS • High Motion Fluidity', maxHeight: 1080, quality: 80, targetFps: 45 },
  { id: 'clarity_30', name: '30 FPS (Crisp Text)', description: '30 FPS • Q88 Razor Sharp', maxHeight: 1080, quality: 88, targetFps: 30 },
];

export default function App() {
  const [status, setStatus] = useState<ServerStatus>('stopped');
  const [isScreenActive, setIsScreenActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplay, setSelectedDisplay] = useState<string>('display-0');
  const [qualityPresets, setQualityPresets] = useState<QualityPreset[]>(DEFAULT_PRESETS);
  const [selectedQuality, setSelectedQuality] = useState<string>('30fps');
  const [ipAddresses, setIpAddresses] = useState<string[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('127.0.0.1');
  const [port, setPort] = useState<number>(8080);
  
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connectedViewers, setConnectedViewers] = useState<ConnectedViewer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
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
      if (typeof IsScreenStreaming === 'function') {
        const screenRunning = await IsScreenStreaming();
        setIsScreenActive(screenRunning);
      }
      if (typeof IsScreenPaused === 'function') {
        const paused = await IsScreenPaused();
        setIsPaused(paused);
      }
      if (typeof GetChatMessages === 'function') {
        const msgs = await GetChatMessages();
        if (Array.isArray(msgs)) setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to sync state:', err);
    }
  }, [updateClientStateFromData]);

  useEffect(() => {
    async function init() {
      try {
        if (typeof GetSystemInfo === 'function') {
          const sysInfo = await GetSystemInfo();
          if (sysInfo && sysInfo.ipAddresses && sysInfo.ipAddresses.length > 0) {
            setIpAddresses(sysInfo.ipAddresses);
            setSelectedIp(sysInfo.ipAddresses[0]);
            if (sysInfo.defaultPort) {
              setPort(sysInfo.defaultPort);
            }
          }
        }

        if (typeof GetDisplays === 'function') {
          const dispList = await GetDisplays();
          if (dispList && dispList.length > 0) {
            setDisplays(dispList);
            const primary = dispList.find((d) => d.isPrimary) || dispList[0];
            setSelectedDisplay(primary.id);
          }
        }

        if (typeof GetQualityPresets === 'function') {
          const presets = await GetQualityPresets();
          if (presets && presets.length > 0) {
            setQualityPresets(presets);
            setSelectedQuality(presets[0].id);
          }
        }

        await syncClients();
      } catch (err) {
        console.error('Init error:', err);
      }
    }

    init();

    try {
      if (typeof EventsOn === 'function') {
        EventsOn('clients_updated', (data: any) => {
          updateClientStateFromData(data);
        });

        EventsOn('messages_updated', (newMessages: any) => {
          if (Array.isArray(newMessages)) setMessages(newMessages);
        });

        EventsOn('server_state_changed', (state: any) => {
          if (state && state.status) {
            setStatus(state.status === 'running' ? 'running' : 'stopped');
            if (state.port) setPort(state.port);
            if (typeof state.screenActive === 'boolean') {
              setIsScreenActive(state.screenActive);
            }
            if (typeof state.isPaused === 'boolean') {
              setIsPaused(state.isPaused);
            }
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
      setIsScreenActive(true);
      setIsPaused(false);
      await syncClients();
      showNotification(`Live screen share active on ${shareUrl}`, 'success');
    } catch (err: any) {
      setStatus('error');
      showNotification(`Failed to start sharing: ${err?.message || err}`, 'error');
    }
  };

  const handlePauseSharing = async () => {
    try {
      if (typeof PauseScreenShare === 'function') {
        await PauseScreenShare();
      }
      setIsPaused(true);
      showNotification('Screen share paused — viewers now playing Memory Game!', 'info');
    } catch (err: any) {
      showNotification(`Error pausing sharing: ${err?.message || err}`, 'error');
    }
  };

  const handleResumeSharing = async () => {
    try {
      if (typeof ResumeScreenShare === 'function') {
        await ResumeScreenShare();
      }
      setIsPaused(false);
      setIsScreenActive(true);
      showNotification('Screen share resumed live for all viewers', 'success');
    } catch (err: any) {
      showNotification(`Error resuming sharing: ${err?.message || err}`, 'error');
    }
  };

  const handleStopSharing = async () => {
    try {
      if (typeof StopSharing === 'function') {
        await StopSharing();
      }
      setIsScreenActive(false);
      setIsPaused(false);
      showNotification('Screen video stream stopped (chat & code sharing remains active)', 'info');
    } catch (err: any) {
      showNotification(`Error stopping sharing: ${err?.message || err}`, 'error');
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
        showNotification(`Stream profile: ${preset.name}`, 'info');
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

  const handleDisconnectClient = async (id: string) => {
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

  const handleSendMessage = async (message: string) => {
    try {
      if (typeof SendChatMessage === 'function') {
        await SendChatMessage(message);
      }
      showNotification('Message broadcasted to viewer sidebar', 'success');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleSendCodeSnippet = async (title: string, code: string, language: string) => {
    try {
      if (typeof SendCodeSnippet === 'function') {
        await SendCodeSnippet(title, code, language);
      }
      showNotification(`Code snippet "${title}" sent to viewer sidebars`, 'success');
    } catch (err) {
      console.error('Send code error:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      if (typeof ClearChatHistory === 'function') {
        await ClearChatHistory();
      }
      setMessages([]);
      showNotification('Chat history cleared', 'info');
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-[#090d17]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 rounded-2xl shadow-glow-brand text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">ScreenLink</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                30–60 FPS HD
              </span>
            </div>
            <p className="text-xs text-slate-400">Ultra-Fast Local Screen Mirroring & Code Broadcast</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'running'
                  ? isPaused
                    ? 'bg-amber-400'
                    : 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-semibold text-slate-300 capitalize">
              {status === 'running' ? (isPaused ? 'Screen Paused' : 'Server Online') : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Host Dashboard Grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Row 1: Screen Controls & Share URL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ScreenControlCard
              status={status}
              isScreenActive={isScreenActive}
              isPaused={isPaused}
              displays={displays}
              selectedDisplay={selectedDisplay}
              onSelectDisplay={handleSelectDisplay}
              qualityPresets={qualityPresets}
              selectedQuality={selectedQuality}
              onSelectQuality={handleSelectQuality}
              onStartSharing={handleStartSharing}
              onPauseSharing={handlePauseSharing}
              onResumeSharing={handleResumeSharing}
              onStopSharing={handleStopSharing}
            />
          </div>

          <div className="lg:col-span-5">
            <ShareUrlCard
              status={status}
              url={shareUrl}
              ipAddresses={ipAddresses}
              selectedIp={selectedIp}
              onSelectIp={setSelectedIp}
              onShowQr={() => setIsQrModalOpen(true)}
            />
          </div>
        </div>

        {/* Row 2: Live Viewers Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PendingRequestsCard
            requests={pendingRequests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
            onApproveAll={handleApproveAll}
          />
          <ConnectedViewersCard
            viewers={connectedViewers}
            onDisconnect={handleDisconnectClient}
            onDisconnectAll={handleDisconnectAll}
          />
        </div>

        {/* Row 3: Live Code & Text Broadcaster */}
        <div>
          <AnnouncementCard
            status={status}
            messages={messages}
            onSendMessage={handleSendMessage}
            onSendCode={handleSendCodeSnippet}
            onClearMessages={handleClearHistory}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 bg-[#07090e] text-center text-xs text-slate-500">
        ScreenLink • High-Framerate LAN Mirroring & Live Code Streaming
      </footer>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={shareUrl}
      />
    </div>
  );
}
