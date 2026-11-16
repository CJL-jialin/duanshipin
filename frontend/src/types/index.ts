export interface User {
  id: number
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
}

export interface PipelineStep {
  key: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

/**
 * 当前阶段的细粒度进度快照。
 *
 * 分镜渲染期间以完成镜头数汇报阶段进度。
 */
export interface StageDetail {
  queue_state?: 'queued' | 'running'
  last_event?: string
  /** 阶段名，如「分镜渲染」 */
  name?: string
  /** 云端任务状态：queued | running | done ... */
  status?: string
  /** 云端分镜任务号 */
  job_id?: string
  /** 本阶段内部进度 0..100 */
  percent?: number
  /** 已完成分段数 */
  seg_done?: number
  /** 预估总分段数 */
  seg_total_est?: number
  /** 单步耗时（秒/步） */
  s_per_it?: number
  /** 本阶段剩余秒数 */
  eta_sec?: number
  /** 本阶段已耗时（秒） */
  elapsed_sec?: number
  /** 云端推理阶段：loading | inferring | saving */
  stage?: string
}

export interface ProductionOptions {
  generation_mode: 'direct' | 'scenes'
  subtitle_mode: 'off' | 'sidecar' | 'burn'
  subtitle_style: 'classic' | 'cinema' | 'gold' | 'boxed'
  subtitle_formats: Array<'srt' | 'vtt' | 'ass'>
  show_ai_label: boolean
}

export interface VideoTask {
  id: number
  video_model?: string
  production_options?: ProductionOptions
  delivery?: { direct_export?: boolean; subtitle_info?: { status: string; reason?: string; files?: Array<{ format: string; url: string }> } }
  video_config?: { model: string; resolution: string; ratio: string; billing_label: string; fixed_scene_duration?: number | null }
  input_type: string
  input_content: string
  script_text?: string
  status: string
  // 中文文案，直接展示（后端由 core/pipeline_steps 统一生成，前端不再自己拼）
  current_step?: string
  // 稳定 key，用于程序判断；不要拿 current_step 做字符串匹配（曾因此让进度条恒为 0）
  current_step_key?: string
  current_step_failed?: boolean
  // 1..5，直接驱动 el-steps 的 active
  step_index?: number
  // 步骤条数据，由后端下发，前端不再写死
  steps?: PipelineStep[]
  // 时间加权的总进度（0..100）。后端按实测耗时加权，不是按阶段均分
  progress_percent?: number
  // 当前阶段的细粒度进度（目前只有数字人阶段会产生）
  stage_detail?: StageDetail
  error_message?: string | null
  // 剩余秒数。后端拿不到真实 ETA 时为 null —— 前端应隐藏，不要显示假数字
  estimated_time_remaining?: number | null
  script_duration?: number
  final_video_url?: string
  cover_image_url?: string
  quality_score?: number
  // 分镜片段（2026-10-07 渐进预览）：渲染中每镜增量出现，结果页也可单镜重渲
  scene_clips?: SceneClip[]
  // 分镜定义摘要（2026-10-07 逐镜可控）：逐镜「生成此镜」按钮列表的数据源
  scenes?: SceneSummary[]
  created_at: string
  completed_at?: string
}

export interface SceneClip {
  generation_mode?: string
  index: number
  video_path?: string
  video_url: string
  duration: number
  task_id?: string
  resolution?: string
  source_resolution?: string
  ratio_adapted?: boolean
  adaptation_note?: string
  source_video_url?: string
  /** 该镜是否经历过单镜重渲 */
  rerendered?: boolean
}

/** 分镜定义摘要（来自剧情稿 storyboard.scenes，逐镜面板展示用） */
export interface SceneSummary {
  index: number
  visual_prompt: string
  narration?: string
  duration: number
}

export interface AvatarImage {
  id: number
  generation_method: string
  input_prompt?: string
  source_image_url?: string
  result_image_url?: string
  result_video_url?: string
  name?: string
  tags?: string
  created_at: string
}

export interface PublishRecord {
  id: number
  video_task_id: number
  platform: string
  title: string
  description?: string
  hashtags?: string[]
  status: string
  platform_url?: string
  platform_video_id?: string
  video_url?: string
  cover_url?: string
  views?: number
  likes?: number
  comments?: number
  shares?: number
  completion_rate?: number
  created_at: string
  published_at?: string
  error_message?: string
}

// 发布物料：视频做完后、发布前的「标题与话题」包。
// 对齐发布卡片的展示：标题 / 话题标签 / 封面 / 最近一次发布结果。
export interface PublishMaterials {
  video_task_id: number
  title?: string
  description?: string
  hashtags?: string[]
  cover_url?: string
  video_url?: string
  publish_url?: string
  last_publish?: {
    id: number
    status: string
    platform_url?: string
    platform_video_id?: string
    error_message?: string
    published_at?: string
  } | null
}

export interface AnalyticsOverview {
  total_videos: number
  total_published: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  avg_completion_rate: number
  avg_quality_score: number
  engagement_rate: number
  /** 最后一次同步抖音真实数据的时间（ISO 字符串，未同步过为 null） */
  last_synced_at?: string | null
}

export interface TrendData {
  date: string
  published_count: number
  views: number
  likes: number
  avg_completion_rate: number
}

export interface WorkflowNode {
  id: string
  name: string
  agent: string
  description: string
}

export interface WorkflowEdge {
  from: string
  to: string
  condition?: string
}

export interface AgentLog {
  id: number
  agent_name: string
  action: string
  input_data: any
  output_data: any
  status: string
  error_message?: string
  duration_ms?: number
  created_at: string
}
