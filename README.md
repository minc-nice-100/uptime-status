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

原项目: https://github.com/yb/uptime-status
美化版: https://github.com/imsyy/status
