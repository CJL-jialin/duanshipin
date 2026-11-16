<template>
  <div class="split-layout asr-layout">
    <div class="stack">
      <section class="panel panel-pad">
        <div class="panel-heading">
          <div>
            <h2>上传音视频</h2>
            <p>文件仅在本地处理，不会上传至云端</p>
          </div>
          <span
            class="badge"
            :class="status?.installed ? 'success' : 'neutral'"
            >{{
              status?.installed
                ? "组件已安装"
                : status
                  ? "组件未安装"
                  : "检测中"
            }}</span
          >
        </div>
        <button
          class="upload-zone"
          :class="{ dragging }"
          :disabled="busy"
          @click="fileInput?.click()"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="drop"
        >
          <span class="upload-icon"
            ><el-icon><Upload /></el-icon></span
          ><strong>{{
            selected ? selected.name : "拖拽文件到这里，或点击选择"
          }}</strong
          ><small
            >{{
              selected
                ? (selected.size / 1024 / 1024).toFixed(2) + " MB"
                : "支持 WAV、MP3、M4A、MP4、MOV、OGG、FLAC、WebM"
            }}
            · 最大 {{ status?.max_upload_mb ?? "—" }} MB</small
          >
        </button>
        <input
          ref="fileInput"
          type="file"
          hidden
          accept=".wav,.mp3,.m4a,.mp4,.mov,.ogg,.flac,.webm"
          @change="select"
        />
        <div v-if="error" class="error-state form-gap">{{ error }}</div>
        <button
          class="btn primary full form-gap"
          :disabled="!selected || !status?.installed || busy"
          @click="transcribe"
        >
          <el-icon v-if="busy" class="is-loading"><Loading /></el-icon
          >{{ busy ? "本地识别中…" : "开始本地识别" }}</button
        ><button
          v-if="busy"
          class="text-button form-gap"
          @click="controller?.abort()"
        >
          取消等待
        </button>
      </section>
      <section v-if="result" class="panel panel-pad">
        <div class="panel-heading">
          <div>
            <h2>识别结果</h2>
            <p>
              {{ result.duration }} 秒 · {{ result.language }} ·
              {{ result.device === "cuda" ? "GPU / CUDA" : "CPU" }} /
              {{ result.compute_type }}
            </p>
          </div>
          <div class="toolbar">
            <button class="btn small" @click="downloadText">
              <el-icon><Download /></el-icon>TXT</button
            ><button class="btn small" @click="downloadSrt">
              <el-icon><Download /></el-icon>SRT
            </button>
          </div>
        </div>
        <label class="field"
          >识别文本<textarea v-model="result.text" rows="6" />
        </label>
        <div class="transcript-segments form-gap">
          <div v-for="(segment, i) in result.segments" :key="i">
            <span
              >{{ timestamp(segment.start) }} →
              {{ timestamp(segment.end) }}</span
            ><input v-model="segment.text" aria-label="分段识别文字" />
          </div>
        </div>
      </section>
    </div>
    <aside class="panel panel-pad">
      <div class="panel-heading" style="margin-bottom: 4px">
        <h2>本地执行环境</h2>
        <button class="text-button" title="刷新环境" @click="refreshStatus">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>
      <dl class="key-values">
        <div>
          <dt>识别模型</dt>
          <dd>{{ status?.model || "—" }}</dd>
        </div>
        <div>
          <dt>计算设备</dt>
          <dd>{{ deviceLabel }}</dd>
        </div>
        <div>
          <dt>运行方式</dt>
          <dd>本地处理</dd>
        </div>
        <div>
          <dt>模型状态</dt>
          <dd>{{ status?.loaded ? "已加载" : "尚未加载" }}</dd>
        </div>
        <div>
          <dt>计算精度</dt>
          <dd>{{ status?.compute_type?.toUpperCase() || "加载后确定" }}</dd>
        </div>
      </dl>
      <div v-if="status?.fallback_reason" class="hint-band warning form-gap">
        {{ status.fallback_reason }}
      </div>
      <div
        v-if="status && !status.installed"
        class="hint-band warning form-gap"
      >
        尚未安装本地识别组件
      </div>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import request from "@/utils/request";
const status = ref<any>(null),
  selected = ref<File | null>(null),
  result = ref<any>(null),
  fileInput = ref<HTMLInputElement>(),
  busy = ref(false),
  dragging = ref(false),
  error = ref("");
let controller: AbortController | null = null;
const deviceLabel = computed(() =>
  status.value?.device
    ? status.value.device === "cuda"
      ? "NVIDIA GPU · CUDA"
      : "CPU"
    : status.value?.requested_device === "cpu"
      ? "CPU"
      : status.value?.requested_device === "cuda"
        ? "GPU · 待检测"
        : "自动选择 · 待检测",
);
async function refreshStatus() {
  try {
    const r = await request.get("/asr/status");
    status.value = r.data;
  } catch {
    error.value = "无法读取本地识别环境";
  }
}
function accept(file?: File) {
  if (!file) return;
  error.value = "";
  if (!/\.(wav|mp3|m4a|mp4|mov|ogg|flac|webm)$/i.test(file.name)) {
    error.value = "请选择支持的音频或视频文件";
    return;
  }
  if (status.value && file.size > status.value.max_upload_mb * 1024 * 1024) {
    error.value = "文件超过上传大小限制";
    return;
  }
  if (!file.size) {
    error.value = "文件为空";
    return;
  }
  selected.value = file;
  result.value = null;
}
function select(event: Event) {
  accept((event.target as HTMLInputElement).files?.[0]);
}
function drop(event: DragEvent) {
  dragging.value = false;
  if (!busy.value) accept(event.dataTransfer?.files[0]);
}
async function transcribe() {
  if (!selected.value || busy.value) return;
  busy.value = true;
  error.value = "";
  controller = new AbortController();
  const form = new FormData();
  form.append("file", selected.value);
  try {
    const r = await request.post("/asr/transcribe", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 0,
      signal: controller.signal,
    });
    result.value = r.data;
  } catch (e: any) {
    error.value =
      e.code === "ERR_CANCELED"
        ? "已取消等待"
        : e.response?.data?.detail || "识别失败";
  } finally {
    busy.value = false;
    controller = null;
    await refreshStatus();
  }
}
function timestamp(value: number) {
  const n = Math.max(0, Math.round(value * 1000));
  return `${String(Math.floor(n / 3600000)).padStart(2, "0")}:${String(Math.floor(n / 60000) % 60).padStart(2, "0")}:${String(Math.floor(n / 1000) % 60).padStart(2, "0")},${String(n % 1000).padStart(3, "0")}`;
}
function download(content: string, ext: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download =
    (selected.value?.name.replace(/\.[^.]+$/, "") || "transcript") + "." + ext;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadText() {
  download(result.value.text, "txt");
}
function downloadSrt() {
  download(
    result.value.segments
      .map(
        (s: any, i: number) =>
          `${i + 1}\n${timestamp(s.start)} --> ${timestamp(s.end)}\n${s.text}\n`,
      )
      .join("\n"),
    "srt",
  );
}
onMounted(refreshStatus);
onBeforeUnmount(() => controller?.abort());
</script>
<style scoped>
.asr-layout {
  grid-template-columns: minmax(0, 1fr) 340px;
}
.upload-zone {
  width: 100%;
  min-height: 203px;
  border: 1px dashed #a9cdd0;
  background: #f7fbfb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #718995;
  padding: 24px;
}
.upload-zone:hover,
.upload-zone.dragging {
  border-color: #16aaa1;
  background: #edf9f7;
}
.upload-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #e1f5f2;
  color: #12a59c;
  font-size: 26px;
  margin-bottom: 2px;
}
.upload-zone strong {
  font-size: 12px;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.upload-zone small {
  font-size: 10px;
  color: #97a5b0;
  line-height: 1.7;
}
.transcript-segments {
  max-height: 360px;
  overflow: auto;
}
.transcript-segments > div {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid #e4ecee;
}
.transcript-segments span {
  font-size: 10px;
  color: #8a9eaa;
  white-space: nowrap;
}
.transcript-segments input {
  flex: 1;
  min-width: 0;
  border: 1px solid #e5edef;
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
}
@media (max-width: 1200px) {
  .asr-layout {
    grid-template-columns: minmax(0, 1fr) 290px;
  }
}
@media (max-width: 1000px) {
  .asr-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 700px) {
  .transcript-segments > div {
    flex-direction: column;
    align-items: stretch;
    gap: 7px;
  }
}
</style>
