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
}

export interface Announcement {
  id: string;
  message: string;
  sentAt: string;
}
