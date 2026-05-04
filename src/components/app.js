import { useMemo, useState, useEffect } from 'react';
import Header from './header';
import UptimeRobot from './uptimerobot';
import Package from '../../package.json';

function App() {

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, []);

  const timeDiff = useMemo(() => {
    const startDate = new Date('2022-05-01T18:00:00');
    const diff = currentTime.getTime() - startDate.getTime();
    
    // 计算天数
    const days = Math.floor(diff / (1000 * 3600 * 24));
    
    // 计算剩余的小时数
    const hours = Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600));
    
    // 计算剩余的分钟数
    const minutes = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
    
    return { days, hours, minutes, totalDays: diff / (1000 * 3600 * 24) };
  }, [currentTime]);

  // 计算年份（带小数）
  const calculateYears = useMemo(() => {
    return (timeDiff.totalDays / 365.25).toFixed(6);
  }, [timeDiff.totalDays]);

  return (
    <>
      <Header />
      <div className='container'>
        <div id='uptime'>
          <UptimeRobot />
        </div>

        <div id='footer'>
          <p title={`约 ${calculateYears} 年`}>
            无论如何, 你已经很棒了! 坚持 <b>{timeDiff.days}</b> 天 {timeDiff.hours} 小时 {timeDiff.minutes} 分钟啦~
          </p>
          <p>Copr. 2022 Ited Blog</p>
        </div>
      </div>
    </>
  );
}

export default App;
