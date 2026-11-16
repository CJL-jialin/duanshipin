<template>
  <div class="stack">
    <div class="split-layout">
      <div class="stack">
        <section class="panel panel-pad">
          <div class="panel-heading">
            <div>
              <span
                class="badge"
                :class="flow.script_id && sceneCount ? 'success' : 'neutral'"
                >{{ sceneCount ? "剧情已就绪" : "等待选择剧情" }}</span
              >
              <h2 style="margin-top: 7px">
                {{
                  flow.storyboard?.title ||
                  flow.input_content ||
                  "尚未选择剧情稿"
                }}
              </h2>
            </div>
            <button class="btn" @click="scriptPicker = true">
              {{ flow.script_id ? "切换剧情" : "选择剧情" }}
            </button>
          </div>
          <div class="ready-items">
            <div>
              <span class="ready-icon"
                ><el-icon><Check /></el-icon></span
              ><span
                ><small>剧情与分镜</small
                ><strong>{{ sceneCount }} 个镜头</strong></span
              >
            </div>
            <div>
              <span class="ready-icon"
                ><el-icon><User /></el-icon></span
              ><span
                ><small>角色参考图</small
                ><strong
                  >{{ referenceCount }} /
                  {{ flow.characters.length }} 个角色</strong
                ></span
              >
            </div>
            <div>
              <span class="ready-icon"
                ><el-icon><Clock /></el-icon></span
              ><span
                ><small>预计成片</small
                ><strong>{{ totalDuration }} 秒</strong></span
              >
            </div>
          </div>
          <button
            v-if="flow.script_id"
            class="text-button form-gap"
            @click="router.push('/script?script_id=' + flow.script_id)"
          >
            查看剧情与分镜<el-icon><ArrowRight /></el-icon>
          </button>
        </section>
        <section class="panel panel-pad">
          <div class="panel-heading">
            <div>
              <h2>生成方式</h2>
              <p>选择视频的生成与合成策略</p>
            </div>
          </div>
          <div class="generation-modes">
            <button
              :class="{ active: options.generation_mode === 'direct' }"
              @click="options.generation_mode = 'direct'"
            >
              <el-icon><VideoCamera /></el-icon
              ><span
                ><strong>整片直出</strong
                ><small>一次生成完整视频，支持 2–30 秒</small></span
              ><el-icon v-if="options.generation_mode === 'direct'"
                ><CircleCheck
              /></el-icon></button
            ><button
              :class="{ active: options.generation_mode === 'scenes' }"
              @click="options.generation_mode = 'scenes'"
            >
              <el-icon><Document /></el-icon
              ><span
                ><strong>逐镜生成</strong
                ><small>可独立调整镜头，控制更灵活</small></span
              ><el-icon v-if="options.generation_mode === 'scenes'"
                ><CircleCheck
              /></el-icon>
            </button>
          </div>
          <div class="fields form-gap">
            <label class="field"
              >视频模型<select v-model="model">
                <option
                  v-for="item in models"
                  :key="item.model"
                  :value="item.model"
                >
                  {{ item.model }} · {{ item.resolution }}
                </option>
              </select></label
            ><label class="field"
              >字幕配置<select v-model="options.subtitle_mode">
                <option value="off">关闭字幕</option>
                <option value="sidecar">导出字幕文件</option>
                <option value="burn">烧录到视频画面</option>
              </select></label
            >
          </div>
          <div v-if="options.subtitle_mode !== 'off'" class="fields form-gap">
            <label class="field"
              >字幕样式<select v-model="options.subtitle_style">
                <option value="classic">经典白字</option>
                <option value="cinema">电影字幕</option>
                <option value="gold">金色强调</option>
                <option value="boxed">底框字幕</option>
              </select></label
            >
            <div class="field">
              导出格式<el-checkbox-group v-model="options.subtitle_formats"
                ><el-checkbox value="srt" label="srt">SRT</el-checkbox
                ><el-checkbox value="vtt" label="vtt">VTT</el-checkbox
                ><el-checkbox value="ass" label="ass"
                  >ASS</el-checkbox
                ></el-checkbox-group
              >
            </div>
          </div>
          <div class="form-gap">
            <el-checkbox v-model="options.show_ai_label"
              >添加 AI 生成标识</el-checkbox
            >
          </div>
          <div v-if="compatibilityError" class="hint-band warning form-gap">
            {{ compatibilityError }}
          </div>
          <div v-if="modelInfo?.availability_message" class="muted form-gap">
            {{ modelInfo.availability_message }}
          </div>
        </section>
      </div>
      <aside class="panel panel-pad">
        <h2>任务配置</h2>
        <dl class="key-values">
          <div>
            <dt>画面比例</dt>
            <dd>9:16 竖屏</dd>
          </div>
          <div>
            <dt>清晰度</dt>
            <dd>{{ modelInfo?.resolution || "—" }}</dd>
          </div>
          <div>
            <dt>预计镜头</dt>
            <dd>
              {{
                options.generation_mode === "direct"
                  ? "1 个完整视频"
                  : sceneCount + " 个"
              }}
            </dd>
          </div>
          <div>
            <dt>计费方式</dt>
            <dd>
              {{
                modelInfo?.billing === "per_request"
                  ? "按次计费"
                  : "按生成秒数计费"
              }}
            </dd>
          </div>
        </dl>
        <div class="hint-band form-gap">
          {{ modelInfo?.billing_label || "价格以服务商结算为准" }}
        </div>
        <button
          class="btn primary full form-gap"
          :disabled="
            creating ||
            !flow.script_id ||
            !sceneCount ||
            !!compatibilityError ||
            !model
          "
          @click="create"
        >
          <el-icon><MagicStick /></el-icon
          >{{ creating ? "正在创建…" : "创建视频任务" }}
        </button>
      </aside>
    </div>
    <section class="panel">
      <div class="panel-pad panel-heading" style="margin-bottom: 0">
        <div>
          <h2>视频任务</h2>
          <p>共 {{ total }} 个任务</p>
        </div>
        <div class="toolbar">
          <select
            v-model="filter"
            class="studio-input"
            style="width: 120px"
            aria-label="筛选任务状态"
            @change="
              page = 1;
              loadTasks();
            "
          >
            <option value="">全部状态</option>
            <option
              v-for="state in [
                'pending',
                'processing',
                'partial',
                'ready',
                'completed',
                'failed',
                'cancelled',
              ]"
              :key="state"
              :value="state"
            >
              {{ statusText(state) }}
            </option></select
          ><button class="icon-button" title="刷新任务" @click="loadTasks">
            <el-icon><Refresh /></el-icon>
          </button>
        </div>
      </div>
      <div class="table-wrap" v-loading="loading">
        <table v-if="tasks.length" class="studio-table">
          <thead>
            <tr>
              <th>视频内容</th>
              <th>状态</th>
              <th>进度</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>
                <div class="table-title">
                  <span class="table-thumb"
                    ><el-icon><VideoCamera /></el-icon
                  ></span>
                  <div>
                    <strong>{{ titleOf(task) }}</strong
                    ><small>{{ task.video_model }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="statusClass(task.status)">{{
                  statusText(task.status)
                }}</span>
              </td>
              <td>
                <el-progress
                  :percentage="task.progress_percent || 0"
                  :stroke-width="5"
                  style="min-width: 110px"
                  color="#20afa5"
                />
              </td>
              <td class="muted">{{ dateText(task.created_at) }}</td>
              <td>
                <div class="toolbar">
                  <button class="text-button" @click="openTask(task.id)">
                    详情</button
                  ><button
                    v-if="task.final_video_url"
                    class="text-button"
                    @click="router.push('/publish?task_id=' + task.id)"
                  >
                    剪辑发布
                  </button>
                  <button
                    class="icon-button delete-button"
                    title="删除视频任务"
                    :aria-label="'删除视频任务 #' + task.id"
                    :aria-busy="deletingTaskId === task.id"
                    :disabled="deletingTaskId !== null"
                    @click="deleteTask(task)"
                  >
                    <el-icon :class="{ 'is-loading': deletingTaskId === task.id }" aria-hidden="true">
                      <Loading v-if="deletingTaskId === task.id" /><Delete v-else />
                    </el-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">
          <el-icon><VideoCamera /></el-icon>暂无视频任务
        </div>
      </div>
      <div v-if="total > 8" class="pagination" style="padding-bottom: 18px">
        <el-pagination
          small
          layout="prev, pager, next"
          :page-size="8"
          :total="total"
          v-model:current-page="page"
          @current-change="loadTasks"
        />
      </div>
    </section>
    <el-dialog
      v-model="taskOpen"
      :title="'视频任务 #' + (current?.id || '')"
      width="950px"
      destroy-on-close
      @closed="stopPolling"
    >
      <div v-if="current" class="stack">
        <div class="section-toolbar">
          <span class="badge" :class="statusClass(current.status)">{{
            statusText(current.status)
          }}</span
          ><span class="muted"
            >{{ current.video_model }} ·
            {{ current.video_config?.resolution }}</span
          >
        </div>
        <el-progress
          :percentage="current.progress_percent || 0"
          :status="
            current.status === 'failed'
              ? 'exception'
              : current.status === 'completed'
                ? 'success'
                : undefined
          "
          color="#20afa5"
        />
        <p class="muted">
          {{ current.current_step
          }}{{
            current.stage_detail?.last_event
              ? " · " + current.stage_detail.last_event
              : ""
          }}
        </p>
        <div v-if="current.error_message" class="error-state">
          {{ current.error_message }}
        </div>
        <video
          v-if="current.final_video_url"
          :src="current.final_video_url"
          controls
          class="video-player"
        />
        <div v-if="editable" class="fields">
          <label class="field"
            >任务模型<select v-model="taskModel">
              <option
                v-for="item in models"
                :key="item.model"
                :value="item.model"
              >
                {{ item.model }} · {{ item.resolution }}
              </option>
            </select></label
          >
          <div class="toolbar" style="align-self: end">
            <button
              class="btn small"
              :disabled="actionBusy"
              @click="saveTaskModel"
            >
              <el-icon><Check /></el-icon>保存模型</button
            ><button
              class="btn small"
              :disabled="actionBusy"
              @click="saveTaskOptions"
            >
              应用当前生成设置
            </button>
          </div>
        </div>
        <div class="toolbar">
          <button
            v-if="editable"
            class="btn primary"
            :disabled="actionBusy"
            @click="run('full')"
          >
            <el-icon><VideoPlay /></el-icon
            >{{
              current.production_options?.generation_mode === "direct"
                ? "生成完整视频"
                : "生成剩余镜头并合成"
            }}</button
          ><button
            v-if="current.status === 'ready'"
            class="btn primary"
            :disabled="actionBusy"
            @click="run('compose')"
          >
            <el-icon><Film /></el-icon>合成成片</button
          ><button
            v-if="current.status === 'completed'"
            class="btn primary"
            @click="router.push('/publish?task_id=' + current.id)"
          >
            剪辑发布<el-icon><ArrowRight /></el-icon></button
          ><button v-if="current.final_video_url" class="btn" @click="download">
            <el-icon><Download /></el-icon>下载成片</button
          ><button
            v-if="
              ['pending', 'partial', 'ready', 'failed', 'processing'].includes(
                current.status,
              )
            "
            class="btn danger"
            :disabled="actionBusy"
            @click="cancel"
          >
            <el-icon><Close /></el-icon>取消任务
          </button>
        </div>
        <div
          v-if="current.production_options?.generation_mode !== 'direct'"
          class="scene-grid"
        >
          <article
            v-for="scene in current.scenes || []"
            :key="scene.index"
            class="scene-task"
          >
            <div class="section-toolbar">
              <h3>镜头 {{ scene.index }}</h3>
              <span class="muted">{{ scene.duration }} 秒</span>
            </div>
            <video
              v-if="clipOf(scene.index)"
              :src="clipOf(scene.index)?.video_url"
              controls
              preload="metadata"
            />
            <div v-else class="scene-pending">
              <el-icon><VideoCamera /></el-icon>
            </div>
            <p>{{ scene.visual_prompt }}</p>
            <small>{{ scene.narration }}</small
            ><button
              class="btn small full form-gap"
              :disabled="
                actionBusy ||
                current.status === 'processing' ||
                current.status === 'cancelled'
              "
              @click="
                run(
                  current.status === 'completed' ? 'rerender' : 'scene',
                  scene.index,
                )
              "
            >
              <el-icon><Refresh /></el-icon
              >{{ clipOf(scene.index) ? "重新生成此镜" : "生成此镜" }}
            </button>
          </article>
        </div>
        <div v-if="current.delivery?.subtitle_info" class="hint-band">
          字幕状态：{{ current.delivery.subtitle_info.status }}
          {{ current.delivery.subtitle_info.reason
          }}<a
            v-for="file in current.delivery.subtitle_info.files || []"
            :key="file.format"
            :href="file.url"
            download
            class="text-button"
            >{{ file.format.toUpperCase() }}</a
          >
        </div>
      </div>
    </el-dialog>
    <el-dialog v-model="scriptPicker" title="选择剧情稿" width="600px"
      ><button
        v-for="item in scripts"
        :key="item.id"
        class="record-link"
        @click="chooseScript(item)"
      >
        <div>
          <strong>{{ titleOf(item) }}</strong
          ><small
            >{{ item.estimated_duration }} 秒 ·
            {{ item.storyboard?.scenes?.length || 0 }} 个镜头</small
          >
        </div>
        <el-icon><ArrowRight /></el-icon>
      </button>
      <div v-if="!scripts.length" class="empty">
        暂无剧情稿<button class="btn primary" @click="router.push('/script')">
          前往创作
        </button>
      </div>
      <div v-if="scriptTotal > 10" class="pagination">
        <el-pagination
          small
          layout="prev, pager, next"
          :total="scriptTotal"
          :page-size="10"
          v-model:current-page="scriptPage"
          @current-change="loadScripts"
        /></div
    ></el-dialog>
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
import { videoApi, scriptApi } from "@/api";
import { useProductionStore } from "@/stores/production";
import {
  dateText,
  titleOf,
  statusText,
  statusClass,
  useScript,
  downloadFile,
} from "@/utils/studio";
const router = useRouter(),
  route = useRoute(),
  { flow } = useProductionStore();
const models = ref<any[]>([]),
  model = ref(flow.storyboard?.video_model || flow.video_model),
  options = reactive({
    ...flow.production_options,
    subtitle_formats: [...flow.production_options.subtitle_formats],
  });
const modelInfo = computed(() =>
    models.value.find((m) => m.model === model.value),
  ),
  sceneCount = computed(() => flow.storyboard?.scenes?.length || 0),
  referenceCount = computed(
    () => flow.characters.filter((c) => c.views?.sheet).length,
  ),
  totalDuration = computed(() =>
    (flow.storyboard?.scenes || []).reduce(
      (n: number, s: any) => n + Number(s.duration || 0),
      0,
    ),
  );
const compatibilityError = computed(() => {
  if (options.generation_mode === "direct" && totalDuration.value > 30)
    return "整片直出支持 2–30 秒，当前剧情请使用逐镜生成。";
  if (
    options.generation_mode === "scenes" &&
    modelInfo.value?.fixed_scene_duration &&
    flow.storyboard?.scenes?.some(
      (s: any) => s.duration !== modelInfo.value.fixed_scene_duration,
    )
  )
    return `当前模型要求每镜 ${modelInfo.value.fixed_scene_duration} 秒，请切换兼容模型。`;
  return "";
});
const tasks = ref<any[]>([]),
  total = ref(0),
  page = ref(1),
  filter = ref(""),
  loading = ref(false),
  creating = ref(false),
  deletingTaskId = ref<number | null>(null),
  current = ref<any>(null),
  taskOpen = ref(false),
  taskModel = ref(""),
  actionBusy = ref(false);
const scripts = ref<any[]>([]),
  scriptTotal = ref(0),
  scriptPage = ref(1),
  scriptPicker = ref(false);
const editable = computed(() =>
  ["pending", "partial", "ready", "failed"].includes(current.value?.status),
);
const clipOf = (index: number) =>
  current.value?.scene_clips?.find((c: any) => c.index === index);
let pollTimer: ReturnType<typeof setTimeout> | undefined,
  disposed = false,
  taskRequest = 0,
  listRequest = 0;
function stopPolling() {
  clearTimeout(pollTimer);
}
async function refreshTask(id: number) {
  const sequence = ++taskRequest;
  const r = await videoApi.getTaskProgress(id);
  if (sequence !== taskRequest || disposed) return;
  current.value = r.data;
  if (current.value.status === "completed") {
    const result = await videoApi.getTaskResult(id);
    if (sequence === taskRequest)
      current.value = { ...current.value, ...result.data };
  }
}
async function poll(id: number) {
  stopPolling();
  pollTimer = setTimeout(async () => {
    if (!taskOpen.value || disposed) return;
    try {
      await refreshTask(id);
      await loadTasks();
    } catch {}
    if (taskOpen.value && current.value?.status === "processing") poll(id);
  }, 4000);
}
async function openTask(id: number) {
  stopPolling();
  try {
    await refreshTask(id);
    taskModel.value = current.value.video_model;
    taskOpen.value = true;
    if (current.value.status === "processing") poll(id);
  } catch {}
}
async function loadTasks() {
  const sequence = ++listRequest;
  loading.value = true;
  try {
    const r = await videoApi.getTasks(page.value, 8, filter.value || undefined);
    if (sequence !== listRequest || disposed) return;
    tasks.value = r.data.tasks;
    total.value = r.data.total;
    const lastPage = Math.max(1, Math.ceil(total.value / 8));
    if (page.value > lastPage) {
      page.value = lastPage;
      await loadTasks();
    }
  } catch {
  } finally {
    if (sequence === listRequest) loading.value = false;
  }
}
async function deleteTask(task: any) {
  if (deletingTaskId.value !== null) return;
  deletingTaskId.value = task.id;
  try {
    try {
      await ElMessageBox.confirm(
        `确认删除视频任务 #${task.id}「${titleOf(task)}」？删除后不可恢复，任务及关联记录将从后台删除。正在生成的任务将停止后续处理，但已提交云端的请求可能无法撤回，仍可能计费且不保证退费。已生成的视频文件和来源剧情稿将保留。`,
        "确认删除任务",
        {
          confirmButtonText: "确认删除",
          cancelButtonText: "取消",
          type: "warning",
          autofocus: false,
        },
      );
    } catch {
      return;
    }
    await videoApi.deleteTask(task.id);
    ++listRequest;
    if (current.value?.id === task.id) {
      stopPolling();
      ++taskRequest;
      taskOpen.value = false;
      current.value = null;
    }
    if (Number(route.query.task_id) === task.id) {
      const query = { ...route.query };
      delete query.task_id;
      await router.replace({ query });
    }
    ElMessage.success("视频任务已删除");
    await loadTasks();
  } catch {
  } finally {
    deletingTaskId.value = null;
  }
}
async function create() {
  if (creating.value || compatibilityError.value) return;
  creating.value = true;
  try {
    flow.video_model = model.value;
    flow.production_options = {
      ...options,
      subtitle_formats: [...options.subtitle_formats],
    };
    const r = await videoApi.createTask({
      script_id: flow.script_id!,
      auto_start: false,
      video_model: model.value,
      production_options: flow.production_options,
    });
    await loadTasks();
    await openTask(r.data.task_id);
    ElMessage.success("视频任务已创建");
  } catch {
  } finally {
    creating.value = false;
  }
}
async function saveTaskModel() {
  if (!current.value) return;
  actionBusy.value = true;
  try {
    await videoApi.changeModel(current.value.id, taskModel.value);
    await refreshTask(current.value.id);
    await loadTasks();
    ElMessage.success("任务模型已保存");
  } catch {
  } finally {
    actionBusy.value = false;
  }
}
async function saveTaskOptions() {
  actionBusy.value = true;
  try {
    await videoApi.changeOptions(current.value.id, { ...options });
    await refreshTask(current.value.id);
    ElMessage.success("生成设置已保存");
  } catch {
  } finally {
    actionBusy.value = false;
  }
}
async function run(action: string, index?: number) {
  if (!current.value || actionBusy.value) return;
  if (taskModel.value !== current.value.video_model) {
    ElMessage.warning("请先保存任务模型");
    return;
  }
  if (action !== "compose") {
    try {
      await ElMessageBox.confirm(
        `使用 ${current.value.video_model}（${current.value.video_config?.resolution}）${index != null ? "生成第 " + index + " 镜" : "生成视频"}。${current.value.video_config?.billing_label || "会产生云端生成费用"}${index != null && clipOf(index) ? "；已有镜头将被替换" : ""}。`,
        "确认生成",
        {
          confirmButtonText: "开始生成",
          cancelButtonText: "取消",
          type: "warning",
        },
      );
    } catch {
      return;
    }
  }
  actionBusy.value = true;
  try {
    const id = current.value.id;
    if (action === "compose") await videoApi.composeVideo(id);
    else if (action === "scene") await videoApi.renderScene(id, index!);
    else if (action === "rerender") await videoApi.rerenderScene(id, index!);
    else await videoApi.startRender(id);
    await refreshTask(id);
    poll(id);
    await loadTasks();
  } catch {
  } finally {
    actionBusy.value = false;
  }
}
async function cancel() {
  try {
    await ElMessageBox.confirm(
      "确认取消当前任务？已提交云端的请求可能仍会计费。",
      "取消任务",
      { confirmButtonText: "取消任务", cancelButtonText: "返回" },
    );
  } catch {
    return;
  }
  actionBusy.value = true;
  try {
    await videoApi.cancelTask(current.value.id);
    await refreshTask(current.value.id);
    stopPolling();
    await loadTasks();
  } catch {
  } finally {
    actionBusy.value = false;
  }
}
async function download() {
  try {
    await downloadFile(
      current.value.final_video_url,
      `video-${current.value.id}.mp4`,
    );
  } catch {
    ElMessage.error("下载失败");
  }
}
async function loadScripts() {
  try {
    const r = await scriptApi.getScripts(scriptPage.value, 10);
    scripts.value = r.data.scripts;
    scriptTotal.value = r.data.total;
  } catch {}
}
function chooseScript(s: any) {
  useScript(s);
  model.value = flow.video_model || model.value;
  scriptPicker.value = false;
}
watch(scriptPicker, (v) => {
  if (v) loadScripts();
});
watch(
  () => route.query.task_id,
  (id) => {
    if (id) openTask(Number(id));
  },
);
onMounted(async () => {
  loadTasks();
  if (route.query.task_id) openTask(Number(route.query.task_id));
  try {
    const r = await scriptApi.getScriptOptions();
    models.value = r.data.video_models;
    if (!model.value) model.value = r.data.video.model;
    if (flow.script_id) {
      const s = await scriptApi.getScript(flow.script_id);
      useScript(s.data);
    }
  } catch {}
});
onBeforeUnmount(() => {
  disposed = true;
  stopPolling();
});
</script>
<style scoped>
.ready-items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 11px;
}
.ready-items > div {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f5f9f8;
  border-radius: 10px;
  padding: 13px;
}
.ready-icon {
  width: 29px;
  height: 29px;
  background: #dff4ef;
  color: #16aa97;
  display: grid;
  place-items: center;
  border-radius: 50%;
  flex-shrink: 0;
}
.ready-items small {
  display: block;
  font-size: 9px;
  color: #8da0ac;
  margin-bottom: 8px;
}
.ready-items strong {
  font-size: 11px;
}
.generation-modes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.generation-modes button {
  display: flex;
  align-items: center;
  text-align: left;
  gap: 26px;
  padding: 16px;
  border: 1px solid #dce5e9;
  background: #fff;
  border-radius: 10px;
  min-height: 64px;
  color: #1ba89f;
}
.generation-modes button.active {
  border-color: #1eb6ad;
  box-shadow: inset 0 0 0 1px #1eb6ad;
  background: #f0f9f8;
}
.generation-modes button > .el-icon {
  font-size: 20px;
}
.generation-modes button > .el-icon:last-child {
  margin-left: auto;
  font-size: 15px;
}
.generation-modes strong {
  display: block;
  color: #254351;
  font-size: 12px;
}
.generation-modes small {
  display: block;
  color: #8b9faa;
  font-size: 9px;
  margin-top: 5px;
}
.scene-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.scene-task {
  border: 1px solid #dfe8eb;
  border-radius: 8px;
  padding: 15px;
  overflow: hidden;
}
.scene-task video {
  width: 100%;
  height: 200px;
  background: #12272b;
  object-fit: contain;
  border-radius: 5px;
}
.scene-pending {
  height: 120px;
  background: #f1f7f6;
  display: grid;
  place-items: center;
  font-size: 32px;
  color: #a3c6c4;
}
.scene-task p {
  font-size: 12px;
  line-height: 1.8;
  margin-top: 12px;
  max-height: 120px;
  overflow: auto;
}
.scene-task small {
  font-size: 11px;
  color: #8a9da6;
  margin-top: 8px;
  display: block;
  line-height: 1.7;
}
@media (max-width: 700px) {
  .generation-modes {
    grid-template-columns: 1fr;
  }
  .ready-items {
    grid-template-columns: 1fr;
  }
  .ready-items > div {
    padding: 10px;
  }
  .ready-items small {
    display: inline;
    margin-right: 10px;
  }
  .scene-grid {
    grid-template-columns: 1fr;
  }
  .generation-modes button {
    gap: 18px;
  }
}
</style>
