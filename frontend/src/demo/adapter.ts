import { AxiosError, CanceledError, type AxiosAdapter } from "axios";

const storageKey = "video_studio_demo_state_v1";
const imageUrl = `${import.meta.env.BASE_URL}demo/character.svg`;
const videoUrl = `${import.meta.env.BASE_URL}demo/preview.webm`;
const now = () => new Date().toISOString();
const model = {
  model: "demo-story-video",
  resolution: "720P",
  ratio: "9:16",
  fixed_scene_duration: null,
  max_reference_images: 3,
  available: true,
  billing_label: "纯前端模拟，不产生费用",
  availability_message: "演示模型 · 不调用云端服务",
};
const productionOptions = {
  generation_mode: "scenes",
  subtitle_mode: "off",
  subtitle_style: "classic",
  subtitle_formats: ["srt", "vtt", "ass"],
  show_ai_label: true,
};

function makeScript(id: number, input: any = {}) {
  const topic = String(input.input_content || "下班后，遇见城市里的微光")
    .trim()
    .slice(0, 80);
  const duration = Number(input.target_duration) || 30;
  const narrations = [
    `关于「${topic}」，故事从一个平凡的傍晚开始。`,
    "主角停下匆忙的脚步，在街角发现了一家还亮着灯的小店。",
    "原来，生活里的惊喜，就藏在愿意停留的那一刻。",
  ];
  const scenes = narrations.map((narration, index) => ({
    index: index + 1,
    scene: ["城市街头 · 傍晚", "街角小店 · 暖光", "窗边 · 夜色"][index],
    visual_prompt: [
      "城市晚霞，青年走在街头，电影感构图，暖色调。",
      "街角咖啡店，柔和灯光，人物推门进入，中景。",
      "人物坐在窗边微笑，城市灯光倒映，镜头缓缓拉远。",
    ][index],
    narration,
    duration: duration / 3,
  }));
  const script = narrations.join("\n\n");
  return {
    id,
    input_type: input.input_type || "keyword",
    input_content: topic,
    script,
    script_text: script,
    word_count: script.length,
    target_duration: duration,
    estimated_duration: duration,
    created_at: now(),
    storyboard: {
      title: topic,
      style: "温暖治愈 · 电影质感（演示）",
      video_model: model.model,
      characters: [
        {
          name: "小林",
          appearance: "短发，米色外套，帆布包，温暖自然的青年形象",
          role: "主角",
          views: { sheet: imageUrl },
        },
      ],
      scenes,
    },
    review: {
      reviewed: true,
      pass: true,
      score: 4.6,
      scores: {
        hook: 4.5,
        story: 4.7,
        immersion: 4.6,
        structure: 4.5,
        interaction: 4.7,
      },
      issues: [],
      suggestions: ["演示建议：开场增加悬念。", "演示建议：结尾加入互动提问。"],
      summary: "示例评审：叙事完整，节奏清晰。",
      compliance: { pass: true, violations: [] },
    },
  };
}

function makeTask(id: number, script: any, input: any = {}, completed = false) {
  const task: any = {
    id,
    script_id: script.id,
    input_type: script.input_type,
    input_content: script.input_content,
    title: script.storyboard.title,
    script_text: script.script_text,
    script_duration: script.target_duration,
    video_model: input.video_model || model.model,
    video_config: model,
    production_options: input.production_options || { ...productionOptions },
    scenes: structuredClone(script.storyboard.scenes),
    scene_clips: [],
    status: "pending",
    progress_percent: 0,
    current_step: "等待模拟生成",
    current_step_key: "pending",
    step_index: 1,
    steps: ["剧本准备", "角色设定", "分镜生成", "视频合成", "成片交付"].map(
      (name, index) => ({ key: String(index), name, status: "pending" }),
    ),
    final_video_url: "",
    cover_image_url: imageUrl,
    created_at: now(),
    delivery: {
      direct_export: true,
      subtitle_info: { status: "off", files: [] },
    },
    outro: { enabled: false, text: "感谢观看 · 演示素材", duration: 3 },
  };
  if (completed) complete(task);
  return task;
}

function complete(task: any) {
  Object.assign(task, {
    status: "completed",
    progress_percent: 100,
    current_step: "模拟合成完成（示例视频，非实际生成）",
    current_step_key: "completed",
    step_index: 5,
    final_video_url: videoUrl,
    completed_at: now(),
    quality_score: 92,
  });
  task.scene_clips = task.scenes.map((scene: any) => ({
    index: scene.index,
    video_url: videoUrl,
    duration: scene.duration,
    resolution: "720P",
  }));
  task.steps.forEach((step: any) => {
    step.status = "completed";
  });
}

function seed() {
  const scripts = [
    makeScript(3, { input_content: "一杯咖啡，连接两座城市" }),
    makeScript(2, { input_content: "把平凡的日子过成电影" }),
    makeScript(1),
  ];
  return {
    scripts,
    tasks: [
      makeTask(2, scripts[0], {}, true),
      makeTask(1, scripts[1], {}, true),
    ],
    avatars: [
      {
        id: 1,
        name: "小林 · 示例角色",
        generation_method: "demo",
        result_image_url: imageUrl,
        created_at: now(),
      },
    ],
    records: [
      {
        id: 1,
        video_task_id: 1,
        platform: "douyin",
        title: "把平凡的日子过成电影",
        status: "prepared",
        views: 12860,
        likes: 968,
        comments: 86,
        shares: 42,
        completion_rate: 78.4,
        created_at: now(),
      },
    ],
    user: {
      id: 1,
      username: "demo",
      full_name: "演示访客",
      email: "demo@example.com",
      created_at: now(),
    },
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (
      saved &&
      ["scripts", "tasks", "avatars", "records"].every((key) =>
        Array.isArray(saved[key]),
      ) &&
      saved.user
    )
      return saved;
  } catch {}
  return seed();
}

let state: any = null;
const nextId = (items: any[]) =>
  Math.max(0, ...items.map((item) => item.id)) + 1;
function find(items: any[], id: number) {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error("演示记录不存在，请刷新或重置演示");
  return item;
}
function paginate(items: any[], key: string, params: any) {
  const filtered = items.filter(
    (item) =>
      (!params.status || item.status === params.status) &&
      (!params.search || JSON.stringify(item).includes(params.search)),
  );
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.max(1, Number(params.page_size) || 20);
  return {
    [key]: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    page_size: pageSize,
  };
}

async function dispatch(url: string, method: string, data: any, params: any) {
  const parts = url.split("/").filter(Boolean);
  if (url === "/auth/login")
    return { access_token: "demo-visitor", token_type: "bearer" };
  if (url === "/auth/register")
    return { username: data.username, message: "演示注册成功，不创建真实账号" };
  if (url === "/user/me") return state.user;
  if (url === "/user/profile") return Object.assign(state.user, data);
  if (url === "/health")
    return {
      status: "healthy",
      configured: { script: false, image: false, video: false },
      demo: true,
    };
  if (url === "/script/options")
    return {
      default: 30,
      video: model,
      video_models: [model],
      options: [15, 30, 60, 90].map((duration) => ({
        duration,
        label: `${duration} 秒`,
        min_words: duration * 2,
        max_words: duration * 4,
      })),
    };
  if (url === "/script/list") return paginate(state.scripts, "scripts", params);
  if (url === "/script/generate") {
    const script = makeScript(nextId(state.scripts), data);
    state.scripts.unshift(script);
    return script;
  }
  if (parts[0] === "script" && /^\d+$/.test(parts[1])) {
    const script = find(state.scripts, Number(parts[1]));
    if (method === "delete") {
      state.scripts = state.scripts.filter(
        (entry: any) => entry.id !== script.id,
      );
      return {};
    }
    if (parts[2] === "regenerate")
      Object.assign(script, makeScript(script.id, { ...script, ...data }));
    if (parts[2] === "storyboard") {
      script.storyboard.scenes = data.scenes.map(
        (scene: any, index: number) => ({
          ...scene,
          duration: script.storyboard.scenes[index]?.duration || 10,
        }),
      );
      script.script = script.script_text = data.scenes
        .map((scene: any) => scene.narration)
        .join("\n\n");
      script.word_count = script.script_text.length;
    }
    if (parts[2] === "characters")
      script.storyboard.characters = data.characters;
    return script;
  }
  if (url === "/avatar/list") return paginate(state.avatars, "avatars", params);
  if (parts[0] === "avatar" && method === "delete") {
    state.avatars = state.avatars.filter(
      (entry: any) => entry.id !== Number(parts[1]),
    );
    return {};
  }
  if (parts[0] === "avatar" && method === "post") {
    const avatar = {
      id: nextId(state.avatars),
      name:
        data instanceof FormData
          ? data.get("name") || "演示形象"
          : data.name || "演示形象",
      result_image_url: imageUrl,
      image_url: imageUrl,
      generation_method: "demo",
      created_at: now(),
    };
    state.avatars.unshift(avatar);
    return avatar;
  }
  if (url === "/video/models") return { default: model.model, models: [model] };
  if (url === "/video/tasks") return paginate(state.tasks, "tasks", params);
  if (url === "/video/create") {
    const task = makeTask(
      nextId(state.tasks),
      find(state.scripts, data.script_id),
      data,
    );
    state.tasks.unshift(task);
    if (data.auto_start) complete(task);
    return { task_id: task.id, ...task };
  }
  if (parts[0] === "video") {
    const id = Number(/^\d+$/.test(parts[1]) ? parts[1] : parts[2]);
    const task = find(state.tasks, id);
    if (method === "delete") {
      if (parts[1] === "task")
        Object.assign(task, {
          status: "cancelled",
          current_step: "已取消模拟任务",
        });
      else state.tasks = state.tasks.filter((entry: any) => entry.id !== id);
      return task;
    }
    if (parts[2] === "options") task.production_options = data;
    if (parts[2] === "model") task.video_model = data.video_model;
    if (parts[2] === "outro") {
      if (method === "post") task.outro = data;
      return {
        options: task.outro,
        busy: false,
        status: task.status,
        video_url: task.final_video_url,
        duration: task.script_duration,
      };
    }
    if (parts[2] === "start" || parts[2] === "compose") complete(task);
    if (parts[2] === "scenes") {
      const scene = task.scenes.find(
        (entry: any) => entry.index === Number(parts[3]),
      );
      if (!scene) throw new Error("演示分镜不存在");
      task.scene_clips = task.scene_clips.filter(
        (entry: any) => entry.index !== scene.index,
      );
      task.scene_clips.push({
        index: scene.index,
        video_url: videoUrl,
        duration: scene.duration,
        resolution: "720P",
      });
      task.status =
        task.scene_clips.length === task.scenes.length ? "ready" : "partial";
      task.progress_percent = Math.round(
        (task.scene_clips.length / task.scenes.length) * 90,
      );
      task.current_step = "模拟分镜已就绪";
      if (parts[4] === "rerender") complete(task);
    }
    return task;
  }
  if (url === "/publish/config") return { auto_submit: false, demo: true };
  if (url === "/publish/douyin/status")
    return { logged_in: true, message: "演示状态，不访问真实抖音账号" };
  if (url.startsWith("/publish/douyin/login"))
    return { status: "success", logged_in: true };
  if (url === "/publish/records")
    return paginate(state.records, "records", params);
  if (parts[0] === "publish" && parts[1] === "record")
    return find(state.records, Number(parts[2]));
  if (parts[0] === "publish" && parts[1] === "materials") {
    const task = find(state.tasks, Number(parts[2]));
    if (parts[3] === "cover") {
      const file = data instanceof FormData ? data.get("image") : null;
      if (!(file instanceof File) || !file.type.startsWith("image/"))
        throw new Error("请选择图片文件");
      if (file.size > 2 * 1024 * 1024)
        throw new Error("演示封面请使用 2MB 以内的图片");
      task.cover_image_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("图片读取失败"));
        reader.readAsDataURL(file);
      });
    }
    return {
      video_task_id: task.id,
      title: task.title,
      description: "纯前端交互演示，视频为示例素材。",
      hashtags: ["短视频创作", "灵感故事", "演示"],
      cover_url: task.cover_image_url,
      video_url: task.final_video_url,
      last_publish:
        state.records.find((entry: any) => entry.video_task_id === task.id) ||
        null,
    };
  }
  if (url === "/publish/publish") {
    const task = find(state.tasks, data.video_task_id);
    const record = {
      id: nextId(state.records),
      video_task_id: task.id,
      platform: "douyin",
      title: data.custom_title || task.title,
      description: data.custom_description,
      hashtags: data.custom_hashtags,
      status: "prepared",
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      created_at: now(),
    };
    state.records.unshift(record);
    return { record_id: record.id, status: "prepared" };
  }
  if (url === "/publish/republish") {
    const record = find(state.records, data.record_id);
    record.status = "prepared";
    return record;
  }
  if (url.startsWith("/publish/sync-stats"))
    return { synced: state.records.length, demo: true };
  if (url === "/analytics/overview")
    return {
      total_videos: state.tasks.length,
      total_published: state.records.length,
      total_views: 12860,
      total_likes: 968,
      total_comments: 86,
      total_shares: 42,
      avg_completion_rate: 78.4,
      avg_quality_score: 92,
      engagement_rate: 8.5,
      last_synced_at: null,
    };
  if (url === "/analytics/trend")
    return {
      trend: Array.from(
        { length: Math.min(90, Math.max(1, Number(params.days) || 7)) },
        (_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (Number(params.days) || 7) + index + 1);
          return {
            date: date.toISOString().slice(0, 10),
            published_count: (index % 3) + 1,
            views: 900 + index * 137 + (index % 4) * 230,
            likes: 80 + index * 17,
            avg_completion_rate: 74 + (index % 9),
          };
        },
      ),
    };
  if (url === "/analytics/top-videos")
    return {
      videos: [...state.records]
        .sort(
          (left: any, right: any) =>
            (right[params.metric] || 0) - (left[params.metric] || 0),
        )
        .slice(0, Number(params.limit) || 10),
    };
  if (url === "/analytics/quality-distribution")
    return {
      distribution: [
        {
          range: "90-100",
          count: state.tasks.filter((task: any) => task.status === "completed")
            .length,
        },
        { range: "80-90", count: 0 },
      ],
    };
  if (url === "/analytics/production-efficiency")
    return {
      demo: true,
      completed: state.tasks.filter((task: any) => task.status === "completed")
        .length,
    };
  if (url === "/asr/status")
    return {
      installed: true,
      loaded: true,
      model: "演示模型（不执行识别）",
      device: "cpu",
      requested_device: "cpu",
      compute_type: "int8",
      max_upload_mb: 100,
      fallback_reason: "纯前端演示：文件不会上传，不执行真实语音识别。",
    };
  if (url === "/asr/transcribe")
    return {
      text: "这是示例结果，并非所选文件的真实转写。你可以编辑文字并导出字幕。",
      duration: 12,
      language: "zh",
      device: "cpu",
      compute_type: "int8",
      segments: [
        { start: 0, end: 6, text: "这是示例结果，并非所选文件的真实转写。" },
        { start: 6, end: 12, text: "你可以编辑文字并导出字幕。" },
      ],
    };
  throw new Error(`尚未支持的演示操作：${method.toUpperCase()} ${url}`);
}

export const demoAdapter: AxiosAdapter = async (config) => {
  if (!state) state = loadState();
  const method = (config.method || "get").toLowerCase();
  await new Promise((resolve) =>
    setTimeout(resolve, method === "get" ? 100 : 650),
  );
  if (config.signal?.aborted) throw new CanceledError("已取消演示操作", config);
  try {
    const data =
      typeof config.data === "string"
        ? JSON.parse(config.data)
        : config.data || {};
    const url = config.url || "";
    const result = await dispatch(url, method, data, config.params || {});
    if (method !== "get" && !url.startsWith("/auth/"))
      localStorage.setItem(storageKey, JSON.stringify(state));
    return {
      data: {
        code: 200,
        message: "演示操作完成（未连接后端）",
        data: JSON.parse(JSON.stringify(result)),
        ...(url === "/health" ? result : {}),
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "演示操作失败";
    throw new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, {
      data: { detail: message },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config,
    });
  }
};
