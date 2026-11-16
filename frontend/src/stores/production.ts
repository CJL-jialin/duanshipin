import { defineStore } from "pinia";
import { reactive, watch } from "vue";

/**
 * 制作流程上下文（内容定制 → 形象定制 → 视频合成 → 剪辑发布）
 *
 * 为什么要持久化：
 *     这些数据此前只活在各页面的 ref 里 —— 切一次左侧菜单、刷新一次浏览器就全没了，
 *     用户必须从头重新生成。而剧情稿和角色图都是要花时间、花钱的调用，
 *     重复生成既是浪费，也让「一步步往前走」的流程根本走不下去。
 *
 *     这里统一存 localStorage：跨页面、跨刷新、跨会话都不丢。
 *     清空交给 reset()（用户主动「重新开始」时调用）。
 *
 * 2026-10-07：TTS 族字段（voice_type/audio_*）与数字人 avatar_id 随后端死代码
 * 清理一并移除 —— 剧情链对白由万相内嵌、角色参考走 characters，这些字段
 * 在组件层已零引用。
 */

/** 剧情角色（形象定制页消费）：从分镜人物表带过来 + 已生成的定妆照 URL */
export interface CharacterAsset {
  name: string;
  appearance: string;
  role?: string;
  views: { sheet?: string; half?: string; full?: string; side?: string };
}

export interface ProductionFlow {
  // 输入（内容定制页）
  input_type: string;
  input_content: string;
  target_duration: number;
  video_model: string;
  production_options: {
    generation_mode: "direct" | "scenes";
    subtitle_mode: "off" | "sidecar" | "burn";
    subtitle_style: "classic" | "cinema" | "gold" | "boxed";
    subtitle_formats: Array<"srt" | "vtt" | "ass">;
    show_ai_label: boolean;
  };

  // 剧情稿
  script: string;
  script_stats: Record<string, any> | null;
  // 当前剧情稿在数据库中的 id（生成成功或历史「使用」时写入）。
  // 视频合成页创建渲染任务时引用它，后端据此取分镜。
  script_id: number | null;
  // 分镜剧本（内容定制页产出，形象定制页读 characters、视频合成页读 scenes）
  storyboard: Record<string, any> | null;

  // 剧情角色定妆照（形象定制页写入，视频合成页取首帧参考）
  characters: CharacterAsset[];
}

const storageKey = () => {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return 'video_studio_demo_flow_v1';
  try {
    const token =
      localStorage.getItem("video_studio_cpu_token") ||
      sessionStorage.getItem("video_studio_cpu_token");
    if (!token) return "production_flow_cpu_v3_guest";
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const subject = JSON.parse(atob(payload)).sub;
    return `production_flow_cpu_v3_user_${subject}`;
  } catch {
    return "production_flow_cpu_v3_guest";
  }
};

const defaults = (): ProductionFlow => ({
  input_type: "keyword",
  input_content: "",
  target_duration: 30,
  video_model: "",
  production_options: {
    generation_mode: "direct",
    subtitle_mode: "off",
    subtitle_style: "classic",
    subtitle_formats: ["srt", "vtt", "ass"],
    show_ai_label: false,
  },
  script: "",
  script_stats: null,
  script_id: null,
  storyboard: null,
  characters: [],
});

const load = (): ProductionFlow => {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return defaults();
    // 与默认值合并：以后新增字段时，旧缓存不会因为缺 key 而变成 undefined；
    // 旧缓存里残留的已删字段（voice_type 等）会因合并不进默认结构而自然脱落
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
};

export const useProductionStore = defineStore("production", () => {
  let ownerKey = storageKey();
  const flow = reactive<ProductionFlow>(load());

  watch(
    flow,
    (value) => {
      try {
        localStorage.setItem(ownerKey, JSON.stringify(value));
      } catch {
        // 隐私模式 / 配额满：静默降级为「仅当前会话有效」，不影响功能本身
      }
    },
    { deep: true },
  );

  /** 清空整条流程（重新开始一个视频） */
  const reset = () => Object.assign(flow, defaults());

  const switchAccount = () => {
    ownerKey = storageKey();
    Object.assign(flow, load());
  };

  return { flow, reset, switchAccount };
});
