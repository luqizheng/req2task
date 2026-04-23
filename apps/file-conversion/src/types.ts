export interface ConversionResult {
  success: boolean;
  text?: string;
  error?: string;
  duration: number;
}

export interface AsyncJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  input: {
    mimeType: string;
    originalName: string;
  };
  result?: {
    text: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface SyncConvertRequest {
  file: string;
  mimeType: string;
  originalName: string;
}

export interface AsyncConvertRequest {
  file: string;
  mimeType: string;
  originalName: string;
  callbackUrl?: string;
}

export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'audio/mpeg'
  | 'audio/mp3'
  | 'audio/wav'
  | 'audio/x-wav'
  | 'audio/mp4'
  | 'audio/x-m4a';

export const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
];

export function isPdf(mimeType: string): boolean {
  return mimeType === 'application/pdf' || mimeType === 'application/x-pdf';
}

export function isDocx(mimeType: string): boolean {
  return (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  );
}

export function isAudio(mimeType: string): boolean {
  const audioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/x-m4a',
  ];
  return audioTypes.includes(mimeType.toLowerCase());
}
