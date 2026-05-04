import ReactTooltip from 'react-tooltip';
import { useEffect, useState } from 'react';
import { GetMonitors } from '../common/uptimerobot';
import { formatDuration, formatNumber } from '../common/helper';
import Link from './link';

// Format YYYYMMDD integer to "YYYY.MM.DD"
function formatDate(key) {
  const y = (key / 10000) | 0;
  const m = ((key / 100) | 0) % 100;
  const d = key % 100;
  return y + '.' + (m < 10 ? '0' + m : m) + '.' + (d < 10 ? '0' + d : d);
}

function UptimeRobot() {

  const status = {
    ok: '正常',
    down: '无法访问',
    unknow: '状态未知'
  };

  const { CountDays, ShowLink } = window.Config;

  const [monitors, setMonitors] = useState();

  useEffect(() => {
    GetMonitors(CountDays).then(setMonitors).catch(err => {
      console.error(err);
    });
  }, [CountDays]);

  // react-tooltip v4 needs manual rebuild after data-driven DOM changes
  useEffect(() => {
    if (monitors) ReactTooltip.rebuild();
  }, [monitors]);

  if (monitors) return monitors.map((site) => (
    <div key={site.id} className='site'>
      <div className='meta'>
        <span className='name' dangerouslySetInnerHTML={{ __html: site.name }} />
        {ShowLink && <Link className='link' to={site.url} text={site.name} />}
        <span className={'status ' + site.status}>{status[site.status]}</span>
      </div>
      <div className='timeline'>
        {site.daily.map((data, index) => {
          let cls = '';
          let text = formatDate(data.date) + ' ';
          if (data.uptime >= 100) {
            cls = 'ok';
            text += '可用率 ' + formatNumber(data.uptime) + '%';
          }
          else if (data.uptime <= 0 && data.down.times === 0) {
            cls = 'none';
            text += '无数据';
          }
          else {
            cls = 'down';
            text += '故障 ' + data.down.times + ' 次，累计 ' + formatDuration(data.down.duration) + '，可用率 ' + formatNumber(data.uptime) + '%';
          }
          return (<i key={index} className={cls} data-tip={text} />)
        })}
      </div>
      <div className='summary'>
        <span className='summary-now'>今天</span>
        <span className='summary-note'>
          {site.total.times
            ? '最近 ' + CountDays + ' 天内故障 ' + site.total.times + ' 次，累计 ' + formatDuration(site.total.duration) + '，平均可用率 ' + site.average + '%'
            : '最近 ' + CountDays + ' 天内可用率 ' + site.average + '%'}
        </span>
        <span className='summary-day'>{formatDate(site.daily[site.daily.length - 1].date)}</span>
      </div>
      <ReactTooltip className='tooltip' place='bottom' type='dark' effect='solid' />
    </div>
  ));

  else return (
    <div className='site'>
      <div className='loading' />
    </div>
  );
}

export default UptimeRobot;
