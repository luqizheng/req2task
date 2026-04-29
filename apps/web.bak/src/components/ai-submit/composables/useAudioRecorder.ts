import { ref } from "vue";
import { ElMessage } from "element-plus";

export interface UseAudioRecorderOptions {
  onRecordingComplete?: (file: File) => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const audioFile = ref<File | null>(null);
  const isRecording = ref(false);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const fileName = `recording_${Date.now()}.webm`;
        const file = new File([blob], fileName, { type: "audio/webm" });
        audioFile.value = file;
        stream.getTracks().forEach((track) => track.stop());
        ElMessage.success("录音完成");
        options.onRecordingComplete?.(file);
      };

      mediaRecorder.start();
      isRecording.value = true;
      ElMessage.info("开始录音...");
    } catch (error) {
      ElMessage.error("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording.value) {
      mediaRecorder.stop();
      isRecording.value = false;
    }
  };

  const handleAudioFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      audioFile.value = file;
    }
    target.value = "";
  };

  const clearAudio = () => {
    audioFile.value = null;
  };

  return {
    audioFile,
    isRecording,
    startRecording,
    stopRecording,
    handleAudioFileSelect,
    clearAudio,
  };
}
