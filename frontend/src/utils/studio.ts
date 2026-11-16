import { useProductionStore } from "@/stores/production";
export const numberText = (value: unknown) => {
  if (value == null) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n >= 100000000
    ? `${(n / 100000000).toFixed(1)}亿`
    : n >= 10000
      ? `${(n / 10000).toFixed(1)}万`
      : n.toLocaleString("zh-CN");
};
export const dateText = (value?: string) =>
  value
    ? new Date(
        value.endsWith("Z") || /[+-]\d\d:\d\d$/.test(value)
          ? value
          : value + "Z",
      ).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";
export const titleOf = (item: any) =>
  item?.storyboard?.title ||
  item?.title ||
  item?.script_text?.split("\n").find((line: string) => line.trim()) ||
  item?.input_content?.split("\n")[0] ||
  `任务 #${item?.id || ""}`;
export const statusText = (status: string) =>
  (
    ({
      pending: "待生成",
      processing: "生成中",
      partial: "部分就绪",
      ready: "待合成",
      completed: "已完成",
      failed: "失败",
      cancelled: "已取消",
      success: "已发布",
      prepared: "演练完成",
    }) as Record<string, string>
  )[status] || status;
export const statusClass = (status: string) =>
  ["completed", "success", "ready"].includes(status)
    ? "success"
    : status === "failed"
      ? "danger"
      : status === "processing"
        ? "info"
        : "neutral";
export function useScript(record: any) {
  const { flow } = useProductionStore();
  const changed = flow.script_id !== record.id;
  Object.assign(flow, {
    script_id: record.id,
    script: record.script_text || record.script || "",
    script_stats: {
      word_count: record.word_count,
      estimated_duration: record.estimated_duration,
    },
    input_type: record.input_type || flow.input_type,
    input_content: record.input_content || flow.input_content,
    storyboard: record.storyboard,
    video_model: record.storyboard?.video_model || flow.video_model,
    target_duration:
      record.target_duration ||
      record.estimated_duration ||
      flow.target_duration,
  });
  if (changed) flow.characters = [];
  const previous = flow.characters;
  flow.characters = (record.storyboard?.characters || []).map((c: any) => ({
    name: c.name,
    appearance: c.appearance || "",
    role: c.role || "",
    views: c.views || previous.find((p) => p.name === c.name)?.views || {},
  }));
}
export async function downloadFile(url: string, filename = "video.mp4") {
  const response = await fetch(url);
  if (!response.ok) throw new Error("下载失败");
  const address = URL.createObjectURL(await response.blob());
  const a = document.createElement("a");
  a.href = address;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(address), 1000);
}
