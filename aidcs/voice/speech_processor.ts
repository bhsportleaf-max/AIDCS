export class SpeechProcessor {
  process(buffer: ArrayBuffer): string {
    return `audio_${buffer.byteLength}`;
  }
}
