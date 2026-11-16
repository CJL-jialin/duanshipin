<template>
  <div
    class="studio"
    :class="{ 'nav-collapsed': collapsed, 'nav-open': mobileOpen }"
  >
    <Sidebar
      :collapsed="collapsed"
      @collapse="collapsed = !collapsed"
      @navigate="mobileOpen = false"
    />
    <div v-if="mobileOpen" class="nav-shade" @click="mobileOpen = false"></div>
    <main class="studio-main">
      <header class="studio-header">
        <button
          class="icon-button mobile-menu"
          title="展开导航"
          @click="mobileOpen = !mobileOpen"
        >
          <el-icon><Menu /></el-icon>
        </button>
        <div class="page-title">
          <h1>{{ page.title }}</h1>
          <p>{{ page.description }}</p>
        </div>
        <div class="header-actions">
          <div class="global-search" ref="searchBox">
            <el-icon><Search /></el-icon
            ><input
              v-model="search"
              aria-label="搜索项目或视频"
              placeholder="搜索项目或视频"
              @focus="searchOpen = true"
              @keydown.esc="searchOpen = false"
            /><kbd>⌘ K</kbd>
            <div
              v-if="searchOpen && search.trim()"
              class="search-results"
              v-loading="searching"
            >
              <button
                v-for="item in searchResults"
                :key="item.kind + item.id"
                @click="openResult(item)"
              >
                <el-icon
                  ><Document v-if="item.kind === 'script'" /><VideoCamera
                    v-else /></el-icon
                ><span>{{ item.title }}</span
                ><small>{{ item.kind === "script" ? "剧本" : "视频" }}</small>
              </button>
              <div
                v-if="!searching && !searchResults.length"
                class="empty compact"
              >
                没有找到相关内容
              </div>
            </div>
          </div>
          <el-popover placement="bottom-end" :width="300" trigger="click">
            <template #reference
              ><button
                class="icon-button notification"
                title="任务通知"
                @click="loadNotifications"
              >
                <el-icon><Bell /></el-icon
                ><i v-if="activeTasks.length"></i></button
            ></template>
            <h3>任务通知</h3>
            <div v-if="!activeTasks.length" class="empty compact">
              暂无进行中的任务
            </div>
            <button
              v-for="task in activeTasks"
              :key="task.id"
              class="notice-row"
              @click="router.push('/video?task_id=' + task.id)"
            >
              <span>{{ titleOf(task) }}</span
              ><small
                >{{ statusText(task.status) }} ·
                {{ task.progress_percent || 0 }}%</small
              >
            </button>
          </el-popover>
          <button class="btn primary" @click="newCreation">
            <el-icon><Plus /></el-icon><span>新建创作</span>
          </button>
        </div>
      </header>
      <div class="studio-content"><router-view :key="route.path" /></div>
    </main>
    <el-popover placement="top-end" :width="260" trigger="click"
      ><template #reference
        ><button class="help-button" title="帮助与服务状态">
          <el-icon><QuestionFilled /></el-icon></button
      ></template>
      <h3>帧界 AI</h3>
      <p class="muted">
        {{
          health?.demo ? "静态演示 · 未连接后端" : health?.status === "healthy" ? "本地服务运行正常" : "正在检查本地服务"
        }}
      </p>
      <p class="muted">
        文字生成：{{ health?.configured?.script ? "已配置" : "未配置"
        }}<br />图像生成：{{ health?.configured?.image ? "已配置" : "未配置"
        }}<br />视频生成：{{ health?.configured?.video ? "已配置" : "未配置" }}
      </p></el-popover
    >
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { onClickOutside } from "@vueuse/core";
import { ElMessageBox } from "element-plus";
import Sidebar from "@/components/layout/Sidebar.vue";
import { scriptApi, videoApi } from "@/api";
import request from "@/utils/request";
import { useProductionStore } from "@/stores/production";
import { statusText, titleOf } from "@/utils/studio";
const route = useRoute(),
  router = useRouter(),
  production = useProductionStore();
const collapsed = ref(false),
  mobileOpen = ref(false),
  search = ref(""),
  searchOpen = ref(false),
  searching = ref(false),
  searchBox = ref<HTMLElement>();
const searchResults = ref<any[]>([]),
  activeTasks = ref<any[]>([]),
  health = ref<any>(null);
const pages: Record<string, any> = {
  "/dashboard": {
    title: "工作台",
    description: "今天也来创作令人眼前一亮的内容吧",
  },
  "/script": {
    title: "内容定制",
    description: "将你的灵感转化为剧情稿和专业分镜",
  },
  "/review": {
    title: "AI 审核",
    description: "全面检查内容质量、平台规则与潜在风险",
  },
  "/avatar": {
    title: "形象定制",
    description: "为故事角色创建一致、可复用的视觉形象",
  },
  "/asr": {
    title: "本地语音识别",
    description: "安全、快速地将本地音视频转换为文字",
  },
  "/video": {
    title: "视频合成",
    description: "配置生成参数，逐镜制作并合成最终成片",
  },
  "/publish": {
    title: "剪辑发布",
    description: "完善片尾与发布文案，一键发布至抖音",
  },
  "/analytics": {
    title: "数值监控",
    description: "追踪内容表现，持续优化创作策略",
  },
};
const page = computed(() => pages[route.path] || pages["/dashboard"]);
let searchTimer: ReturnType<typeof setTimeout> | undefined,
  searchSequence = 0;
watch(search, () => {
  clearTimeout(searchTimer);
  const sequence = ++searchSequence;
  if (!search.value.trim()) {
    searchResults.value = [];
    searching.value = false;
    return;
  }
  searching.value = true;
  searchTimer = setTimeout(async () => {
    try {
      const [scripts, videos] = await Promise.all([
        scriptApi.getScripts(1, 8, search.value.trim()),
        videoApi.getTasks(1, 8, undefined, search.value.trim()),
      ]);
      if (sequence === searchSequence)
        searchResults.value = [
          ...scripts.data.scripts.map((s: any) => ({
            id: s.id,
            kind: "script",
            title: titleOf(s),
          })),
          ...videos.data.tasks.map((t: any) => ({
            id: t.id,
            kind: "video",
            title: titleOf(t),
          })),
        ];
    } catch {
    } finally {
      if (sequence === searchSequence) searching.value = false;
    }
  }, 300);
});
onClickOutside(searchBox, () => {
  searchOpen.value = false;
});
function openResult(item: any) {
  searchOpen.value = false;
  search.value = "";
  router.push(
    item.kind === "script"
      ? "/script?script_id=" + item.id
      : "/video?task_id=" + item.id,
  );
}
async function loadNotifications() {
  try {
    const res = await videoApi.getTasks(1, 20, "processing");
    activeTasks.value = res.data.tasks;
  } catch {}
}
async function newCreation() {
  if (production.flow.input_content || production.flow.script_id) {
    try {
      await ElMessageBox.confirm(
        "开始新的创作？已保存的作品可在历史记录中找到，未生成的输入会清空。",
        "新建创作",
        { confirmButtonText: "新建", cancelButtonText: "取消" },
      );
    } catch {
      return;
    }
  }
  production.reset();
  router.push("/script?new=" + Date.now());
}
function keyboard(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchBox.value?.querySelector("input")?.focus();
  }
}
onMounted(async () => {
  document.addEventListener("keydown", keyboard);
  loadNotifications();
  try {
    health.value = await request.get("/health");
  } catch {}
});
onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  document.removeEventListener("keydown", keyboard);
});
</script>
