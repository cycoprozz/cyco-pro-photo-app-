export interface HeadshotStyle {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  previewColor: string;
}

export interface BackgroundOption {
  id: string;
  name: string;
  promptModifier: string;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  resultImage: string | null;
}

export interface HistoryItem {
  image: string;
  timestamp: number;
  label: string;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  CONFIG = 'CONFIG',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}
