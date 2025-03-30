import { useMemo } from 'react';
import Link from './link';
import Header from './header';
import UptimeRobot from './uptimerobot';
import Package from '../../package.json';

function App() {

  const apikeys = useMemo(() => {
    const { ApiKeys } = window.Config;
    if (Array.isArray(ApiKeys)) return ApiKeys;
    if (typeof ApiKeys === 'string') return [ApiKeys];
    return [];
  }, []);

  return (
    <>
      <Header />
      <div className='container'>
        <div id='uptime'>
          {apikeys.map((key) => (
            <UptimeRobot key={key} apikey={key} />
          ))}
        </div>
          <script>
              function show_hitokoto() {
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'https://hitokoto.itedev.com/');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                const data = JSON.parse(xhr.responseText);
                hitokoto.innerText = data.hitokoto;
            }
        }
        xhr.send();
    };
        show_hitokoto();

          </script>
        <div id='footer'>       
            <a href="javascript:void(0);" onclick="show_hitokoto()" title="点击刷新"><b>
                <div id="hitokoto">Loading...</div>
            </b></a>
          <p>Copr. 2025 Ited Blog</p>
        </div>
      </div>
    </>
  );
}

export default App;
