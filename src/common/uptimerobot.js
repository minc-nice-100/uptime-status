import {
  formatNumber
} from './helper';

// --- Pure integer date math (zero Date object allocation in hot paths) ---

const SECONDS_PER_DAY = 86400;

// Compute YYYYMMDD integer from civil year/month/day
function ymd(y, m, d) {
  return y * 10000 + m * 100 + d;
}

// Compute day-start unix timestamp (seconds) from days since 1970-01-01
function dayStartUnix(daysSinceEpoch) {
  return daysSinceEpoch * SECONDS_PER_DAY;
}

// Convert unix seconds to days since 1970-01-01 (floor)
function unixToDays(ts) {
  // floor division that works correctly for negative timestamps (pre-1970)
  return (ts / SECONDS_PER_DAY) | 0;
}

// Convert days since 1970-01-01 to YYYYMMDD integer
// Based on Howard Hinnant's algorithm — pure integer math, no branches for dates after 1970
function daysToYmd(z) {
  // Shift epoch from 1970-03-01 to 0000-03-01 (makes leap year math uniform)
  // 1970-01-01 is 719468 days after 0000-03-01
  z += 719468;
  const era = (z >= 0 ? z : z - 146096) / 146097 | 0;
  const doe = z - era * 146097;           // day of era [0, 146096]
  const yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365 | 0;
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + (yoe / 4 | 0) - (yoe / 100 | 0)); // day of year [0, 365]
  const mp = (5 * doy + 2) / 153 | 0;     // month [0, 11] (Mar=0)
  const d = doy - (153 * mp + 2) / 5 + 1; // day [1, 31]
  const m = mp + (mp < 10 ? 3 : -9);      // month [1, 12]
  return ymd(y + (m <= 2 ? 1 : 0), m, d);
}

// Pre-computed day-start timestamps for the date range, keyed by YYYYMMDD integer.
// Also build a flat array of YYYYMMDD keys in reverse-chronological order (today first).

function buildDateIndex(days) {
  const now = Date.now();
  // Round to local midnight
  const todayTs = now - (now % (SECONDS_PER_DAY * 1000));
  const keys = new Array(days);
  // Store: YYYYMMDD_int -> day_start_unix_seconds
  const startByKey = {};

  for (let d = 0; d < days; d++) {
    const ms = todayTs - d * SECONDS_PER_DAY * 1000;
    const dt = new Date(ms);
    const key = ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    keys[d] = key;
    startByKey[key] = (ms / 1000) | 0;
  }

  return { keys, startByKey };
}

// --- Main ---

export async function GetMonitors(days) {

  const { keys: dateKeys, startByKey } = buildDateIndex(days);

  const startKey = dateKeys[days - 1];
  const endKey = dateKeys[0];
  const startUnix = startByKey[startKey];
  const endUnix = startByKey[endKey] + SECONDS_PER_DAY;

  const url = '/api?format=json&logs=1&log_types=1-2&logs_start_date=' + startUnix + '&logs_end_date=' + endUnix;

  const response = await fetch(url, { timeout: 30000 });
  const data = await response.json();

  if (data.stat !== 'ok') {
    document.getElementById('status-text').style.display = 'none';
    document.getElementById('status-down').style.display = 'block';
    document.getElementById('status-down').innerHTML = '数据获取出错';
    document.getElementById('status-time-up').innerHTML = '这可能是暂时性的，刷新页面以重试';
    document.getElementById('header').style = 'background: rgb(228,126,126); background: linear-gradient(53deg, rgba(228,126,126,1) 0%, rgba(238,85,85,1) 100%);';
    document.getElementById('status-tip').className = 'status-tip down';
    throw data.error;
  }

  // Yield to main thread so the loading skeleton renders before we compute
  await new Promise(r => setTimeout(r, 0));

  const monitors = data.monitors;
  const result = new Array(monitors.length);

  for (let mi = 0; mi < monitors.length; mi++) {
    const monitor = monitors[mi];

    // Initialize daily downtime map
    const dailyDowntime = {};
    for (let d = 0; d < days; d++) {
      dailyDowntime[dateKeys[d]] = { duration: 0, times: 0 };
    }

    let totalDuration = 0;
    let totalTimes = 0;

    const logs = monitor.logs;
    const logCount = logs.length;
    for (let li = 0; li < logCount; li++) {
      const log = logs[li];
      if (log.type !== 1) continue;

      const downStartSec = log.datetime;
      const duration = log.duration;
      const downEndSec = downStartSec + duration;

      let cursorSec = downStartSec;
      let remaining = duration;

      // Split across calendar days — zero heap allocation in loop body
      while (remaining > 0) {
        // End of current calendar day in unix seconds
        const dayEndSec = ((cursorSec / SECONDS_PER_DAY) | 0) * SECONDS_PER_DAY + SECONDS_PER_DAY;
        const segEndSec = dayEndSec < downEndSec ? dayEndSec : downEndSec;
        const segDuration = segEndSec - cursorSec;

        // Pure integer date key from unix timestamp
        const key = daysToYmd(unixToDays(cursorSec));

        const entry = dailyDowntime[key];
        if (entry !== undefined) {
          entry.duration += segDuration;
          entry.times += 1;
        }

        remaining -= segDuration;
        cursorSec = segEndSec;
      }

      totalDuration += duration;
      totalTimes += 1;
    }

    // Build daily array
    let totalUptime = 0;
    const daily = new Array(days);
    const invSecondsPerDay = 100 / SECONDS_PER_DAY; // pre-compute for uptime calc

    for (let d = 0; d < days; d++) {
      const key = dateKeys[d];
      const down = dailyDowntime[key];
      const uptime = down.duration !== 0
        ? (100 - down.duration * invSecondsPerDay > 0 ? 100 - down.duration * invSecondsPerDay : 0)
        : 100;
      totalUptime += uptime;
      daily[d] = {
        date: key,
        uptime: formatNumber(uptime),
        down: { times: down.times, duration: down.duration },
      };
    }

    const average = formatNumber(totalUptime / days);

    result[mi] = {
      id: monitor.id,
      name: monitor.friendly_name,
      url: monitor.url,
      average: average,
      daily: daily,
      total: { times: totalTimes, duration: totalDuration },
      status: 'unknow',
    };

    // DOM side effects
    if (mi === 0) {
      const d = new Date();
      const hour = d.getHours();
      const minute = d.getMinutes();
      document.getElementById('status-last-time').innerHTML = hour + '&nbsp;:&nbsp;' + (minute < 10 ? '0' + minute : minute);

      if (monitor.status === 2) {
        result[mi].status = 'ok';
        document.getElementById('status-text').innerHTML = '所有站点运行正常';
      }
      if (monitor.status === 9) {
        result[mi].status = 'down';
        document.getElementById('status-text').style.display = 'none';
        document.getElementById('status-down').style.display = 'block';
        document.getElementById('header').style = 'background: rgb(228,126,126); background: linear-gradient(53deg, rgba(228,126,126,1) 0%, rgba(238,85,85,1) 100%);';
        document.getElementById('status-tip').className = 'status-tip down';
        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = '/favicon-down.ico';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
    } else {
      if (monitor.status === 2) result[mi].status = 'ok';
      else if (monitor.status === 9) result[mi].status = 'down';
    }
  }

  return result;
}
