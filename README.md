# 自媒体示意图生成器

> AI 驱动的自媒体内容排版设计工具，支持图文排版、人物卡片制作，内置 DeepSeek AI 文案优化功能。

## 功能特性

- **可视化排版**：拖拽式画布，自由调整文字、图片、贴纸的位置和样式
- **人物介绍卡片**：一键生成个人/IP 形象展示卡片，支持自定义字段
- **AI 文案优化**：接入 DeepSeek API，支持小红书/抖音两种风格的文案一键改写
- **一键导出**：将设计好的示意图导出为高清 PNG 图片
- **模板保存**：支持保存和加载设计模板，方便复用
- **纯前端运行**：无需后端服务，打开网页即可使用

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | Tailwind CSS |
| 拖拽 | react-rnd |
| 图标 | Lucide React |
| 导出 | html-to-image |
| AI | DeepSeek API（Chat Completions） |

## 在线使用

打开网页即可使用，无需安装：

1. 点击左侧工具栏添加文字、图片或人物卡片
2. 拖拽元素调整位置，右侧面板调整样式
3. 使用 **AI 优化** 功能：点击左侧工具栏底部的钥匙图标，填入你的 [DeepSeek API Key](https://platform.deepseek.com/api_keys)，然后选中文字元素点击 ✨ 即可 AI 改写
4. 点击下载按钮导出 PNG 图片

> API Key 仅保存在你的浏览器本地，不会上传到任何服务器。

## 本地运行

```bash
npm install
npm run dev
```

## 构建部署

```bash
npm run build
# 将 dist/index.html 部署到任意静态服务器即可
```
