<template>
  <div class="stack dashboard-page">
    <div class="section-toolbar">
      <div>
        <h2>今日数据概览</h2>
        <p class="subtext">内容生产与发布数据汇总</p>
      </div>
      <button class="btn" :disabled="loading" @click="load">
        <el-icon :class="{ 'is-loading': loading }"><Refresh /></el-icon
        >刷新数据
      </button>
    </div>
    <div v-if="failed" class="error-state">
      数据加载失败<button class="text-button" @click="load">重新加载</button>
    </div>
    <div class="metrics-grid" v-loading="loading">
      <div v-for="metric in metrics" :key="metric.label" class="metric">
        <span class="metric-icon" :class="metric.color"
          ><el-icon><component :is="metric.icon" /></el-icon
        ></span>
        <div>
          <div class="metric-label">{{ metric.label }}</div>
          <strong class="metric-value">{{ metric.value }}</strong>
        </div>
      </div>
    </div>
    <div class="dashboard-middle">
      <section class="creation-banner">
        <div class="creation-spark">
          <el-icon><MagicStick /></el-icon>
        </div>
        <div>
          <small>AI 创作助手</small>
          <h2>把灵感变成下一条爆款视频</h2>
          <p>输入一个想法，AI 为你完成剧本、分镜、画面与配音</p>
        </div>
        <button class="btn primary" @click="router.push('/script')">
          <el-icon><Plus /></el-icon>开始创作
        </button>
      </section>
      <section class="panel panel-pad performance-preview">
        <small class="teal">近 7 日表现</small>
        <h2>{{ hasTrend ? "已发布内容表现" : "等待你的第一份数据" }}</h2>
        <TrendChart v-if="hasTrend" :data="trend" :height="84" compact />
        <div v-else class="trend-empty">暂无发布数据</div>
        <button class="text-button" @click="router.push('/analytics')">
          查看完整数据报告<el-icon><ArrowRight /></el-icon>
        </button>
      </section>
    </div>
    <section class="panel">
      <div class="panel-pad panel-heading" style="margin-bottom: 0">
        <div>
          <h2>最近生成的视频</h2>
          <p>查看和管理近期视频任务</p>
        </div>
        <button class="text-button" @click="router.push('/video')">
          查看全部<el-icon><ArrowRight /></el-icon>
        </button>
      </div>
      <div v-if="!tasks.length && !loading" class="empty">
        <el-icon><VideoCamera /></el-icon><span>还没有视频任务</span
        ><button class="btn primary small" @click="router.push('/script')">
          开始创作
        </button>
      </div>
      <div v-else class="table-wrap">
        <table class="studio-table">
          <thead>
            <tr>
              <th>视频内容</th>
              <th>状态</th>
              <th>质量评分</th>
              <th>创建时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>
                <div class="table-title">
                  <span class="table-thumb"
                    ><img
                      v-if="task.cover_image_url"
                      :src="task.cover_image_url"
                      alt="视频封面" /><el-icon v-else><VideoCamera /></el-icon
                  ></span>
                  <div>
                    <strong>{{ titleOf(task) }}</strong
                    ><small>{{ task.video_model }} · #{{ task.id }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="statusClass(task.status)">{{
                  statusText(task.status)
                }}</span>
              </td>
              <td>
                <strong class="teal">{{ task.quality_score ?? "—" }}</strong
                ><small v-if="task.quality_score != null"> / 100</small>
              </td>
              <td class="muted">{{ dateText(task.created_at) }}</td>
              <td>
                <div class="table-actions">
                  <button
                    class="icon-button"
                    :disabled="!task.final_video_url"
                    title="播放视频"
                    @click="preview = task.final_video_url"
                  >
                    <el-icon><VideoPlay /></el-icon></button
                  ><button
                    class="icon-button"
                    :disabled="!task.final_video_url"
                    title="下载视频"
                    @click="download(task)"
                  >
                    <el-icon><Download /></el-icon></button
                  ><button
                    class="icon-button"
                    title="任务详情"
                    @click="router.push('/video?task_id=' + task.id)"
                  >
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <el-dialog
      :model-value="!!preview"
      title="成片预览"
      width="620px"
      destroy-on-close
      @close="preview = ''"
      ><video :src="preview" class="video-player" controls autoplay
    /></el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  VideoCamera,
  Upload,
  DataAnalysis,
  MagicStick,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { analyticsApi, videoApi } from "@/api";
import TrendChart from "@/components/business/TrendChart.vue";
import {
  dateText,
  numberText,
  statusClass,
  statusText,
  titleOf,
  downloadFile,
} from "@/utils/studio";
const router = useRouter(),
  overview = ref<any>(null),
  tasks = ref<any[]>([]),
  trend = ref<any[]>([]),
  loading = ref(false),
  failed = ref(false),
  preview = ref("");
const metrics = computed(() => [
  {
    label: "视频总数",
    value: numberText(overview.value?.total_videos),
    icon: VideoCamera,
    color: "",
  },
  {
    label: "已发布",
    value: numberText(overview.value?.total_published),
    icon: Upload,
    color: "blue",
  },
  {
    label: "总播放量",
    value: numberText(overview.value?.total_views),
    icon: DataAnalysis,
    color: "purple",
  },
  {
    label: "平均质量分",
    value: overview.value?.avg_quality_score ?? "—",
    icon: MagicStick,
    color: "gold",
  },
]);
const hasTrend = computed(() => trend.value.some((t) => t.published_count > 0));
async function load() {
  loading.value = true;
  failed.value = false;
  try {
    const [a, t, v] = await Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getTrend(7),
      videoApi.getTasks(1, 6),
    ]);
    overview.value = a.data;
    trend.value = t.data.trend;
    tasks.value = v.data.tasks;
  } catch {
    failed.value = true;
  } finally {
    loading.value = false;
  }
}
async function download(task: any) {
  try {
    await downloadFile(task.final_video_url, `video-${task.id}.mp4`);
  } catch {
    ElMessage.error("下载失败");
  }
}
onMounted(load);
</script>
<style scoped>
.dashboard-page {
  gap: 15px;
}
.section-toolbar {
  margin: 0 0 3px;
}
.dashboard-middle {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 15px;
}
.creation-banner {
  background: linear-gradient(110deg, #173b3e, #195452);
  border-radius: 13px;
  min-height: 223px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 22px;
  color: #fff;
  overflow: hidden;
  position: relative;
}
.creation-banner:after {
  content: "";
  position: absolute;
  right: -40px;
  top: -100px;
  width: 220px;
  height: 220px;
  border: 1px solid #ffffff0a;
  border-radius: 50%;
  pointer-events: none;
}
.creation-spark {
  width: 65px;
  height: 65px;
  border: 1px solid #438a88;
  background: #1a4b4d;
  border-radius: 19px;
  display: grid;
  place-items: center;
  font-size: 30px;
  flex-shrink: 0;
}
.creation-banner small {
  font-size: 10px;
  color: #45d8d9;
  font-weight: 600;
}
.creation-banner h2 {
  color: #fff;
  font-size: 20px;
  margin: 10px 0 6px;
  line-height: 1.6;
}
.creation-banner p {
  font-size: 11px;
  color: #89c5ca;
}
.creation-banner .btn {
  margin-left: auto;
  flex-shrink: 0;
}
.performance-preview {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.performance-preview > small {
  font-size: 10px;
}
.performance-preview h2 {
  margin-top: 8px;
}
.performance-preview > .text-button {
  margin-top: 14px;
}
.trend-empty {
  min-height: 80px;
  display: grid;
  place-items: center;
  font-size: 11px;
  color: #a0b4ba;
}
@media (max-width: 1250px) {
  .creation-banner {
    gap: 14px;
  }
  .creation-banner h2 {
    font-size: 18px;
  }
  .creation-spark {
    display: none;
  }
}
@media (max-width: 1000px) {
  .dashboard-middle {
    grid-template-columns: 1fr;
  }
  .creation-spark {
    display: grid;
  }
  .performance-preview {
    min-height: 190px;
  }
}
@media (max-width: 700px) {
  .creation-banner {
    flex-wrap: wrap;
    padding: 22px;
    gap: 14px;
  }
  .creation-spark {
    width: 45px;
    height: 45px;
    border-radius: 12px;
  }
  .creation-banner h2 {
    font-size: 16px;
  }
  .creation-banner .btn {
    margin-left: 0;
  }
  .creation-banner p {
    line-height: 1.7;
  }
}
</style>
