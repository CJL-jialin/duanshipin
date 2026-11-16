<template>
  <div id="app" :class="{ 'demo-mode': isDemo }">
    <div v-if="isDemo" ref="demoBanner" class="demo-banner" role="status">
      交互演示 ·
      所有生成、识别、发布和统计均为模拟数据，不连接后端、不产生费用。请勿输入真实密码。
      <button type="button" @click="resetDemo">重置演示</button>
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();
const isDemo = import.meta.env.VITE_DEMO_MODE === "true";
const demoBanner = ref<HTMLElement>();
let bannerObserver: ResizeObserver | undefined;

function resetDemo() {
  if (!window.confirm("清空本浏览器的演示数据并恢复示例？")) return;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("video_studio_demo_")) localStorage.removeItem(key);
  }
  window.location.reload();
}

onMounted(() => {
  if (demoBanner.value) {
    bannerObserver = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--demo-banner-height', `${entry.target.getBoundingClientRect().height}px`);
    });
    bannerObserver.observe(demoBanner.value);
  }
  // 初始化时检查token
  authStore.checkAuth();
});
onBeforeUnmount(() => bannerObserver?.disconnect());
</script>

<style>
.demo-mode .studio-sidebar { top: var(--demo-banner-height, 44px); }
.demo-mode .studio { height: calc(100dvh - var(--demo-banner-height, 44px)); }
.demo-banner {
  position: relative;
  z-index: 3000;
  padding: 8px 16px;
  background: #e4f6f3;
  color: #176b65;
  text-align: center;
  font-size: 12px;
  line-height: 1.8;
}
.demo-banner button {
  margin-left: 12px;
  border: 1px solid #8acdc4;
  border-radius: 5px;
  background: white;
  color: inherit;
  cursor: pointer;
  padding: 2px 8px;
}
</style>
