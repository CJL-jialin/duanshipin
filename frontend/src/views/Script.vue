<template>
  <div class="split-layout script-layout">
    <section class="panel panel-pad" v-loading="loading">
      <div class="creation-steps">
        <button
          v-for="(label, i) in ['创意输入', '剧情与分镜', '保存内容']"
          :key="label"
          :class="{ active: step >= i }"
          :disabled="i > 0 && !record"
          @click="step = i"
        >
          <b>{{ i + 1 }}</b
          ><span>{{ label }}</span>
        </button>
      </div>
      <template v-if="step === 0">
        <div class="input-tabs">
          <button
            :class="{ active: form.input_type === 'keyword' }"
            @click="form.input_type = 'keyword'"
          >
            关键词创作</button
          ><button
            :class="{ active: form.input_type === 'long_text' }"
            @click="form.input_type = 'long_text'"
          >
            长文本改编
          </button>
        </div>
        <label class="field"
          ><span class="field-label"
            >{{ form.input_type === "keyword" ? "你的创作主题" : "你的原始内容"
            }}<small>{{ form.input_content.length }} / 2000</small></span
          ><textarea
            v-model="form.input_content"
            rows="5"
            maxlength="2000"
            :placeholder="
              form.input_type === 'keyword'
                ? '输入你的创作主题'
                : '输入需要改编的长文本'
            "
          />
        </label>
        <div class="inspirations">
          <small>灵感推荐</small
          ><button
            v-for="tag in ['职场成长', '情绪疗愈', '认知提升', '人际关系']"
            :key="tag"
            class="chip"
            @click="form.input_content = tag"
          >
            {{ tag }}
          </button>
        </div>
        <div class="fields form-gap">
          <label class="field"
            >视频模型<select
              v-model="form.video_model"
              :disabled="!models.length || generating"
            >
              <option
                v-for="model in models"
                :key="model.model"
                :value="model.model"
              >
                {{ model.model }} · {{ model.resolution }}
              </option>
            </select></label
          ><label class="field"
            >目标时长<select
              v-model="form.target_duration"
              :disabled="!options.length || generating"
            >
              <option
                v-for="option in options"
                :key="option.duration"
                :value="option.duration"
              >
                {{ option.label }}
              </option>
            </select></label
          >
        </div>
        <div class="hint-band form-gap">
          <el-icon><MagicStick /></el-icon
          ><span><strong>智能字数建议</strong> {{ durationHint }}</span>
        </div>
        <button
          class="btn primary full form-gap"
          :disabled="
            generating ||
            deletingRecordId !== null ||
            !form.input_content.trim() ||
            !form.video_model
          "
          @click="generate"
        >
          <el-icon :class="{ 'is-loading': generating }"
            ><Loading v-if="generating" /><MagicStick v-else /></el-icon
          >{{ generating ? "正在生成剧情与分镜…" : "生成剧情稿" }}
        </button>
      </template>
      <template v-else-if="record">
        <div class="panel-heading">
          <div>
            <h2>{{ titleOf(record) }}</h2>
            <p>
              {{ record.word_count }} 字 · {{ record.estimated_duration }} 秒 ·
              {{ record.storyboard?.scenes?.length || 0 }} 个镜头
            </p>
          </div>
          <span
            class="badge"
            :class="
              record.generated_by === 'template_fallback'
                ? 'neutral'
                : 'success'
            "
            >{{
              record.generated_by === "template_fallback" ? "模板稿" : "已保存"
            }}</span
          >
        </div>
        <el-tabs v-if="step === 1" v-model="resultTab"
          ><el-tab-pane label="剧情正文" name="text"
            ><div class="prose">{{ record.script_text }}</div></el-tab-pane
          ><el-tab-pane label="分镜编辑" name="scenes"
            ><div v-for="scene in scenes" :key="scene.index" class="scene-edit">
              <h3>
                镜头 {{ scene.index }}
                <small class="muted">{{ scene.duration }} 秒</small>
              </h3>
              <label class="field form-gap"
                >场景<input v-model="scene.scene" /></label
              ><label class="field form-gap"
                >画面描述<textarea
                  v-model="scene.visual_prompt"
                  rows="3"
                /></label
              ><label class="field form-gap"
                >对白 / 旁白<textarea v-model="scene.narration" rows="2" />
              </label>
            </div>
            <div v-if="!scenes.length" class="empty compact">
              当前剧本暂无分镜
            </div></el-tab-pane
          ></el-tabs
        >
        <template v-else
          ><div class="hint-band">
            <el-icon><CircleCheck /></el-icon>剧情稿已保存至历史创作
          </div>
          <div class="prose form-gap">{{ record.script_text }}</div></template
        >
        <div class="toolbar form-gap">
          <button
            class="icon-button delete-button"
            title="删除剧本"
            aria-label="删除剧本"
            :aria-busy="deletingRecordId === record.id"
            :disabled="generating || saving || deletingRecordId !== null"
            @click="deleteRecord(record)"
          >
            <el-icon :class="{ 'is-loading': deletingRecordId === record.id }" aria-hidden="true">
              <Loading v-if="deletingRecordId === record.id" /><Delete v-else />
            </el-icon>
          </button>
          <button class="btn" @click="step = 0">
            <el-icon><ArrowLeft /></el-icon>返回编辑</button
          ><button
            v-if="step === 1"
            class="btn primary"
            :disabled="saving || deletingRecordId !== null"
            @click="save"
          >
            <el-icon><Check /></el-icon
            >{{ saving ? "保存中…" : "保存内容" }}</button
          ><button
            class="btn"
            @click="router.push('/review?script_id=' + record.id)"
          >
            查看审核</button
          ><button class="btn primary" @click="continueCreation">
            定制角色<el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </template>
    </section>
    <aside class="panel panel-pad" v-loading="historyLoading">
      <h2>历史创作</h2>
      <p class="subtext">最近保存的剧情稿</p>
      <div
        v-for="item in history"
        :key="item.id"
        class="history-record"
      >
        <button
          class="record-link"
          :disabled="generating || saving || deletingRecordId !== null"
          @click="openRecord(item)"
        >
          <div>
            <strong>{{ titleOf(item) }}</strong
            ><small
              >{{ dateText(item.created_at) }} ·
              {{ item.estimated_duration }} 秒</small
            >
          </div>
          <el-icon><ArrowRight /></el-icon>
        </button>
        <button
          class="icon-button delete-button"
          :disabled="generating || saving || deletingRecordId !== null"
          title="删除历史创作"
          :aria-label="'删除历史创作 #' + item.id"
          :aria-busy="deletingRecordId === item.id"
          @click="deleteRecord(item)"
        >
          <el-icon :class="{ 'is-loading': deletingRecordId === item.id }" aria-hidden="true">
            <Loading v-if="deletingRecordId === item.id" /><Delete v-else />
          </el-icon>
        </button>
      </div>
      <div v-if="!history.length" class="empty compact">暂无历史创作</div>
      <div v-if="total > 6" class="pagination">
        <el-pagination
          small
          layout="prev, next"
          :total="total"
          :page-size="6"
          v-model:current-page="page"
          @current-change="loadHistory"
        />
      </div>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { scriptApi } from "@/api";
import { useProductionStore } from "@/stores/production";
import { useScript, titleOf, dateText } from "@/utils/studio";
const router = useRouter(),
  route = useRoute(),
  { flow } = useProductionStore();
const form = reactive({
  input_type: flow.input_type,
  input_content: flow.input_content,
  target_duration: flow.target_duration,
  video_model: flow.video_model,
});
const models = ref<any[]>([]),
  options = ref<any[]>([]),
  record = ref<any>(null),
  scenes = ref<any[]>([]),
  history = ref<any[]>([]),
  total = ref(0),
  page = ref(1),
  step = ref(0),
  resultTab = ref("text");
const loading = ref(false),
  generating = ref(false),
  saving = ref(false),
  deletingRecordId = ref<number | null>(null),
  historyLoading = ref(false);
const durationHint = computed(() => {
  const o = options.value.find((o) => o.duration === form.target_duration);
  return o
    ? `${form.target_duration} 秒视频建议 ${o.min_words}–${o.max_words} 字`
    : "正在读取模型支持的时长与字数";
});
let optionSequence = 0,
  historySequence = 0;
async function loadOptions() {
  const sequence = ++optionSequence;
  try {
    const r = await scriptApi.getScriptOptions(form.video_model || undefined);
    if (sequence !== optionSequence) return;
    options.value = r.data.options;
    models.value = r.data.video_models;
    if (!form.video_model) form.video_model = r.data.video.model;
    if (!options.value.some((o) => o.duration === form.target_duration))
      form.target_duration = r.data.default;
  } catch {}
}
async function loadHistory() {
  const sequence = ++historySequence;
  historyLoading.value = true;
  try {
    const r = await scriptApi.getScripts(page.value, 6);
    if (sequence !== historySequence) return;
    history.value = r.data.scripts;
    total.value = r.data.total;
    const lastPage = Math.max(1, Math.ceil(total.value / 6));
    if (page.value > lastPage) {
      page.value = lastPage;
      await loadHistory();
    }
  } catch {
  } finally {
    if (sequence === historySequence) historyLoading.value = false;
  }
}
function openRecord(item: any) {
  record.value = { ...item };
  scenes.value = JSON.parse(JSON.stringify(item.storyboard?.scenes || []));
  useScript(item);
  Object.assign(form, {
    input_type: flow.input_type,
    input_content: flow.input_content,
    target_duration: flow.target_duration,
    video_model: flow.video_model,
  });
  step.value = 1;
}
async function generate() {
  if (generating.value) return;
  generating.value = true;
  const input = { ...form };
  try {
    Object.assign(flow, input);
    const r = await scriptApi.generateScript(input);
    openRecord({
      ...r.data,
      script_text: r.data.script,
      input_content: input.input_content,
      input_type: input.input_type,
    });
    await loadHistory();
    ElMessage.success("剧情稿已生成并保存");
  } catch {
  } finally {
    generating.value = false;
  }
}
async function save() {
  saving.value = true;
  try {
    if (scenes.value.length) {
      const r = await scriptApi.updateStoryboard(record.value.id, {
        scenes: scenes.value.map((s) => ({
          index: s.index,
          scene: s.scene || "",
          visual_prompt: s.visual_prompt || "",
          narration: s.narration || "",
        })),
      });
      record.value = r.data;
      useScript(r.data);
    }
    step.value = 2;
    ElMessage.success("内容已保存");
  } catch {
  } finally {
    saving.value = false;
  }
}
async function deleteRecord(item: any) {
  if (
    !item ||
    generating.value ||
    saving.value ||
    deletingRecordId.value !== null
  ) return;
  const id = item.id;
  deletingRecordId.value = id;
  try {
    try {
      await ElMessageBox.confirm(
        `确认删除历史创作 #${id}「${titleOf(item)}」？删除后不可恢复，剧情稿、分镜和审核数据将从后台删除。已创建的视频任务、已生成的视频和角色图片会保留。`,
        "确认删除历史创作",
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
    await scriptApi.deleteScript(id);
    ++historySequence;
    if (flow.script_id === id) {
      flow.script_id = null;
      flow.script = "";
      flow.script_stats = null;
      flow.storyboard = null;
      flow.characters = [];
    }
    if (record.value?.id === id) {
      record.value = null;
      scenes.value = [];
      step.value = 0;
    }
    if (Number(route.query.script_id) === id) {
      const query = { ...route.query };
      delete query.script_id;
      await router.replace({ query });
    }
    await loadHistory();
    ElMessage.success("历史创作已删除");
  } catch {
  } finally {
    deletingRecordId.value = null;
  }
}
async function continueCreation() {
  if (step.value === 1 && resultTab.value === "scenes") {
    await save();
    if (step.value !== 2) return;
  }
  useScript(record.value);
  router.push("/avatar");
}
async function loadTarget() {
  if (route.query.new) {
    Object.assign(form, {
      input_type: flow.input_type,
      input_content: flow.input_content,
      target_duration: flow.target_duration,
      video_model: flow.video_model,
    });
    record.value = null;
    step.value = 0;
  } else if (route.query.script_id) {
    loading.value = true;
    try {
      const r = await scriptApi.getScript(Number(route.query.script_id));
      openRecord(r.data);
    } catch {
    } finally {
      loading.value = false;
    }
  }
}
watch(() => form.video_model, loadOptions);
watch(() => route.query, loadTarget);
onMounted(async () => {
  await Promise.all([loadOptions(), loadHistory(), loadTarget()]);
});
</script>
<style scoped>
.history-record {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #e7edef;
}
.history-record .record-link {
  flex: 1;
  min-width: 0;
  border: 0;
}
.script-layout {
  grid-template-columns: minmax(0, 1fr) 292px;
}
.creation-steps {
  display: flex;
  align-items: center;
  margin: 0 0 22px;
  padding: 0 0 3px;
}
.creation-steps button {
  display: flex;
  align-items: center;
  gap: 9px;
  background: none;
  border: 0;
  padding: 0;
  color: #96a4af;
  font-size: 11px;
  flex: 1;
  white-space: nowrap;
}
.creation-steps button:not(:last-child):after {
  content: "";
  height: 1px;
  background: #dce5e9;
  flex: 1;
  margin-right: 9px;
}
.creation-steps button:last-child {
  flex: 0;
}
.creation-steps b {
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #eef2f4;
  display: grid;
  place-items: center;
  font-weight: 500;
  flex-shrink: 0;
}
.creation-steps .active b {
  background: #18a39c;
  color: #fff;
}
.input-tabs {
  display: flex;
  gap: 18px;
  border-bottom: 1px solid #dfe7ea;
  margin-bottom: 19px;
}
.input-tabs button {
  border: 0;
  background: none;
  padding: 11px 17px 16px;
  color: #8a9aa7;
  font-size: 12px;
}
.input-tabs .active {
  color: #079e99;
  border-bottom: 2px solid #18aaa1;
  font-weight: 600;
}
.inspirations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 19px;
}
.inspirations > small {
  font-size: 10px;
  color: #96a3ad;
}
.scene-edit {
  padding: 18px 0;
  border-bottom: 1px solid #e4ecee;
}
.prose {
  max-height: 480px;
  overflow: auto;
}
@media (max-width: 1100px) {
  .script-layout {
    grid-template-columns: 1fr;
  }
  .creation-steps span {
    font-size: 10px;
  }
}
@media (max-width: 700px) {
  .creation-steps button {
    gap: 5px;
  }
  .creation-steps button:not(:last-child):after {
    margin-right: 5px;
  }
  .input-tabs button {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>
