import axios from 'axios';
import dayjs from 'dayjs';
import {
  formatNumber
} from './helper';

export async function GetMonitors(days) {

  const dates = [];
  const today = dayjs(new Date().setHours(0, 0, 0, 0));
  const secondsPerDay = 86400;
  for (let d = 0; d < days; d++) {
    dates.push(today.subtract(d, 'day'));
  }

  const start = dates[dates.length - 1].unix();
  const end = dates[0].add(1, 'day').unix();

  const postdata = {
    format: 'json',
    logs: 1,
    log_types: '1-2',
    logs_start_date: start,
    logs_end_date: end,
  };

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(postdata)) {
    params.append(key, value);
  }

  const response = await axios.get('/api', {
    params,
    timeout: 30000
  });
  if (response.data.stat !== 'ok') {
    document.getElementById('status-text').style.display = 'none';
    document.getElementById('status-down').style.display = 'block';
    document.getElementById('status-down').innerHTML = '数据获取出错';
    document.getElementById('status-time-up').innerHTML = '这可能是暂时性的，刷新页面以重试'
    document.getElementById('header').style = 'background: rgb(228,126,126); background: linear-gradient(53deg, rgba(228,126,126,1) 0%, rgba(238,85,85,1) 100%);';
    document.getElementById('status-tip').className = 'status-tip down';
    throw response.data.error;
  };
  return response.data.monitors.map((monitor) => {

    // Build daily downtime map from logs, compute uptime %
    const dailyDowntime = {};
    dates.forEach((date) => {
      dailyDowntime[date.format('YYYYMMDD')] = { duration: 0, times: 0 };
    });

    let totalDuration = 0;
    let totalTimes = 0;

    monitor.logs.forEach((log) => {
      if (log.type === 1) {
        const date = dayjs.unix(log.datetime).format('YYYYMMDD');
        if (dailyDowntime[date]) {
          dailyDowntime[date].duration += log.duration;
          dailyDowntime[date].times += 1;
        }
        totalDuration += log.duration;
        totalTimes += 1;
      }
    });

    // Build daily array with computed uptime
    let totalUptime = 0;
    const daily = dates.map((date) => {
      const key = date.format('YYYYMMDD');
      const down = dailyDowntime[key];
      const uptime = Math.max(0, Math.min(100, 100 - (down.duration / secondsPerDay) * 100));
      totalUptime += uptime;
      return {
        date: date,
        uptime: formatNumber(uptime),
        down: {
          times: down.times,
          duration: down.duration
        },
      };
    });

    const average = formatNumber(totalUptime / dates.length);

    const result = {
      id: monitor.id,
      name: monitor.friendly_name,
      url: monitor.url,
      average: average,
      daily: daily,
      total: {
        times: totalTimes,
        duration: totalDuration
      },
      status: 'unknow',
    };


    var d = new Date();
    var hour = d.getHours();
    var minute = d.getMinutes();
    if (minute >= 0 && minute < 10) {
      minute = "0" + minute;
    }
    document.getElementById('status-last-time').innerHTML = hour + "&nbsp;:&nbsp;" + minute;

    if (monitor.status === 2) {
      result.status = 'ok';
      document.getElementById('status-text').innerHTML = "所有站点运行正常";
    };
    if (monitor.status === 9) {
      result.status = 'down';
      document.getElementById('status-text').style.display = 'none';
      document.getElementById('status-down').style.display = 'block';
      document.getElementById('header').style = 'background: rgb(228,126,126); background: linear-gradient(53deg, rgba(228,126,126,1) 0%, rgba(238,85,85,1) 100%);';
      document.getElementById('status-tip').className = 'status-tip down';
      var link = document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = '/favicon-down.ico';
      document.getElementsByTagName('head')[0].appendChild(link);
    };
    return result;
  });
}
