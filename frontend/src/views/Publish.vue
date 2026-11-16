<template>
  <div class="stack">
    <div class="split-layout publish-layout" v-loading="loading">
      <div class="stack">
        <section class="panel panel-pad">
          <div class="panel-heading">
            <div>
              <h2>成片预览</h2>
              <p>{{ selected ? titleOf(selected) : "尚未选择成片" }}</p>
            </div>
            <div class="publish-picker">
              <select
                class="studio-input"
                v-model="taskId"
                aria-label="选择成片"
                :disabled="
                  loading || generating || publishing || outroBusy || uploading
                "
              >
                <option :value="0">请选择已完成的视频</option>
                <option
                  v-for="task in completed"
                  :key="task.id"
                  :value="task.id"
                >
                  {{ titleOf(task) }} · #{{ task.id }}
                </option></select
              ><button
                v-if="completedTotal > completed.length"
                class="text-button"
                @click="loadMore"
              >
                更多</button
              ><span v-if="result?.quality_score != null" class="badge success"
                >质量分 {{ result.quality_score }}</span
              >
            </div>
          </div>
          <div v-if="materials?.video_url" class="preview-layout">
            <video
              :key="materials.video_url"
              ref="video"
              :src="materials.video_url"
              :poster="materials.cover_url || undefined"
              controls
              preload="metadata"
              class="portrait-preview"
              @loadedmetadata="metadata"
            />
            <dl class="key-values">
              <div>
                <dt>成片时长</dt>
                <dd>
                  {{
                    mediaInfo.duration
                      ? formatDuration(mediaInfo.duration)
                      : "—"
                  }}
                </dd>
              </div>
              <div>
                <dt>画面规格</dt>
                <dd>
                  {{
                    mediaInfo.width
                      ? mediaInfo.width + " × " + mediaInfo.height
                      : "—"
                  }}
                </dd>
              </div>
              <div>
                <dt>文件大小</dt>
                <dd>
                  {{
                    fileSize == null
                      ? "—"
                      : (fileSize / 1024 / 1024).toFixed(2) + " MB"
                  }}
                </dd>
              </div>
              <div>
                <dt>生成模型</dt>
                <dd>{{ result?.video_model || "—" }}</dd>
              </div>
            </dl>
          </div>
          <div v-else class="empty">
            <el-icon><VideoCamera /></el-icon
            ><span>选择已完成的视频查看成片</span
            ><button class="btn primary small" @click="router.push('/video')">
              前往视频合成
            </button>
          </div>
        </section>
        <section class="panel panel-pad">
          <div class="panel-heading">
            <div>
              <h2>片尾设置</h2>
              <p>添加渐黑字幕片尾，强化内容记忆点</p>
            </div>
            <el-switch
              v-model="outro.enabled"
              :disabled="!taskId || outroBusy"
              aria-label="启用片尾"
            />
          </div>
          <label class="field"
            >片尾文案<textarea
              v-model="outro.text"
              :disabled="!taskId || outroBusy"
              maxlength="60"
              rows="2"
            />
          </label>
          <div class="toolbar form-gap">
            <span class="muted">片尾时长</span
            ><el-radio-group
              v-model="outro.duration"
              size="small"
              :disabled="outroBusy"
              ><el-radio-button :label="2">2 秒</el-radio-button
              ><el-radio-button :label="2.5">2.5 秒</el-radio-button
              ><el-radio-button :label="3"
                >3 秒</el-radio-button
              ></el-radio-group
            ><button
              class="btn small"
              style="margin-left: auto"
              :disabled="
                !taskId || outroBusy || (outro.enabled && !outro.text.trim())
              "
              @click="applyOutro"
            >
              <el-icon :class="{ 'is-loading': outroBusy }"><Check /></el-icon
              >{{ outroBusy ? "处理中…" : "保存片尾" }}
            </button>
          </div>
          <div v-if="outroError" class="hint-band warning form-gap">
            {{ outroError }}
          </div>
        </section>
        <section class="panel panel-pad">
          <div class="panel-heading">
            <h2>发布文案</h2>
            <button
              class="text-button"
              :disabled="!taskId || generating || outroBusy"
              @click="regenerate"
            >
              <el-icon :class="{ 'is-loading': generating }"
                ><Refresh /></el-icon
              >{{ generating ? "生成中…" : "重新生成" }}
            </button>
          </div>
          <label class="field"
            >作品标题<input
              v-model="title"
              maxlength="100"
              :disabled="!taskId" /></label
          ><label class="field form-gap"
            >内容描述<textarea
              v-model="description"
              rows="3"
              :disabled="!taskId"
            /></label
          ><label class="field form-gap"
            >话题标签<input
              v-model="hashtags"
              placeholder="多个话题用空格分隔"
              :disabled="!taskId"
          /></label>
          <div class="toolbar form-gap">
            <button class="btn small" :disabled="!taskId" @click="copy">
              <el-icon><CopyDocument /></el-icon>复制文案</button
            ><button
              class="btn small"
              :disabled="!materials?.video_url"
              @click="download"
            >
              <el-icon><Download /></el-icon>下载视频
            </button>
          </div>
        </section>
      </div>
      <aside class="panel panel-pad">
        <div class="douyin-account">
          <span class="douyin-icon">♪</span>
          <div>
            <strong>抖音创作中心</strong><small>{{ loginLabel }}</small>
          </div>
          <span class="badge" :class="loggedIn ? 'success' : 'neutral'">{{
            loggedIn ? "已连接" : "未连接"
          }}</span>
        </div>
        <div class="cover-preview">
          <img
            v-if="materials?.cover_url"
            :src="materials.cover_url"
            alt="当前发布封面"
          />
          <div v-else class="cover-empty">
            <el-icon><Picture /></el-icon><span>暂无封面</span>
          </div>
          <button
            v-if="taskId"
            class="cover-change"
            :disabled="uploading || outroBusy"
            @click="coverInput?.click()"
          >
            {{ uploading ? "上传中…" : "更换封面" }}</button
          ><input
            ref="coverInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            @change="changeCover"
          />
        </div>
        <dl class="key-values">
          <div>
            <dt>可见范围</dt>
            <dd>公开</dd>
          </div>
          <div>
            <dt>发布模式</dt>
            <dd>
              {{
                publishConfig?.auto_submit
                  ? "正式发布"
                  : publishConfig
                    ? "演练模式"
                    : "读取中"
              }}
            </dd>
          </div>
          <div>
            <dt>发布时间</dt>
            <dd>立即发布</dd>
          </div>
        </dl>
        <div class="toolbar form-gap">
          <button
            class="btn small"
            :disabled="checking || loggingIn"
            @click="checkLogin"
          >
            <el-icon :class="{ 'is-loading': checking }"><Refresh /></el-icon
            >{{ checking ? "检测中…" : "检测登录态" }}</button
          ><button
            v-if="!loggedIn"
            class="btn small"
            :disabled="loggingIn"
            @click="login"
          >
            <el-icon><Connection /></el-icon
            >{{ loggingIn ? "等待扫码…" : "扫码登录" }}
          </button>
        </div>
        <div v-if="publishState" class="hint-band form-gap">
          {{ publishMessage }}
        </div>
        <button
          class="btn primary full form-gap"
          :disabled="
            !taskId ||
            result?.status !== 'completed' ||
            publishing ||
            outroBusy ||
            ['pending', 'processing'].includes(publishState)
          "
          @click="publish"
        >
          <el-icon><Upload /></el-icon
          >{{
            publishing
              ? "正在提交…"
              : publishConfig?.auto_submit
                ? "发布到抖音"
                : "开始发布演练"
          }}</button
        ><a
          href="https://creator.douyin.com/creator-micro/content/upload"
          target="_blank"
          rel="noopener noreferrer"
          class="text-button form-gap"
          >打开抖音创作中心<el-icon><TopRight /></el-icon
        ></a>
      </aside>
    </div>
    <section class="panel">
      <div class="panel-pad panel-heading" style="margin-bottom: 0">
        <div>
          <h2>发布记录</h2>
          <p>共 {{ recordTotal }} 条记录</p>
        </div>
        <button class="icon-button" title="刷新发布记录" @click="loadRecords">
          <el-icon><Refresh /></el-icon>
        </button>
      </div>
      <div class="table-wrap">
        <table v-if="records.length" class="studio-table">
          <thead>
            <tr>
              <th>作品</th>
              <th>状态</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in records" :key="item.id">
              <td>
                <div class="table-title">
                  <div>
                    <strong>{{ item.title }}</strong
                    ><small v-if="item.error_message">{{
                      item.error_message
                    }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="statusClass(item.status)">{{
                  publishStatus(item.status)
                }}</span>
              </td>
              <td class="muted">
                {{ dateText(item.published_at || item.created_at) }}
              </td>
              <td>
                <a
                  v-if="item.platform_url"
                  :href="item.platform_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-button"
                  >查看作品</a
                ><button
                  v-else-if="item.status === 'failed'"
                  class="text-button"
                  @click="republish(item)"
                >
                  重新发布</button
                ><span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty compact">暂无发布记录</div>
      </div>
      <div
        v-if="recordTotal > 8"
        class="pagination"
        style="padding-bottom: 18px"
      >
        <el-pagination
          small
          layout="prev, pager, next"
          :total="recordTotal"
          :page-size="8"
          v-model:current-page="recordPage"
          @current-change="loadRecords"
        />
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import {
  computed,
  onMounted,
  onBeforeUnmount,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { publishApi, videoApi } from "@/api";
import {
  dateText,
  titleOf,
  statusClass,
  statusText,
  downloadFile,
} from "@/utils/studio";
const route = useRoute(),
  router = useRouter(),
  taskId = ref(0),
  completed = ref<any[]>([]),
  completedTotal = ref(0),
  taskPage = ref(1),
  result = ref<any>(null),
  materials = ref<any>(null),
  loading = ref(false);
const selected = computed(
  () => completed.value.find((t) => t.id === taskId.value) || result.value,
);
const title = ref(""),
  description = ref(""),
  hashtags = ref(""),
  video = ref<HTMLVideoElement>(),
  coverInput = ref<HTMLInputElement>(),
  mediaInfo = reactive({ width: 0, height: 0, duration: 0 }),
  fileSize = ref<number | null>(null);
const outro = reactive({ enabled: false, text: "", duration: 3 }),
  outroBusy = ref(false),
  outroError = ref(""),
  generating = ref(false),
  uploading = ref(false);
const loggedIn = ref<boolean | null>(null),
  checking = ref(false),
  loggingIn = ref(false),
  publishing = ref(false),
  publishState = ref(""),
  publishConfig = ref<any>(null);
const records = ref<any[]>([]),
  recordTotal = ref(0),
  recordPage = ref(1);
const loginLabel = computed(() =>
  loggingIn.value
    ? "等待完成扫码"
    : loggedIn.value === true
      ? "登录态有效"
      : loggedIn.value === false
        ? "需要扫码登录"
        : "尚未检测登录态",
);
const publishStatus = (status: string) =>
  (
    ({
      pending: "待发布",
      processing: "发布中",
      success: "已发布",
      failed: "发布失败",
      prepared: "演练完成",
    }) as Record<string, string>
  )[status] || statusText(status);
const publishMessage = computed(() =>
  publishState.value === "prepared"
    ? "演练完成，未实际发布"
    : publishStatus(publishState.value),
);
let outroTimer: ReturnType<typeof setTimeout> | undefined,
  loginTimer: ReturnType<typeof setTimeout> | undefined,
  recordTimer: ReturnType<typeof setTimeout> | undefined,
  selectionSequence = 0,
  disposed = false;
function formatDuration(n: number) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
}
function metadata() {
  if (video.value)
    Object.assign(mediaInfo, {
      width: video.value.videoWidth,
      height: video.value.videoHeight,
      duration: video.value.duration,
    });
}
async function loadTasks(append = false) {
  try {
    const r = await videoApi.getTasks(taskPage.value, 30, "completed");
    completed.value = append
      ? [...completed.value, ...r.data.tasks]
      : r.data.tasks;
    completedTotal.value = r.data.total;
  } catch {}
}
async function loadMore() {
  taskPage.value++;
  await loadTasks(true);
}
async function selectTask() {
  const id = taskId.value,
    sequence = ++selectionSequence;
  clearTimeout(outroTimer);
  clearTimeout(recordTimer);
  materials.value = null;
  result.value = null;
  title.value = "";
  description.value = "";
  hashtags.value = "";
  outroBusy.value = false;
  outroError.value = "";
  publishState.value = "";
  fileSize.value = null;
  Object.assign(mediaInfo, { width: 0, height: 0, duration: 0 });
  if (!id) return;
  loading.value = true;
  try {
    const [m, o, r] = await Promise.all([
      publishApi.getMaterials(id),
      videoApi.getOutro(id),
      videoApi.getTaskProgress(id),
    ]);
    if (sequence !== selectionSequence || disposed) return;
    const resolvedResult =
      r.data.status === "completed"
        ? (await videoApi.getTaskResult(id)).data
        : r.data;
    if (sequence !== selectionSequence || disposed) return;
    materials.value = m.data;
    result.value = resolvedResult;
    title.value = m.data.title || "";
    description.value = m.data.description || "";
    hashtags.value = (m.data.hashtags || [])
      .map((t: string) => "#" + t)
      .join(" ");
    Object.assign(outro, o.data.options);
    outroBusy.value = o.data.busy;
    if (o.data.busy) pollOutro(id);
    if (m.data.last_publish) {
      publishState.value = m.data.last_publish.status;
      if (["pending", "processing"].includes(publishState.value))
        pollRecord(m.data.last_publish.id);
    }
    if (materials.value.video_url) {
      const h = await fetch(materials.value.video_url, { method: "HEAD" });
      if (sequence === selectionSequence && h.ok)
        fileSize.value = h.headers.get("Content-Length")
          ? Number(h.headers.get("Content-Length"))
          : null;
    }
  } catch {
  } finally {
    if (sequence === selectionSequence) loading.value = false;
  }
}
async function refreshMaterials(id: number) {
  const m = await publishApi.getMaterials(id);
  if (taskId.value === id) materials.value = m.data;
}
function pollOutro(id: number) {
  clearTimeout(outroTimer);
  outroTimer = setTimeout(async () => {
    if (disposed || taskId.value !== id) return;
    try {
      const r = await videoApi.getOutro(id);
      if (disposed || taskId.value !== id) return;
      outroBusy.value = r.data.busy;
      outroError.value = r.data.error || "";
      if (!r.data.busy) {
        Object.assign(outro, r.data.options);
        await refreshMaterials(id);
        if (r.data.status === "completed") {
          const completedResult = await videoApi.getTaskResult(id);
          if (!disposed && taskId.value === id)
            result.value = completedResult.data;
        }
        return;
      }
    } catch {}
    pollOutro(id);
  }, 3000);
}
async function applyOutro() {
  if (!taskId.value || outroBusy.value) return;
  const id = taskId.value;
  outroBusy.value = true;
  outroError.value = "";
  try {
    await videoApi.editOutro(id, { ...outro });
    pollOutro(id);
  } catch {
    outroBusy.value = false;
  }
}
async function regenerate() {
  generating.value = true;
  try {
    await publishApi.regenerateMaterials(taskId.value);
    await refreshMaterials(taskId.value);
    title.value = materials.value.title;
    description.value = materials.value.description || "";
    hashtags.value = materials.value.hashtags
      .map((t: string) => "#" + t)
      .join(" ");
    ElMessage.success("发布物料已更新");
  } catch {
  } finally {
    generating.value = false;
  }
}
async function changeCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const r = await publishApi.uploadCover(taskId.value, file);
    if (materials.value) materials.value.cover_url = r.data.cover_url;
    ElMessage.success("封面已更新");
  } catch {
  } finally {
    uploading.value = false;
    (event.target as HTMLInputElement).value = "";
  }
}
async function checkLogin() {
  checking.value = true;
  try {
    const r = await publishApi.douyinStatus(true);
    loggedIn.value = r.data.logged_in;
    if (!r.data.logged_in && r.data.message) ElMessage.info(r.data.message);
  } catch {
    loggedIn.value = false;
  } finally {
    checking.value = false;
  }
}
async function login() {
  loggingIn.value = true;
  try {
    await publishApi.douyinLogin();
    pollLogin(Date.now());
  } catch {
    loggingIn.value = false;
  }
}
function pollLogin(started: number) {
  loginTimer = setTimeout(async () => {
    if (disposed) return;
    try {
      const r = await publishApi.douyinLoginStatus();
      if (r.data.status === "success") {
        loggedIn.value = true;
        loggingIn.value = false;
        return;
      }
      if (
        ["failed", "timeout", "cancelled"].includes(r.data.status) ||
        Date.now() - started > 310000
      ) {
        loggingIn.value = false;
        return;
      }
    } catch {}
    pollLogin(started);
  }, 3000);
}
function pollRecord(id: number, expectedTask = taskId.value) {
  clearTimeout(recordTimer);
  recordTimer = setTimeout(async () => {
    if (disposed || taskId.value !== expectedTask) return;
    try {
      const r = await publishApi.getRecord(id);
      if (disposed || taskId.value !== expectedTask) return;
      publishState.value = r.data.status;
      if (!["pending", "processing"].includes(r.data.status)) {
        await loadRecords();
        if (taskId.value) await refreshMaterials(taskId.value);
        return;
      }
    } catch {}
    pollRecord(id, expectedTask);
  }, 4000);
}
async function publish() {
  if (
    !taskId.value ||
    result.value?.status !== "completed" ||
    publishing.value ||
    outroBusy.value
  )
    return;
  try {
    await ElMessageBox.confirm(
      publishConfig.value?.auto_submit
        ? "将使用当前文案和封面公开发布此视频到抖音。"
        : "当前为演练模式，将准备上传并停在最终发布之前。",
      publishConfig.value?.auto_submit ? "确认发布" : "发布演练",
      { confirmButtonText: "继续", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  publishing.value = true;
  try {
    if (!loggedIn.value) await checkLogin();
    if (!loggedIn.value) {
      ElMessage.warning("请先扫码登录抖音");
      return;
    }
    const r = await publishApi.publishVideo({
      video_task_id: taskId.value,
      custom_title: title.value.trim() || undefined,
      custom_description: description.value,
      custom_hashtags: hashtags.value
        .split(/[\s,，]+/)
        .map((t) => t.replace(/^#/, ""))
        .filter(Boolean),
    });
    publishState.value = "pending";
    if (r.data.record_id) pollRecord(r.data.record_id);
    await loadRecords();
  } catch {
  } finally {
    publishing.value = false;
  }
}
async function republish(item: any) {
  try {
    await ElMessageBox.confirm("重新提交这条发布记录？", "重新发布", {
      confirmButtonText: "继续",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await publishApi.republish({ record_id: item.id });
    pollRecord(item.id);
    await loadRecords();
  } catch {}
}
async function loadRecords() {
  try {
    const r = await publishApi.getRecords(recordPage.value, 8);
    records.value = r.data.records;
    recordTotal.value = r.data.total;
  } catch {}
}
async function download() {
  try {
    await downloadFile(materials.value.video_url, `video-${taskId.value}.mp4`);
  } catch {
    ElMessage.error("下载失败");
  }
}
async function copy() {
  try {
    await navigator.clipboard.writeText(
      [title.value, description.value, hashtags.value]
        .filter(Boolean)
        .join("\n"),
    );
    ElMessage.success("已复制文案");
  } catch {
    ElMessage.error("无法访问剪贴板");
  }
}
watch(taskId, selectTask);
watch(
  () => route.query.task_id,
  (id) => {
    if (id) taskId.value = Number(id);
  },
);
onMounted(async () => {
  loadRecords();
  publishApi
    .getConfig()
    .then((r) => {
      publishConfig.value = r.data;
    })
    .catch(() => {});
  await loadTasks();
  if (route.query.task_id) {
    const id = Number(route.query.task_id);
    if (!completed.value.some((t) => t.id === id)) {
      try {
        const r = await videoApi.getTaskProgress(id);
        completed.value.unshift(r.data);
      } catch {
        return;
      }
    }
    taskId.value = id;
  } else if (completed.value.length) taskId.value = completed.value[0].id;
});
onBeforeUnmount(() => {
  disposed = true;
  ++selectionSequence;
  clearTimeout(outroTimer);
  clearTimeout(loginTimer);
  clearTimeout(recordTimer);
});
</script>
<style scoped>
.publish-layout {
  grid-template-columns: minmax(0, 1fr) 292px;
}
.publish-picker {
  display: flex;
  gap: 12px;
  align-items: end;
  max-width: min(330px, 100%);
  min-width: 0;
  flex-shrink: 0;
}
.publish-picker select {
  width: 220px;
  max-width: 220px;
  padding: 7px 10px;
  height: 34px;
  font-size: 10px;
}
.publish-picker .field {
  width: min(100%, 540px);
}
.preview-layout {
  display: grid;
  grid-template-columns: 203px minmax(0, 1fr);
  gap: 28px;
  align-items: center;
}
.portrait-preview {
  width: 203px;
  aspect-ratio: 9/14;
  max-height: 365px;
  background: #173033;
  object-fit: contain;
  border-radius: 13px;
  box-shadow: 0 6px 20px #142e3c08;
}
.douyin-account {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 20px;
}
.douyin-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  font-size: 29px;
  background: #121212;
  color: #fff;
  border-radius: 10px;
  flex-shrink: 0;
}
.douyin-account strong {
  font-size: 11px;
  display: block;
}
.douyin-account small {
  display: block;
  font-size: 9px;
  color: #8f9fa8;
  margin-top: 8px;
}
.douyin-account > .badge {
  margin-left: auto;
  padding: 4px 6px;
  font-size: 9px;
}
.cover-preview {
  aspect-ratio: 1.15;
  position: relative;
  overflow: hidden;
  border-radius: 9px;
  background: #f1f6f5;
}
.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.cover-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #a5bcbe;
  gap: 12px;
  font-size: 12px;
}
.cover-empty > .el-icon {
  font-size: 35px;
}
.cover-change {
  position: absolute;
  bottom: 10px;
  right: 9px;
  background: #fffffff0;
  color: #45606c;
  border: 0;
  border-radius: 5px;
  padding: 5px 8px;
  font-size: 9px;
}
.portrait-preview + .key-values {
  width: 100%;
}
@media (max-width: 1100px) {
  .panel-heading {
    flex-wrap: wrap;
  }
  .preview-layout {
    grid-template-columns: 160px minmax(0, 1fr);
    gap: 17px;
  }
  .portrait-preview {
    width: 160px;
  }
}
@media (max-width: 1000px) {
  .publish-layout {
    grid-template-columns: 1fr;
  }
  .cover-preview {
    max-height: 300px;
    aspect-ratio: auto;
    min-height: 200px;
  }
  .cover-preview img {
    max-height: 300px;
  }
}
@media (max-width: 700px) {
  .panel-heading {
    flex-wrap: wrap;
  }
  .publish-picker {
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
  }
  .publish-picker select {
    max-width: 100%;
    flex: 1;
    min-width: 0;
  }
  .preview-layout {
    grid-template-columns: 1fr;
  }
  .portrait-preview {
    width: 185px;
    margin: auto;
  }
  .publish-picker {
    gap: 8px;
  }
  .publish-picker .field {
    flex: 1;
  }
}
</style>
