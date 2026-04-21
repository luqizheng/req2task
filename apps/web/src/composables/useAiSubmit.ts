import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { attachmentApi } from '@/api/attachment';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}

export interface UseAiSubmitOptions {
  url: string;
  uploadFile?: boolean;
  audit?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function useAiSubmit(options: UseAiSubmitOptions) {
  const message = ref('');
  const audioFile = ref<File | null>(null);
  const uploadedFiles = ref<UploadedFile[]>([]);
  const isSubmitting = ref(false);
  const isRecording = ref(false);

  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];

  const hasContent = computed(() => {
    return message.value.trim() || audioFile.value || uploadedFiles.value.length > 0;
  });

  const canSubmit = computed(() => {
    return hasContent.value && !isSubmitting.value;
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const fileName = `recording_${Date.now()}.webm`;
        audioFile.value = new File([blob], fileName, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        ElMessage.success('录音完成');
      };

      mediaRecorder.start();
      isRecording.value = true;
      ElMessage.info('开始录音...');
    } catch (error) {
      ElMessage.error('无法访问麦克风，请检查权限设置');
      console.error('Recording error:', error);
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
    target.value = '';
  };

  const handleAttachmentSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);

    files.forEach(file => {
      const uploadedFile: UploadedFile = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
      };
      uploadedFiles.value = [...uploadedFiles.value, uploadedFile];
      uploadFile(file, uploadedFile.id);
    });

    target.value = '';
  };

  const uploadFile = async (file: File, tempId: string) => {
    try {
      const response = await attachmentApi.upload({
        file,
        targetType: options.audit ? 'raw_requirement' : 'project',
      });

      const index = uploadedFiles.value.findIndex(f => f.id === tempId);
      if (index !== -1) {
        uploadedFiles.value = uploadedFiles.value.map((f, i) =>
          i === index
            ? { ...f, id: response.id, status: 'success' as const, progress: 100 }
            : f
        );
      }
    } catch (error) {
      const index = uploadedFiles.value.findIndex(f => f.id === tempId);
      if (index !== -1) {
        uploadedFiles.value = uploadedFiles.value.map((f, i) =>
          i === index ? { ...f, status: 'error' as const } : f
        );
      }
      ElMessage.error(`${file.name} 上传失败，请重试`);
    }
  };

  const removeUploadedFile = (id: string) => {
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== id);
  };

  const clearAudio = () => {
    audioFile.value = null;
  };

  const reset = () => {
    message.value = '';
    audioFile.value = null;
    uploadedFiles.value = [];
    isRecording.value = false;
    isSubmitting.value = false;
  };

  const submit = async () => {
    if (!canSubmit.value) return;

    isSubmitting.value = true;

    try {
      const formData = new FormData();

      if (message.value.trim()) {
        formData.append('message', message.value.trim());
      }

      if (audioFile.value) {
        formData.append('audio', audioFile.value);
      }

      const successfulUploads = uploadedFiles.value
        .filter(f => f.status === 'success' && !f.id.startsWith('temp_'))
        .map(f => f.id);

      if (successfulUploads.length > 0) {
        formData.append('attachments', JSON.stringify(successfulUploads));
      }

      const token = localStorage.getItem('accessToken');

      const response = await fetch(options.url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      ElMessage.success('提交成功');
      options.onSuccess?.(data);
      reset();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('提交失败，请稍后重试');
      ElMessage.error(err.message);
      options.onError?.(err);
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    message,
    audioFile,
    uploadedFiles,
    isSubmitting,
    isRecording,
    hasContent,
    canSubmit,
    startRecording,
    stopRecording,
    handleAudioFileSelect,
    handleAttachmentSelect,
    removeUploadedFile,
    clearAudio,
    reset,
    submit,
  };
}
