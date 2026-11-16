<template>
  <aside class="studio-sidebar">
    <div class="brand">
      <div class="brand-mark">
        <el-icon><Cpu /></el-icon>
      </div>
      <div class="brand-copy">
        <strong>帧界 AI</strong><small>FRAME STUDIO</small>
      </div>
      <button
        class="collapse-nav"
        :title="collapsed ? '展开侧栏' : '收起侧栏'"
        @click="$emit('collapse')"
      >
        <el-icon><ArrowRight v-if="collapsed" /><ArrowLeft v-else /></el-icon>
      </button>
    </div>
    <nav class="sidebar-navigation">
      <template v-for="group in groups" :key="group.label"
        ><div class="nav-caption">{{ group.label }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="sidebar-link"
          :title="item.label"
          @click="$emit('navigate')"
          ><el-icon><component :is="item.icon" /></el-icon
          ><span>{{ item.label }}</span
          ><b v-if="item.path === '/video' && pendingCount">{{
            pendingCount
          }}</b></router-link
        ></template
      >
    </nav>
    <footer class="sidebar-footer">
      <div class="sidebar-account">
        <span class="account-avatar">{{ name.charAt(0) }}</span>
        <div>
          <strong>{{ name }}</strong
          ><small>{{
            auth.user?.username === "admin" ? "管理员" : "内容创作者"
          }}</small>
        </div>
        <el-popover trigger="click" placement="top" :width="240"
          ><template #reference
            ><button class="account-more" title="账户信息">
              <el-icon><MoreFilled /></el-icon></button></template
          ><strong>{{ name }}</strong>
          <p class="muted">{{ auth.user?.email }}</p></el-popover
        >
      </div>
      <button class="sidebar-logout" @click="logout">
        <el-icon><SwitchButton /></el-icon><span>退出登录</span>
      </button>
    </footer>
  </aside>
</template>
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Grid,
  Document,
  CircleCheck,
  User,
  Microphone,
  VideoCamera,
  Upload,
  DataAnalysis,
} from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { videoApi } from "@/api";
defineProps<{ collapsed: boolean }>();
defineEmits(["collapse", "navigate"]);
const auth = useAuthStore(),
  router = useRouter(),
  pendingCount = ref(0);
const name = computed(
  () => auth.user?.full_name || auth.user?.username || "用户",
);
const groups = [
  {
    label: "总览",
    items: [{ path: "/dashboard", label: "工作台", icon: Grid }],
  },
  {
    label: "创作中心",
    items: [
      { path: "/script", label: "内容定制", icon: Document },
      { path: "/review", label: "AI 审核", icon: CircleCheck },
      { path: "/avatar", label: "形象定制", icon: User },
      { path: "/asr", label: "本地语音识别", icon: Microphone },
    ],
  },
  {
    label: "制作与发布",
    items: [
      { path: "/video", label: "视频合成", icon: VideoCamera },
      { path: "/publish", label: "剪辑发布", icon: Upload },
    ],
  },
  {
    label: "数据中心",
    items: [{ path: "/analytics", label: "数值监控", icon: DataAnalysis }],
  },
];
async function refresh() {
  try {
    const running = await videoApi.getTasks(1, 1, "processing");
    pendingCount.value = running.data.total;
  } catch {}
}
async function logout() {
  await auth.logout();
  router.push("/login");
}
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  refresh();
  timer = setInterval(refresh, 30000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>
