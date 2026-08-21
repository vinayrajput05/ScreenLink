export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface DisplayInfo {
  id: string;
  name: string;
  resolution: string;
  isPrimary: boolean;
}

export interface QualityPreset {
  id: string;
  name: string;
  description: string;
  maxHeight: number;
  quality: number;
  targetFps: number;
}

export interface ChatMessage {
  id: string;
  type: 'chat' | 'code' | 'announcement' | string;
  title?: string;
  message: string;
  language?: string;
  isCode: boolean;
  sentAt: string;
  sender?: string;
}

export interface PendingRequest {
  id: string;
  displayName: string;
  ip: string;
  browser: string;
  requestedAt: string;
}

export interface ConnectedViewer {
  id: string;
  displayName: string;
  ip: string;
  browser: string;
  connectedAt: string;
  durationMinutes: number;
  bandwidthKbps?: number;
  latencyMs?: number;
  signalBars?: number;
}

export interface Announcement {
  id: string;
  message: string;
  sentAt: string;
}
