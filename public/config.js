// 配置
window.Config = {

  // 显示标题
  SiteName: 'Ited Blog Status Page',

  // UptimeRobot Api Keys
  // 支持 Monitor-Specific 和 Read-Only
  ApiKeys: [
    'ur2076229-8e5966f49b9811365ce2fe89',
  ],

    // 日志天数
  // 虽然免费版说仅保存60天日志，但测试好像API可以获取90天的
  // 不过时间不要设置太长，容易卡，接口请求也容易失败
  CountDays: 90,

  // 是否显示检测站点的链接
  ShowLink: true,

  // 导航栏菜单
  Navi: [
    {
      text: 'Home',
      url: 'https://status.itedev.com/'
    },
    {
      text: 'Blog',
      url: 'https://itedev.com/'
    }
  ],
};
