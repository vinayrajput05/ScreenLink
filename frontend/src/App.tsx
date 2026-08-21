import React, { useState, useEffect, useCallback } from 'react';
import {
  DisplayInfo,
  QualityPreset,
  PendingRequest,
  ConnectedViewer,
  ChatMessage,
  ServerStatus,
} from './types';
import { Header } from './components/Header';
import { ShareUrlCard } from './components/ShareUrlCard';
import { ViewerManagementCard } from './components/ViewerManagementCard';
import { ScreenControlCard } from './components/ScreenControlCard';
import { AnnouncementCard } from './components/AnnouncementCard';
import { QrCodeModal } from './components/QrCodeModal';
import { MemoryGameModal } from './components/MemoryGameModal';
import {
  Shield,
  Zap,
  Tv,
  Users,
} from 'lucide-react';
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
];

export const App: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus>('running');
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shareUrl, setShareUrl] = useState('http://127.0.0.1:8080');
  const [availableUrls, setAvailableUrls] = useState<string[]>(['http://127.0.0.1:8080']);
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [selectedDisplayId, setSelectedDisplayId] = useState<string>('0');
  const [qualityPresets, setQualityPresets] = useState<QualityPreset[]>(DEFAULT_PRESETS);
  const [selectedQuality, setSelectedQuality] = useState<string>('30fps');
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [connectedViewers, setConnectedViewers] = useState<ConnectedViewer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' } | null>(null);

  const showNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const syncClients = useCallback(async () => {
    try {
      if (typeof GetClients === 'function') {
        const payload = await GetClients();
        if (payload) {
          setPendingRequests(payload.pending || []);
          setConnectedViewers(payload.connected || []);
        }
      }
    } catch (err) {
      console.error('Error syncing clients:', err);
    }
  }, []);

  const syncChat = useCallback(async () => {
    try {
      if (typeof GetChatMessages === 'function') {
        const history = await GetChatMessages();
        if (Array.isArray(history)) {
          setMessages(history);
        }
      }
    } catch (err) {
      console.error('Error syncing chat:', err);
    }
  }, []);

  const syncScreenState = useCallback(async () => {
    try {
      if (typeof IsScreenStreaming === 'function') {
        const streaming = await IsScreenStreaming();
        setIsScreenActive(Boolean(streaming));
      }
      if (typeof IsScreenPaused === 'function') {
        const paused = await IsScreenPaused();
        setIsPaused(Boolean(paused));
      }
    } catch (err) {
      console.error('Error syncing screen status:', err);
    }
  }, []);

  const syncSystemInfo = useCallback(async () => {
    try {
      if (typeof GetSystemInfo === 'function') {
        const sysInfo = await GetSystemInfo();
        if (sysInfo && Array.isArray(sysInfo.ipAddresses) && sysInfo.ipAddresses.length > 0) {
          const port = sysInfo.defaultPort || 8080;
          let validIps = sysInfo.ipAddresses;
          if (validIps.length > 1) {
            validIps = validIps.filter((ip: string) => ip !== '127.0.0.1' && ip !== 'localhost');
          }
          const urls = validIps.map((ip: string) => `http://${ip}:${port}`);

          setAvailableUrls(urls);
          setShareUrl((prev) => {
            if (urls.includes(prev)) return prev;
            return urls[0];
          });
        }
      }
    } catch (err) {
      console.error('Error syncing system info:', err);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await syncSystemInfo();
        if (typeof GetDisplays === 'function') {
          const dispList = await GetDisplays();
          if (Array.isArray(dispList) && dispList.length > 0) {
            setDisplays(dispList);
            const primary = dispList.find((d: DisplayInfo) => d.isPrimary);
            if (primary) setSelectedDisplayId(primary.id);
            else setSelectedDisplayId(dispList[0].id);
          }
        }
        if (typeof GetQualityPresets === 'function') {
          const presets = await GetQualityPresets();
          if (Array.isArray(presets) && presets.length > 0) {
            setQualityPresets(presets);
          }
        }
        if (typeof GetSharingStatus === 'function') {
          const sharing = await GetSharingStatus();
          setStatus(sharing ? 'running' : 'stopped');
        }

        await syncClients();
        await syncChat();
        await syncScreenState();
      } catch (err) {
        console.error('Init error:', err);
      }
    };

    initializeData();

    const interval = setInterval(() => {
      syncClients();
      syncScreenState();
      syncSystemInfo();
    }, 2000);

    try {
      if (typeof EventsOn === 'function') {
        EventsOn('messages_updated', (msgs: ChatMessage[]) => {
          if (Array.isArray(msgs)) {
            setMessages(msgs);
          }
        });
        EventsOn('clients_updated', (payload: any) => {
          if (payload) {
            setPendingRequests(payload.pending || []);
            setConnectedViewers(payload.connected || []);
          }
        });
        EventsOn('server_state_changed', (state: any) => {
          if (state) {
            if (state.status) setStatus(state.status);
            if (typeof state.screenActive === 'boolean') setIsScreenActive(state.screenActive);
            if (typeof state.isPaused === 'boolean') setIsPaused(state.isPaused);
          }
        });
        EventsOn('client:requested', () => {
          syncClients();
          showNotification('New viewer connection request', 'info');
        });
      }
    } catch (e) {
      console.log('EventsOn not registered:', e);
    }

    return () => clearInterval(interval);
  }, [syncClients, syncChat, syncScreenState]);

  const handleStartShare = async () => {
    try {
      if (typeof SelectDisplay === 'function') {
        await SelectDisplay(selectedDisplayId);
      }
      if (typeof SetQualityPreset === 'function') {
        await SetQualityPreset(selectedQuality);
      }
      if (typeof StartSharing === 'function') {
        await StartSharing(0);
      }
      setIsScreenActive(true);
      setIsPaused(false);
      showNotification('Screen sharing live at 30–60 FPS', 'success');
    } catch (err) {
      console.error('Start error:', err);
      showNotification('Failed to start screen share', 'warning');
    }
  };

  const handlePauseShare = async () => {
    try {
      if (typeof PauseScreenShare === 'function') {
        await PauseScreenShare();
      }
      setIsPaused(true);
      showNotification('Screen stream paused', 'info');
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  const handleResumeShare = async () => {
    try {
      if (typeof ResumeScreenShare === 'function') {
        await ResumeScreenShare();
      }
      setIsPaused(false);
      showNotification('Screen stream resumed', 'success');
    } catch (err) {
      console.error('Resume error:', err);
    }
  };

  const handleStopShare = async () => {
    try {
      if (typeof StopSharing === 'function') {
        await StopSharing();
      }
      setIsScreenActive(false);
      setIsPaused(false);
      showNotification('Screen stream stopped', 'info');
    } catch (err) {
      console.error('Stop error:', err);
    }
  };

  const handleSelectDisplay = async (id: string) => {
    setSelectedDisplayId(id);
    try {
      if (typeof SelectDisplay === 'function') {
        await SelectDisplay(id);
      }
    } catch (err) {
      console.error('Select display error:', err);
    }
  };

  const handleSelectQuality = async (id: string) => {
    setSelectedQuality(id);
    try {
      if (typeof SetQualityPreset === 'function') {
        await SetQualityPreset(id);
      }
    } catch (err) {
      console.error('Select quality error:', err);
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


  const handleSendMessage = async (text: string) => {
    try {
      if (typeof SendChatMessage === 'function') {
        await SendChatMessage(text);
      }
      await syncChat();
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleSendCode = async (code: string, lang: string, title?: string) => {
    try {
      if (typeof SendCodeSnippet === 'function') {
        await SendCodeSnippet(title || 'Code Snippet', code, lang || 'javascript');
      }
      await syncChat();
      showNotification('Code snippet broadcasted to all viewers', 'success');
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
    <div className="h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-hidden">
      {/* Top Header */}
      <Header
        status={status}
        viewerCount={connectedViewers.length}
        isPaused={isPaused}
        onOpenGame={() => setIsGameModalOpen(true)}
      />

      {/* Main Content Layout (Full Width Grid without Left Sidebar) */}
      <main className="flex-1 min-h-0 max-w-7xl w-full mx-auto p-6 overflow-hidden flex flex-col">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-between transition-all duration-200 flex-shrink-0 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : notification.type === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 ml-3 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Dashboard & Live Broadcast Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 items-stretch flex-1 overflow-hidden">
          {/* Left / Main Section (Col Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-5 overflow-y-auto pr-1 h-full min-h-0">
            {/* Share Link Card */}
            <ShareUrlCard
              shareUrl={shareUrl}
              availableUrls={availableUrls}
              onSelectShareUrl={setShareUrl}
              onShowQr={(customUrl) => {
                if (customUrl) setShareUrl(customUrl);
                setIsQrModalOpen(true);
              }}
            />

            {/* Screen Capture Controls Card */}
            <ScreenControlCard
              status={status}
              isScreenActive={isScreenActive}
              isPaused={isPaused}
              displays={displays}
              selectedDisplayId={selectedDisplayId}
              qualityPresets={qualityPresets}
              selectedQuality={selectedQuality}
              onStartShare={handleStartShare}
              onStopShare={handleStopShare}
              onPauseShare={handlePauseShare}
              onResumeShare={handleResumeShare}
              onSelectDisplay={handleSelectDisplay}
              onSelectQuality={handleSelectQuality}
            />

            {/* Unified Viewer Management Card */}
            <ViewerManagementCard
              pendingRequests={pendingRequests}
              connectedViewers={connectedViewers}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              onApproveAll={handleApproveAll}
              onDisconnect={handleDisconnectClient}
              onDisconnectAll={handleDisconnectAll}
            />
          </div>

          {/* Right Section: Live Code & Announcements (Col Span 5) */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0 overflow-hidden">
            <AnnouncementCard
              messages={messages}
              onSendMessage={handleSendMessage}
              onSendCode={handleSendCode}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        url={shareUrl}
        availableUrls={availableUrls}
        onSelectUrl={setShareUrl}
      />

      {/* 6x6 Memory Game Modal */}
      <MemoryGameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
      />
    </div>
  );
};

export default App;
