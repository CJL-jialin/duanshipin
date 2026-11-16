<template>
  <div class="stack analytics-page" v-loading="loading">
    <div v-if="error" class="error-state">
      数据读取失败<button class="text-button" @click="load">重新加载</button>
    </div>
    <div class="analytics-kpis">
      <section v-for="item in metrics" :key="item.label" class="panel">
        <small>{{ item.label }}</small
        ><strong>{{ item.value }}</strong
        ><span>{{ item.note }}</span>
      </section>
    </div>
    <div class="analytics-charts">
      <section class="panel panel-pad">
        <div class="panel-heading">
          <div>
            <h2>数据趋势</h2>
            <p>近 {{ days }} 天发布作品的累计表现</p>
          </div>
          <el-radio-group v-model="metric" size="small"
            ><el-radio-button label="views">播放量</el-radio-button
            ><el-radio-button label="likes">点赞数</el-radio-button
            ><el-radio-button label="published_count"
              >发布数</el-radio-button
            ></el-radio-group
          >
        </div>
        <div class="trend-total">
          <strong>{{ numberText(trendTotal) }}</strong
          ><small>近 {{ days }} 天作品累计</small
          ><select v-model="days" aria-label="趋势时间范围" @change="loadTrend">
            <option :value="7">近 7 天</option>
            <option :value="15">近 15 天</option>
            <option :value="30">近 30 天</option>
          </select>
        </div>
        <TrendChart
          v-if="hasTrend"
          :data="trend"
          :metric="metric"
          :height="188"
        />
        <div v-else class="empty" style="min-height: 188px">
          所选日期内暂无已发布作品
        </div>
      </section>
      <section class="panel panel-pad">
        <h2>质量评分分布</h2>
        <p class="subtext">共 {{ qualityTotal }} 条已评分视频</p>
        <div class="quality-ring" :style="{ background: ringBackground }">
          <div>
            <strong>{{
              qualityTotal ? overview?.avg_quality_score : "—"
            }}</strong
            ><small>平均分</small>
          </div>
        </div>
        <div class="quality-legend">
          <div v-for="(item, i) in bins" :key="item.label">
            <i :style="{ background: colors[i] }"></i
            ><span>{{ item.label }}</span
            ><strong>{{
              qualityTotal
                ? Math.round((item.count / qualityTotal) * 100) + "%"
                : "—"
            }}</strong>
          </div>
        </div>
      </section>
    </div>
    <section class="panel">
      <div class="panel-pad panel-heading" style="margin-bottom: 0">
        <div>
          <h2>作品表现</h2>
          <p>
            {{
              overview?.last_synced_at
                ? "上次同步：" + dateText(overview.last_synced_at)
                : "已发布视频数据排行"
            }}
          </p>
        </div>
        <button class="btn" :disabled="syncing" @click="sync">
          <el-icon :class="{ 'is-loading': syncing }"><Refresh /></el-icon
          >{{ syncing ? "正在同步…" : "同步抖音数据" }}
        </button>
      </div>
      <div class="table-wrap">
        <table v-if="videos.length" class="studio-table">
          <thead>
            <tr>
              <th>作品</th>
              <th>
                <button class="sort-button" @click="sort('views')">
                  播放量<el-icon><Sort /></el-icon>
                </button>
              </th>
              <th>
                <button class="sort-button" @click="sort('likes')">
                  点赞<el-icon><Sort /></el-icon>
                </button>
              </th>
              <th>评论</th>
              <th>分享</th>
              <th>互动率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in videos" :key="item.id">
              <td>
                <div class="table-title">
                  <span class="table-thumb">{{ i + 1 }}</span
                  ><a
                    v-if="item.platform_url"
                    :href="item.platform_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    ><strong>{{ item.title }}</strong></a
                  ><strong v-else>{{ item.title || "未命名作品" }}</strong>
                </div>
              </td>
              <td>
                <strong>{{ numberText(item.views) }}</strong>
              </td>
              <td>
                <strong>{{ numberText(item.likes) }}</strong>
              </td>
              <td>{{ numberText(item.comments) }}</td>
              <td>{{ numberText(item.shares) }}</td>
              <td>{{ engagement(item) }}%</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty compact">暂无成功发布的作品</div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { analyticsApi, publishApi } from "@/api";
import TrendChart from "@/components/business/TrendChart.vue";
import { numberText, dateText } from "@/utils/studio";
const overview = ref<any>(null),
  trend = ref<any[]>([]),
  distribution = ref<any[]>([]),
  videos = ref<any[]>([]),
  loading = ref(false),
  error = ref(false),
  syncing = ref(false),
  metric = ref("views"),
  days = ref(15),
  sortMetric = ref("views");
const metrics = computed(() => [
  {
    label: "总播放量",
    value: numberText(overview.value?.total_views),
    note: "已发布作品累计",
  },
  {
    label: "总点赞",
    value: numberText(overview.value?.total_likes),
    note: "已发布作品累计",
  },
  {
    label: "总评论",
    value: numberText(overview.value?.total_comments),
    note: "已发布作品累计",
  },
  {
    label: "总分享",
    value: numberText(overview.value?.total_shares),
    note: "已发布作品累计",
  },
  {
    label: "互动率",
    value: overview.value ? overview.value.engagement_rate + "%" : "—",
    note: "点赞、评论与分享 / 播放量",
  },
  {
    label: "已发布作品",
    value: numberText(overview.value?.total_published),
    note: "成功发布的作品",
  },
]);
const trendTotal = computed(() =>
    trend.value.reduce((n, t) => n + Number(t[metric.value] || 0), 0),
  ),
  hasTrend = computed(() => trend.value.some((t) => t.published_count > 0));
const bins = computed(() => [
  {
    label: "优秀 90–100",
    count: distribution.value
      .filter((b) => b.range === "90-100")
      .reduce((n, b) => n + b.count, 0),
  },
  {
    label: "良好 80–89",
    count: distribution.value
      .filter((b) => b.range === "80-90")
      .reduce((n, b) => n + b.count, 0),
  },
  {
    label: "待优化 < 80",
    count: distribution.value
      .filter((b) => !["90-100", "80-90"].includes(b.range))
      .reduce((n, b) => n + b.count, 0),
  },
]);
const qualityTotal = computed(() =>
    bins.value.reduce((n, b) => n + b.count, 0),
  ),
  colors = ["#229f97", "#71c8c2", "#d3eae8"];
const ringBackground = computed(() => {
  if (!qualityTotal.value) return "#e8f0f0";
  let offset = 0;
  return `conic-gradient(${bins.value
    .map((b, i) => {
      const start = offset;
      offset += (b.count / qualityTotal.value) * 100;
      return `${colors[i]} ${start}% ${offset}%`;
    })
    .join(",")})`;
});
const engagement = (v: any) =>
  v.views > 0
    ? (
        (((v.likes || 0) + (v.comments || 0) + (v.shares || 0)) / v.views) *
        100
      ).toFixed(2)
    : "0.00";
async function loadTrend() {
  try {
    const r = await analyticsApi.getTrend(days.value);
    trend.value = r.data.trend;
  } catch {
    error.value = true;
  }
}
async function loadVideos() {
  const r = await analyticsApi.getTopVideos(sortMetric.value, 50);
  videos.value = r.data.videos;
}
async function sort(key: string) {
  sortMetric.value = key;
  try {
    await loadVideos();
  } catch {}
}
async function load() {
  loading.value = true;
  error.value = false;
  try {
    const [o, q] = await Promise.all([
      analyticsApi.getOverview(),
      analyticsApi.getQualityDistribution(),
      loadTrend(),
      loadVideos(),
    ]);
    overview.value = o.data;
    distribution.value = q.data.distribution;
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
async function sync() {
  syncing.value = true;
  try {
    const r = await publishApi.syncAllStats();
    ElMessage.success(r.message || "同步完成");
    await load();
  } catch {
  } finally {
    syncing.value = false;
  }
}
onMounted(load);
</script>
<style scoped>
.analytics-kpis {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 11px;
}
.analytics-kpis > .panel {
  padding: 17px;
  min-height: 121px;
  display: flex;
  flex-direction: column;
}
.analytics-kpis small {
  font-size: 10px;
  color: #8b9caa;
}
.analytics-kpis strong {
  font-size: 22px;
  margin-top: 9px;
}
.analytics-kpis span {
  font-size: 9px;
  color: #8ca0ab;
  margin-top: auto;
  padding-top: 15px;
  line-height: 1.6;
}
.analytics-charts {
  display: grid;
  grid-template-columns: minmax(0, 2.25fr) minmax(260px, 1fr);
  gap: 16px;
}
.trend-total {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
}
.trend-total strong {
  font-size: 25px;
}
.trend-total small {
  font-size: 10px;
  color: #91a2ae;
}
.trend-total select {
  margin-left: auto;
  border: 1px solid #dce5e9;
  border-radius: 5px;
  padding: 5px;
  color: #8297a3;
  font-size: 10px;
}
.quality-ring {
  width: 141px;
  height: 141px;
  padding: 24px;
  border-radius: 50%;
  margin: 19px auto 12px;
}
.quality-ring > div {
  background: #fff;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.quality-ring strong {
  font-size: 24px;
}
.quality-ring small {
  font-size: 9px;
  color: #96a4ae;
  margin-top: 5px;
}
.quality-legend > div {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  margin-top: 9px;
}
.quality-legend i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}
.quality-legend strong {
  margin-left: auto;
  font-size: 10px;
  font-weight: 500;
}
.sort-button {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 0;
  color: #8b9daa;
  font-size: 11px;
}
@media (max-width: 1200px) {
  .analytics-kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .analytics-charts {
    grid-template-columns: minmax(0, 1fr) 260px;
  }
  .analytics-charts .panel-heading {
    flex-wrap: wrap;
  }
}
@media (max-width: 1000px) {
  .analytics-charts {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 700px) {
  .analytics-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-kpis > .panel {
    padding: 14px;
  }
  .trend-total {
    flex-wrap: wrap;
  }
  .trend-total select {
    margin-left: 0;
  }
  .analytics-page .panel-heading > .btn {
    font-size: 11px;
    padding: 8px;
  }
}
</style>
