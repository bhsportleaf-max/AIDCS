export interface VoiceConfig {
  enabled: boolean;
  auto_start?: boolean;
  sample_ms?: number;
  language?: string;
  stt_endpoint?: string;
}

export interface VoiceHandlers {
  onTranscript?: (text: string) => void | Promise<void>;
}
