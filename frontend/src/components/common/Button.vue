<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <span v-if="icon && !loading" class="btn-icon">
      <el-icon v-if="isIconComponent" :size="16"><component :is="icon" /></el-icon>
      <template v-else>{{ icon }}</template>
    </span>
    <span v-if="$slots.default" class="btn-label">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

interface Props {
  type?: 'primary' | 'secondary' | 'text' | 'danger'
  size?: 'sm' | 'base' | 'lg'
  disabled?: boolean
  loading?: boolean
  /** 兼容两种：SVG 图标组件（element-plus icons）或纯文本符号 */
  icon?: string | Component
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'base',
  disabled: false,
  loading: false,
  block: false
})

const isIconComponent = computed(() => typeof props.icon !== 'string')

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  return [
    'btn',
    `btn-${props.type}`,
    `btn-${props.size}`,
    {
      'loading': props.loading,
      'btn-block': props.block
    }
  ]
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* 基础按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  white-space: nowrap;
  user-select: none;
  position: relative;
  font-family: var(--font-family-base);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* 主要按钮 */
.btn-primary {
  background: var(--gradient-primary);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: var(--gradient-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* 次要按钮 */
.btn-secondary {
  background: var(--light-50);
  color: var(--text-primary);
  border: 2px solid var(--light-300);
  box-shadow: var(--shadow-xs);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--light-100);
  border-color: var(--light-400);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:active:not(:disabled) {
  background: var(--light-200);
}

/* 文本按钮 */
.btn-text {
  background: transparent;
  color: var(--primary-600);
  padding: var(--space-2) var(--space-3);
  box-shadow: none;
}

.btn-text:hover:not(:disabled) {
  background: var(--primary-50);
  color: var(--primary-700);
}

.btn-text:active:not(:disabled) {
  background: var(--primary-100);
}

/* 危险按钮 */
.btn-danger {
  background: var(--error);
  color: var(--text-inverse);
  box-shadow: var(--shadow-sm);
}

.btn-danger:hover:not(:disabled) {
  background: var(--error-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-danger:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* 尺寸变体 */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-xs);
  gap: var(--space-1);
}

.btn-base {
  padding: var(--space-3) var(--space-5);
  font-size: var(--font-size-sm);
}

.btn-lg {
  padding: var(--space-4) var(--space-6);
  font-size: var(--font-size-base);
}

/* 块级按钮 */
.btn-block {
  width: 100%;
  display: flex;
}

/* 加载状态 */
.btn.loading {
  position: relative;
  pointer-events: none;
}

.btn.loading .btn-text,
.btn.loading .btn-label,
.btn.loading .btn-icon {
  opacity: 0;
}

.btn-spinner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: var(--radius-full);
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 图标 */
.btn-icon {
  font-size: 1.2em;
  line-height: 1;
}

/* 文字内容（注意：.btn-text 是「文本按钮」变体的样式类，别用在文字 span 上） */
.btn-label {
  line-height: 1;
}
</style>
