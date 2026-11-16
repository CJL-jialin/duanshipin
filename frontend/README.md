# 短视频创作工作台 · 前端

## GitHub Pages 演示

访问地址：https://cjl-jialin.github.io/duanshipin/

独立的纯前端交互演示，不连接后端，不调用 AI 服务，不登录或发布到真实平台。
直接打开即以演示访客身份进入，可以体验内容编辑、模拟剧本生成与审核、角色选择、模拟分镜生成与合成、发布演练、统计图表和字幕导出。
视频和角色图片为固定示例素材；语音识别返回示例文本，不转写所选文件。所有统计均为虚构演示数据。
数据保存在当前浏览器的 localStorage，访客之间互不影响；顶部“重置演示”恢复初始数据。不要输入真实密码或敏感信息。

## 本地运行

```sh
npm ci
npm run dev
```

普通开发模式保留后端代理，默认指向本机 8888 端口。

```sh
npm run build:demo
npm run preview:demo -- --host 127.0.0.1
```

预览地址 http://127.0.0.1:4173/duanshipin/ 。演示构建启用 `.env.demo`，使用 `/duanshipin/` 资源前缀和 hash 路由，支持刷新。
`npm run build` 仍生成原来的后端配套前端，不启用演示模式。

## 自动部署

仓库 Settings → Pages → Source 选择 GitHub Actions。推送到 main 后，`.github/workflows/pages.yml` 自动安装依赖、构建演示站并部署 Pages。
仅上传前端和部署配置；不要上传后端、密钥、`.env.local`、浏览器登录资料或个人媒体。
