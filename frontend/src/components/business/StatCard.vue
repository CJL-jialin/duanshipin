<template>
  <div class="stat-card" :class="{ hoverable }">
    <div class="stat-card-icon">
      <el-icon v-if="isIconComponent" :size="28"><component :is="icon" /></el-icon>
      <template v-else>{{ icon }}</template>
    </div>
    <div class="stat-card-label">{{ label }}</div>
    <div class="stat-card-value">{{ formattedValue }}</div>
    <div v-if="trend !== undefined" :class="['stat-card-trend', trendClass]">
      <span class="trend-icon">{{ trendIcon }}</span>
      <span class="trend-value">{{ trendText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  /** 兼容两种：SVG 图标组件（element-plus icons）或纯文本符号 */
  icon: string | Component
  label: string
  value: number | string
  trend?: number
  suffix?: string
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: true,
  suffix: ''
})

const isIconComponent = computed(() => typeof props.icon !== 'string')

// 格式化数值
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    // 如果是数字，格式化千分位
    const formatted = props.value.toLocaleString('zh-CN')
    return props.suffix ? `${formatted}${props.suffix}` : formatted
  }
  return props.value
})

// 趋势样式类
const trendClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'up' : 'down'
})

// 趋势图标
const trendIcon = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? '↑' : '↓'
})

// 趋势文本
const trendText = computed(() => {
  if (props.trend === undefined) return ''
  const absValue = Math.abs(props.trend)
  return `${absValue}%`
})
</script>

<style scoped>
.stat-card {
  background: var(--light-50);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: all var(--duration-base) var(--ease-out);
  border: 1px solid transparent;
  min-width: 200px;
}

.stat-card.hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  border-color: var(--primary-200);
}

.stat-card-icon {
  display: flex;
  align-items: center;
  font-size: 28px;
  margin-bottom: var(--space-3);
  line-height: 1;
}

.stat-card-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-medium);
}

.stat-card-value {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-number);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  line-height: 1;
}

.stat-card-trend {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.stat-card-trend.up {
  color: var(--success);
  background: var(--success-light);
}

.stat-card-trend.down {
  color: var(--error);
  background: var(--error-light);
}

.trend-icon {
  font-size: var(--font-size-base);
  line-height: 1;
}

.trend-value {
  font-family: var(--font-family-number);
}

/* 响应式 */
@media (max-width: 768px) {
  .stat-card {
    padding: var(--space-4);
    min-width: auto;
  }

  .stat-card-value {
    font-size: var(--font-size-2xl);
  }
}
</style>
