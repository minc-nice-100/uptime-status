# Uptime Status

基于 UptimeRobot API 的站点状态监控页面，通过 Cloudflare Pages 部署，纯静态 + Cloudflare Functions 代理 API 请求。

## 部署

1. Fork 本项目
2. 在 Cloudflare Pages 中导入仓库
3. 构建命令: `npm run build`，输出目录: `build`
4. 修改 `public/config.js`:
   - `SiteName`: 站点名称
   - `CountDays`: 显示天数（默认 90）
   - `ShowLink`: 是否显示站点链接
   - `Navi`: 导航栏菜单
5. **无需配置 API Key** — 密钥在 `functions/api.js` 后端注入

## 本地调试

```
npm install
npm run start
```

## 打包

```
npm run build
```

## 说明

- 前端通过 Cloudflare Functions (`functions/api.js`) 代理 UptimeRobot API，绕过 GFW
- API Key 在后端注入，不暴露到前端
- 前端基于日志自行计算每日可用率，不依赖 `custom_uptime_ranges`
- GET 请求支持 Cloudflare CDN 边缘缓存

## 设计思路

### 为什么要用 Cloudflare Functions 代理？

UptimeRobot API (`api.uptimerobot.com`) 在 GFW 内被屏蔽，直接从浏览器调用会失败。Cloudflare Pages Functions 运行在边缘节点，可以正常访问 UptimeRobot，作为代理转发请求。

### 为什么不直接用 POST？

Cloudflare CDN 只缓存 GET 请求。切换为 GET 后，API 响应在边缘缓存 5 分钟，大幅减少 Worker 调用次数和响应延迟。

### 为什么不用 `custom_uptime_ranges`？

UptimeRobot 服务端计算每日可用率很慢，尤其日志天数多时容易超时（Cloudflare Workers 免费版有 10s CPU 限制）。改由前端根据原始日志自行计算：

1. 只取 `log_types=1-2`（故障和恢复事件）
2. 按日历天拆分跨日宕机（如 23:58 → 00:03 按天分配秒数）
3. 每日可用率 = `100 - (当日宕机秒数 / 86400 × 100)`

这样 API 请求体更小、响应更快，即使 90 天数据也不会超时。

原项目: https://github.com/yb/uptime-status
美化版: https://github.com/imsyy/status
