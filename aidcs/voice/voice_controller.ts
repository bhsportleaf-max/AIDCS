import { VoiceConfig, VoiceHandlers } from "./types";
import { AudioStream } from "./audio_stream";
import { SpeechProcessor } from "./speech_processor";
import { SttClient } from "./stt_client";

export class VoiceController {
  private config: VoiceConfig;
  private audioStream = new AudioStream();
  private processor = new SpeechProcessor();
  private stt: SttClient;
  private handlers: VoiceHandlers;
  private started = false;

  constructor(config: VoiceConfig, handlers: VoiceHandlers = {}) {
    this.config = config;
    this.handlers = handlers;
    this.stt = new SttClient({ endpoint: config.stt_endpoint, language: config.language });
  }

  async start(): Promise<void> {
    if (!this.config.enabled) return;
    if (this.started) return;
    this.started = true;
    await this.audioStream.start(async buffer => {
      const transcript = await this.transcribe(buffer);
      if (transcript && this.handlers.onTranscript) {
        await this.handlers.onTranscript(transcript);
      }
    }, this.config.sample_ms || 1500);
  }

  async transcribe(buffer: ArrayBuffer): Promise<string> {
    this.processor.process(buffer); // placeholder processing
    // Send raw audio buffer to STT (processing can be added later).
    return await this.stt.transcribe(buffer);
  }

  stop(): void {
    this.audioStream.stop();
    this.started = false;
  }
}
