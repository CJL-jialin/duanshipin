<template>
  <div
    ref="element"
    class="trend-canvas"
    :style="{ height: height + 'px' }"
    role="img"
    :aria-label="label"
  ></div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import * as echarts from "echarts";
const props = withDefaults(
  defineProps<{
    data: any[];
    metric?: string;
    height?: number;
    compact?: boolean;
    label?: string;
  }>(),
  { metric: "views", height: 220, compact: false, label: "内容数据趋势" },
);
const element = ref<HTMLElement>();
let chart: echarts.ECharts | undefined;
let observer: ResizeObserver;
function render() {
  if (!element.value) return;
  chart ||= echarts.init(element.value);
  chart.setOption(
    {
      animation: false,
      tooltip: { trigger: "axis", confine: true },
      grid: {
        left: props.compact ? 0 : 8,
        right: 0,
        top: 10,
        bottom: props.compact ? 0 : 25,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: props.data.map((d) => d.date.slice(5).replace("-", "/")),
        axisLine: { lineStyle: { color: "#dfe7ea" } },
        axisTick: { show: false },
        axisLabel: { show: !props.compact, color: "#9ba9b4", fontSize: 9 },
      },
      yAxis: { type: "value", show: false, min: 0 },
      series: [
        {
          type: "bar",
          barMaxWidth: props.compact ? 52 : 30,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#22b3a9" },
              { offset: 1, color: "#c6ece8" },
            ]),
          },
          data: props.data.map((d) => Number(d[props.metric]) || 0),
        },
      ],
    },
    true,
  );
}
watch(
  () => [props.data, props.metric],
  () => nextTick(render),
  { deep: true },
);
onMounted(() => {
  render();
  observer = new ResizeObserver(() => chart?.resize());
  if (element.value) observer.observe(element.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  chart?.dispose();
});
</script>
