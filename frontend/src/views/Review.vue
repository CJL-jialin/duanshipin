<template>
  <div class="split-layout left-rail review-layout">
    <aside class="panel panel-pad review-history" v-loading="loading">
      <div class="panel-heading">
        <div>
          <h2>历史剧本</h2>
          <p>共 {{ total }} 条内容</p>
        </div>
        <button
          class="text-button"
          title="搜索剧本"
          @click="showSearch = !showSearch"
        >
          <el-icon :size="19"><Search /></el-icon>
        </button>
      </div>
      <input
        v-if="showSearch"
        v-model="search"
        class="studio-input"
        placeholder="搜索剧本"
        aria-label="搜索剧本"
      />
      <div class="selection-list">
        <button
          v-for="item in scripts"
          :key="item.id"
          class="record-link"
          :class="{ active: selected?.id === item.id }"
          @click="selected = item"
        >
          <div>
            <strong>{{ titleOf(item) }}</strong
            ><small
              >{{ dateText(item.created_at).split(" ")[0] }} ·
              {{ reviewText(item.review) }}</small
            >
          </div>
          <b v-if="item.review?.score != null" class="teal">{{
            normalized(item.review.score)
          }}</b
          ><span v-else class="badge neutral">待审核</span>
        </button>
      </div>
      <div v-if="!scripts.length" class="empty compact">暂无剧本</div>
      <div v-if="total > 8" class="pagination">
        <el-pagination
          small
          layout="prev, next"
          :page-size="8"
          :total="total"
          v-model:current-page="page"
          @current-change="load"
        />
      </div>
    </aside>
    <div v-if="selected" class="stack">
      <section class="panel panel-pad review-summary">
        <div class="score-ring" :style="{ '--score': score ?? 0 }">
          <div>
            <strong>{{ score ?? "—" }}</strong
            ><small>加权折算分</small>
          </div>
        </div>
        <div class="summary-content">
          <span
            class="badge"
            :class="
              review?.pass === true
                ? 'success'
                : review?.pass === false
                  ? 'danger'
                  : 'neutral'
            "
            >{{ reviewText(review) }}</span
          >
          <h2>{{ titleOf(selected) }}</h2>
          <p class="muted">
            {{
              review?.reviewed
                ? review.pass
                  ? "内容审核已通过，建议结合平台实际规则发布。"
                  : "内容存在优化空间，请查看下方具体意见。"
                : "此剧本尚未取得有效的 AI 审核结果"
            }}
          </p>
          <p class="muted">
            {{
              review?.pass_line != null
                ? "及格线 " + normalized(review.pass_line) + " 分 · "
                : ""
            }}{{ dateText(selected.created_at) }}
          </p>
        </div>
        <button class="btn" :disabled="regenerating" @click="regenerate">
          <el-icon :class="{ 'is-loading': regenerating }"><Refresh /></el-icon
          >{{ regenerating ? "正在重新生成…" : "按建议重新生成" }}
        </button>
      </section>
      <div v-if="dimensions.length" class="review-dimensions">
        <section
          v-for="dim in dimensions"
          :key="dim.key"
          class="panel dimension"
        >
          <div>
            <span>{{ dim.label }}</span
            ><strong class="teal">{{ dim.score }}</strong>
          </div>
          <el-progress
            :percentage="dim.score"
            :show-text="false"
            :stroke-width="5"
            color="#23afa6"
          />
          <p class="muted">原始评分 {{ dim.original }} / 5</p>
        </section>
      </div>
      <section class="panel panel-pad">
        <div class="panel-heading">
          <div>
            <h2>平台合规检测</h2>
            <p>基于 AI 审核返回的社区规范判断</p>
          </div>
          <span
            class="badge"
            :class="
              compliance?.pass === true
                ? 'success'
                : compliance?.pass === false
                  ? 'danger'
                  : 'neutral'
            "
            >{{
              compliance?.pass === true
                ? "未发现风险"
                : compliance?.pass === false
                  ? "发现风险"
                  : "尚未检测"
            }}</span
          >
        </div>
        <div class="compliance-grid">
          <div v-for="item in checks" :key="item.label" class="compliance-item">
            <span class="check-mark" :class="item.tone"
              ><el-icon
                ><Check v-if="item.tone === 'success'" /><Warning
                  v-else /></el-icon
            ></span>
            <div>
              <strong>{{ item.label }}</strong
              ><small>{{ item.value }}</small>
            </div>
          </div>
        </div>
        <div
          v-for="(item, i) in compliance?.violations || []"
          :key="i"
          class="hint-band warning form-gap"
        >
          {{ item }}
        </div>
        <div class="hint-band form-gap">
          AI 合规结果仅供辅助参考，最终审核结果以平台实际判定为准。
        </div>
      </section>
      <section
        v-if="review?.issues?.length || review?.suggestions?.length"
        class="panel panel-pad"
      >
        <h2>审核意见</h2>
        <div class="fields form-gap">
          <div>
            <h3>待改进项</h3>
            <p v-for="(item, i) in review.issues" :key="i" class="review-note">
              {{ item }}
            </p>
            <p v-if="!review.issues?.length" class="muted">暂无问题记录</p>
          </div>
          <div>
            <h3>优化建议</h3>
            <p
              v-for="(item, i) in review.suggestions"
              :key="i"
              class="review-note"
            >
              {{ item }}
            </p>
            <p v-if="!review.suggestions?.length" class="muted">暂无建议</p>
          </div>
        </div>
      </section>
      <section class="panel panel-pad">
        <div class="panel-heading">
          <h2>剧情正文</h2>
          <button
            class="text-button"
            @click="router.push('/script?script_id=' + selected.id)"
          >
            编辑分镜<el-icon><ArrowRight /></el-icon>
          </button>
        </div>
        <div class="prose">{{ selected.script_text }}</div>
      </section>
    </div>
    <section v-else class="panel empty">
      <el-icon><DocumentChecked /></el-icon><span>选择剧本查看审核结果</span
      ><button class="btn primary" @click="router.push('/script')">
        创建剧情稿
      </button>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { scriptApi } from "@/api";
import { dateText, titleOf, useScript } from "@/utils/studio";
import { useProductionStore } from "@/stores/production";
const route = useRoute(),
  router = useRouter(),
  { flow } = useProductionStore();
const scripts = ref<any[]>([]),
  selected = ref<any>(null),
  total = ref(0),
  page = ref(1),
  loading = ref(false),
  regenerating = ref(false),
  search = ref(""),
  showSearch = ref(false);
const review = computed(() => selected.value?.review),
  compliance = computed(() => review.value?.compliance);
const normalized = (n: number) => Math.round(Number(n) * 20);
const score = computed(() =>
  review.value?.score != null ? normalized(review.value.score) : null,
);
const labels: Record<string, string> = {
  hook: "开场吸引力",
  story: "剧情张力",
  immersion: "代入感",
  structure: "结构节奏",
  interaction: "互动潜力",
  pace: "叙事节奏",
  info_density: "信息增量",
};
const dimensions = computed(() =>
  Object.entries(review.value?.scores || {}).map(([key, value]) => ({
    key,
    label: labels[key] || key,
    score: normalized(Number(value)),
    original: value,
  })),
);
const checks = computed(() => [
  {
    label: "社区规范审核",
    value:
      compliance.value?.pass === true
        ? "检查通过"
        : compliance.value?.pass === false
          ? "需要修改"
          : "未提供检测结果",
    tone: compliance.value?.pass === true ? "success" : "neutral",
  },
  {
    label: "违规内容记录",
    value: compliance.value
      ? `${compliance.value.violations?.length || 0} 项风险`
      : "未检测",
    tone: compliance.value?.pass === true ? "success" : "neutral",
  },
  {
    label: "内容问题记录",
    value: review.value?.reviewed
      ? `${review.value.issues?.length || 0} 项`
      : "未审核",
    tone:
      review.value?.reviewed && !review.value.issues?.length
        ? "success"
        : "neutral",
  },
  {
    label: "优化建议",
    value: review.value?.reviewed
      ? `${review.value.suggestions?.length || 0} 项建议`
      : "未审核",
    tone: "neutral",
  },
]);
const reviewText = (r: any) =>
  r?.pass === true ? "审核通过" : r?.pass === false ? "建议优化" : "未执行审核";
async function load() {
  loading.value = true;
  try {
    const r = await scriptApi.getScripts(page.value, 8, search.value);
    scripts.value = r.data.scripts;
    total.value = r.data.total;
    if (!selected.value)
      selected.value =
        scripts.value.find((s) => s.id === flow.script_id) || scripts.value[0];
  } catch {
  } finally {
    loading.value = false;
  }
}
async function target() {
  if (route.query.script_id) {
    try {
      const r = await scriptApi.getScript(Number(route.query.script_id));
      selected.value = r.data;
    } catch {}
  }
}
async function regenerate() {
  if (!selected.value || regenerating.value) return;
  try {
    await ElMessageBox.confirm(
      "将按审核意见重新生成并覆盖当前剧本，使用已配置的文字生成服务。",
      "重新生成",
      { confirmButtonText: "开始生成", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  regenerating.value = true;
  try {
    const r = await scriptApi.regenerateScript(selected.value.id);
    Object.assign(selected.value, r.data, { script_text: r.data.script });
    if (flow.script_id === selected.value.id) useScript(selected.value);
    await load();
    ElMessage.success("已重新生成并审核");
  } catch {
  } finally {
    regenerating.value = false;
  }
}
let timer: ReturnType<typeof setTimeout>;
watch(search, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(() => route.query.script_id, target);
onMounted(async () => {
  await target();
  await load();
});
onBeforeUnmount(() => clearTimeout(timer));
</script>
<style scoped>
.review-layout {
  grid-template-columns: 303px minmax(0, 1fr);
}
.review-history {
  min-height: 600px;
  padding: 20px 15px;
}
.review-history > .panel-heading {
  padding: 0 7px;
}
.review-summary {
  display: flex;
  align-items: center;
  gap: 38px;
  min-height: 153px;
}
.score-ring {
  width: 97px;
  height: 97px;
  flex-shrink: 0;
  background: conic-gradient(#20afa5 calc(var(--score) * 1%), #e5eeee 0);
  border-radius: 50%;
  padding: 10px;
}
.score-ring > div {
  height: 100%;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.score-ring strong {
  font-size: 29px;
}
.score-ring small {
  font-size: 9px;
  color: #8b9da8;
  margin-top: 2px;
}
.summary-content {
  flex: 1;
  min-width: 0;
}
.summary-content h2 {
  margin: 9px 0 6px;
  font-size: 15px;
  overflow-wrap: anywhere;
}
.summary-content p + p {
  margin-top: 5px;
}
.review-dimensions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.dimension {
  padding: 17px;
}
.dimension > div {
  display: flex;
  justify-content: space-between;
  gap: 9px;
  align-items: center;
  font-size: 11px;
  margin-bottom: 12px;
}
.dimension strong {
  font-size: 16px;
}
.dimension p {
  margin-top: 15px;
  font-size: 9px;
}
.compliance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}
.compliance-item {
  border: 1px solid #e1e9ec;
  border-radius: 9px;
  padding: 14px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
}
.check-mark {
  width: 29px;
  height: 29px;
  background: #f1f4f6;
  color: #97a4ad;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.check-mark.success {
  background: #e8f7f1;
  color: #14aa91;
}
.compliance-item strong {
  font-size: 11px;
}
.compliance-item small {
  display: block;
  font-size: 9px;
  color: #8d9fa8;
  margin-top: 8px;
}
.review-note {
  margin-top: 12px;
  line-height: 1.8;
  color: #657d88;
  font-size: 12px;
}
.prose {
  max-height: 350px;
  overflow: auto;
}
@media (max-width: 1200px) {
  .review-layout {
    grid-template-columns: 260px minmax(0, 1fr);
  }
  .review-summary {
    gap: 20px;
    flex-wrap: wrap;
  }
  .review-summary > .btn {
    margin-left: auto;
  }
  .review-dimensions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 1000px) {
  .review-layout {
    grid-template-columns: 1fr;
  }
  .review-history {
    min-height: 0;
  }
}
@media (max-width: 700px) {
  .score-ring {
    width: 82px;
    height: 82px;
    padding: 8px;
  }
  .review-summary {
    gap: 14px;
  }
  .compliance-grid {
    grid-template-columns: 1fr;
  }
  .review-summary > .btn {
    width: 100%;
  }
}
</style>
