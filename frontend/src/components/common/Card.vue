<template>
  <div :class="cardClasses">
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </slot>
    </div>

    <!-- 卡片主体 -->
    <div class="card-body">
      <slot></slot>
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  hoverable?: boolean
  bordered?: boolean
  shadow?: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: false,
  bordered: false,
  shadow: 'sm'
})

const cardClasses = computed(() => {
  return [
    'card',
    {
      'card-hoverable': props.hoverable,
      'card-bordered': props.bordered,
      [`shadow-${props.shadow}`]: props.shadow !== 'none'
    }
  ]
})
</script>

<style scoped>
.card {
  background: var(--light-50);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-out);
}

.card-hoverable:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-bordered {
  border: 1px solid var(--light-300);
}

/* 卡片头部 */
.card-header {
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--light-300);
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--line-height-tight);
}

.card-subtitle {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

/* 卡片主体 */
.card-body {
  padding: var(--space-6);
}

/* 卡片底部 */
.card-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--light-300);
  background: var(--light-100);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* 响应式 */
@media (max-width: 768px) {
  .card-header,
  .card-body {
    padding: var(--space-4);
  }

  .card-footer {
    padding: var(--space-3) var(--space-4);
    flex-direction: column;
  }
}
</style>
