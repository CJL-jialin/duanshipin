import request from '../utils/request'

export const videoApi = {
  deleteTask(taskId: number) {
    return request({ url: `/video/${taskId}`, method: 'delete' })
  },
  getOutro(taskId: number) {
    return request({ url: `/video/${taskId}/outro`, method: 'get' })
  },
  editOutro(taskId: number, options: { enabled: boolean; text: string; duration: number }) {
    return request({ url: `/video/${taskId}/outro`, method: 'post', data: options })
  },
  getModels() {
    return request({ url: '/video/models', method: 'get' })
  },
  changeOptions(taskId: number, options: import('../types').ProductionOptions) {
    return request({ url: `/video/${taskId}/options`, method: 'patch', data: options })
  },
  changeModel(taskId: number, videoModel: string) {
    return request({ url: `/video/${taskId}/model`, method: 'patch', data: { video_model: videoModel } })
  },
  // 创建视频任务
  // 新流程（剧情渲染）：只传 script_id，后端据此取分镜。
  // auto_start=false（默认）：只建任务不渲染，用户在分镜面板逐镜点「生成此镜」，
  // 全部就绪后手动「合成成片」—— 逐镜可控，渲染费花在刀刃上。
  createTask(data: { script_id?: number; auto_start?: boolean; video_model?: string; production_options?: import('../types').ProductionOptions }) {
    return request({
      url: '/video/create',
      method: 'post',
      data
    })
  },

  // 启动全片渲染（一键入口）：已逐镜渲过的镜自动跳过，只补缺的镜，
  // 全片渲完自动合成成片。前置：任务 pending/partial、万相 key 已配置。
  startRender(taskId: number) {
    return request({
      url: `/video/${taskId}/start`,
      method: 'post'
    })
  },

  // 合成成片（逐镜模式的手动合成）：拼接全部已渲镜 + 字幕 + 编码，
  // 不调万相零渲染成本。前置：任务 ready（全部镜头就绪）。
  composeVideo(taskId: number) {
    return request({
      url: `/video/${taskId}/compose`,
      method: 'post'
    })
  },

  // 单镜渲染（逐镜模式）：首次渲该镜或重渲都走这里，只渲镜不自动合成，
  // 每次调用都是一次真实的万相付费渲染。
  renderScene(taskId: number, sceneIndex: number) {
    return request({
      url: `/video/${taskId}/scenes/${sceneIndex}/render`,
      method: 'post'
    })
  },

  // 查询任务进度
  getTaskProgress(taskId: number) {
    return request({
      url: `/video/progress/${taskId}`,
      method: 'get'
    })
  },

  // 获取任务结果
  getTaskResult(taskId: number) {
    return request({
      url: `/video/result/${taskId}`,
      method: 'get'
    })
  },

  // 取消任务
  cancelTask(taskId: number) {
    return request({
      url: `/video/task/${taskId}`,
      method: 'delete'
    })
  },

  // 单镜重渲（2026-10-07 渐进预览配套）：只重渲指定镜并自动重拼+重合成成片，
  // 其余镜不重新付费渲染。前置：任务已完成、有分镜片段、万相 key 已配置。
  rerenderScene(taskId: number, sceneIndex: number) {
    return request({
      url: `/video/${taskId}/scenes/${sceneIndex}/rerender`,
      method: 'post'
    })
  },

  // 获取任务列表
  getTasks(page: number = 1, pageSize: number = 20, status?: string, search?: string) {
    return request({
      url: '/video/tasks',
      method: 'get',
      params: { page, page_size: pageSize, status, search }
    })
  }
}

export const scriptApi = {
  getScript(scriptId: number) {
    return request({ url: `/script/${scriptId}`, method: 'get' })
  },
  updateCharacters(scriptId: number, characters: Array<{ name: string; appearance: string; role?: string; views?: Record<string, string> }>) {
    return request({ url: `/script/${scriptId}/characters`, method: 'put', data: { characters } })
  },
  updateStoryboard(scriptId: number, data: {
    scenes: Array<{ index: number; scene: string; visual_prompt: string; narration: string }>
  }) {
    return request({
      url: `/script/${scriptId}/storyboard`,
      method: 'put',
      data
    })
  },

  // 生成剧情稿
  // target_duration 为目标时长（秒，15/30/60/90），后端据此换算字数上限；
  // 省略时后端按默认档（30 秒）处理，保证旧调用不破。
  // 2026-10-07 审核改版：后端不再自动打回重写，只生成一次+评审一次。
  generateScript(data: { input_type: string; input_content: string; target_duration?: number; video_model?: string }) {
    return request({
      url: '/script/generate',
      method: 'post',
      data,
      // agent 全链（热榜+编剧+评审）实测 2 分钟以上（1分钟档 130s），
      // 默认 60s 会在后端成功前就超时放弃——前端报「网络错误」、响应被白扔。
      timeout: 300000
    })
  },

  // 按审核意见定向返工（AI 审核页手动触发）：后端取原稿评审意见交写作 agent 修改，
  // 改完再审一次，新稿+新评审覆盖入库。target_duration 省略时后端按原稿时长就近取档。
  regenerateScript(scriptId: number, targetDuration?: number) {
    return request({
      url: `/script/${scriptId}/regenerate`,
      method: 'post',
      data: targetDuration ? { target_duration: targetDuration } : {},
      timeout: 300000
    })
  },

  // 目标时长档位及各自字数区间（定义在后端 core/script_spec，前端不重复维护）
  getScriptOptions(videoModel?: string) {
    return request({
      url: '/script/options',
      method: 'get',
      params: videoModel ? { video_model: videoModel } : undefined
    })
  },

  // 获取剧情稿列表
  getScripts(page: number = 1, pageSize: number = 20, search?: string) {
    return request({
      url: '/script/list',
      method: 'get',
      params: { page, page_size: pageSize, search }
    })
  },

  // 删除剧情稿
  deleteScript(scriptId: number) {
    return request({
      url: `/script/${scriptId}`,
      method: 'delete'
    })
  }
}

export const avatarApi = {
  // 剧情角色定妆照（一次生成一张正面/侧面/背面同框的三视图）
  generateCharacter(data: {
    name: string
    appearance: string
    style?: string
  }) {
    return request({
      url: '/avatar/generate-character',
      method: 'post',
      data,
      timeout: 300000
    })
  },

  // 文生图（自由生成）
  textToImage(data: { prompt: string; name?: string }) {
    return request({
      url: '/avatar/text-to-image',
      method: 'post',
      data,
      timeout: 300000
    })
  },

  // 图生图（角色微调：换装/换风格，保脸）
  imageToImage(data: FormData) {
    return request({
      url: '/avatar/image-to-image',
      method: 'post',
      data,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000
    })
  },

  // 获取人物列表
  getAvatars(page: number = 1, pageSize: number = 20) {
    return request({
      url: '/avatar/list',
      method: 'get',
      params: { page, page_size: pageSize }
    })
  },

  // 删除人物
  deleteAvatar(avatarId: number) {
    return request({
      url: `/avatar/${avatarId}`,
      method: 'delete'
    })
  }
}

export const publishApi = {
  getConfig() {
    return request({ url: '/publish/config', method: 'get' })
  },
  uploadCover(taskId: number, file: File) {
    const data = new FormData()
    data.append('image', file)
    return request({ url: `/publish/materials/${taskId}/cover`, method: 'post', data, headers: { 'Content-Type': 'multipart/form-data' } })
  },
  // 发布视频
  publishVideo(data: {
    video_task_id: number
    custom_title?: string
    custom_description?: string
    custom_hashtags?: string[]
    scheduled_time?: string
  }) {
    return request({
      url: '/publish/publish',
      method: 'post',
      data
    })
  },

  // 获取发布记录
  getRecords(page: number = 1, pageSize: number = 20, status?: string) {
    return request({
      url: '/publish/records',
      method: 'get',
      params: { page, page_size: pageSize, status }
    })
  },

  // 获取单个发布记录
  getRecord(recordId: number) {
    return request({
      url: `/publish/record/${recordId}`,
      method: 'get'
    })
  },

  // 重新发布
  republish(data: { record_id: number; title?: string; hashtags?: string[] }) {
    return request({
      url: '/publish/republish',
      method: 'put',
      data
    })
  },

  // 同步数据
  syncStats(recordId: number) {
    return request({
      url: `/publish/sync-stats/${recordId}`,
      method: 'post'
    })
  },

  // 批量同步全部发布记录的真实数据（后端开浏览器抓一次，约 20~40s）
  syncAllStats() {
    return request({
      url: '/publish/sync-stats-all',
      method: 'post',
      timeout: 120000
    })
  },

  // 读取某视频任务的发布物料（标题/正文/话题/封面/最近一次发布结果）
  getMaterials(videoTaskId: number) {
    return request({
      url: `/publish/materials/${videoTaskId}`,
      method: 'get'
    })
  },

  // 重新生成发布物料（LLM 文案 + 封面大字，约 10~30 秒）
  regenerateMaterials(videoTaskId: number) {
    return request({
      url: `/publish/materials/${videoTaskId}/regenerate`,
      method: 'post'
    })
  },

  // 检测抖音登录态。后端要启动真实浏览器检测（约 20~45 秒），结果缓存 5 分钟；
  // force=true 忽略缓存强制重测
  douyinStatus(force: boolean = false) {
    return request({
      url: '/publish/douyin/status',
      method: 'get',
      params: { force }
    })
  },

  // 启动扫码登录：弹有头浏览器，人工扫码，接口立即返回
  douyinLogin(timeoutSec: number = 300) {
    return request({
      url: '/publish/douyin/login',
      method: 'post',
      params: { timeout_sec: timeoutSec }
    })
  },

  // 查询扫码登录进度（前端轮询）
  douyinLoginStatus() {
    return request({
      url: '/publish/douyin/login/status',
      method: 'get'
    })
  }
}

export const analyticsApi = {
  // 获取总览数据
  getOverview() {
    return request({
      url: '/analytics/overview',
      method: 'get'
    })
  },

  // 获取趋势数据
  getTrend(days: number = 7) {
    return request({
      url: '/analytics/trend',
      method: 'get',
      params: { days }
    })
  },

  // 获取Top视频
  getTopVideos(metric: string = 'views', limit: number = 10) {
    return request({
      url: '/analytics/top-videos',
      method: 'get',
      params: { metric, limit }
    })
  },

  // 获取质量分布
  getQualityDistribution() {
    return request({
      url: '/analytics/quality-distribution',
      method: 'get'
    })
  },

  // 获取生产效率
  getProductionEfficiency(days: number = 30) {
    return request({
      url: '/analytics/production-efficiency',
      method: 'get',
      params: { days }
    })
  }
}

export const workflowApi = {
  // 获取工作流状态
  getState(threadId: string) {
    return request({
      url: `/workflow/state/${threadId}`,
      method: 'get'
    })
  },

  // 获取工作流历史
  getHistory(threadId: string) {
    return request({
      url: `/workflow/history/${threadId}`,
      method: 'get'
    })
  },

  // 获取Agent日志
  getLogs(taskId: number, agentName?: string) {
    return request({
      url: `/workflow/logs/${taskId}`,
      method: 'get',
      params: { agent_name: agentName }
    })
  },

  // 重试工作流
  retry(data: { task_id: number; from_step: string }) {
    return request({
      url: '/workflow/retry',
      method: 'post',
      data
    })
  },

  // 获取图结构
  getGraphStructure() {
    return request({
      url: '/workflow/graph-structure',
      method: 'get'
    })
  }
}
