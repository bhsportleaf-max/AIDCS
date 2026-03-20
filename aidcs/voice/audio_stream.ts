export class AudioStream {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;

  async start(onChunk: (buffer: ArrayBuffer) => void, sampleMs = 1500): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("mediaDevices not available");
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(this.stream, { mimeType: "audio/webm" });
    this.mediaRecorder = recorder;

    recorder.addEventListener("dataavailable", async event => {
      if (!event.data || event.data.size === 0) return;
      const buffer = await event.data.arrayBuffer();
      onChunk(buffer);
    });

    recorder.start(sampleMs); // emit every sampleMs ms
  }

  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.stream = null;
  }
}
