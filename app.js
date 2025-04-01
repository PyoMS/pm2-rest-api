const express = require('express');
const pm2 = require('pm2');
const app = express();
const port = 3030;

app.use(express.json()); // JSON 파싱용

// PM2 연결 유틸 함수
function withPM2(action, res) {
  pm2.connect((err) => {
    if (err) {
      console.error('❌ PM2 연결 실패:', err);
      return res.status(500).send('PM2 연결 실패');
    }

    action(() => pm2.disconnect());
  });
}

// ▶ PM2 리스트 조회
app.get('/list', (req, res) => {
  withPM2((done) => {
    pm2.list((err, list) => {
      done();
      if (err) {
        console.error('❌ 리스트 조회 실패:', err);
        return res.status(500).send('리스트 조회 실패');
      }
      res.json(list);
    });
  }, res);
});

// ⏹ 종료
app.post('/stop/:appName', (req, res) => {
  const appName = req.params.appName;
  withPM2((done) => {
    pm2.stop(appName, (err) => {
	  if(appName === 'pm2-rest-api') {
	    return res.status(500).send('API 앱 종료는 종료할 수 없습니다.');
	  }  
      done();
      if (err) {
        console.error('❌ 종료 실패:', err);
        return res.status(500).send('앱 종료 실패');
      }
      res.send(`✅ 앱 "${appName}" 종료 완료`);
    });
  }, res);
});

// 🔄 재시작
app.post('/restart/:appName', (req, res) => {
  const appName = req.params.appName;
  withPM2((done) => {
    pm2.restart(appName, (err) => {
      done();
      if (err) {
        console.error('❌ 재시작 실패:', err);
        return res.status(500).send('앱 재시작 실패');
      }
      res.send(`✅ 앱 "${appName}" 재시작 완료`);
    });
  }, res);
});

// ▶ 시작
// 요청 바디: { "script": "app.js", "name": "my-app" }
app.post('/start', (req, res) => {
  const { script, name } = req.body;

  if (!script || !name) {
    return res.status(400).send('script 와 name 필드를 포함해야 합니다');
  }

  withPM2((done) => {
    pm2.start({ script, name }, (err, proc) => {
      done();
      if (err) {
        console.error('❌ 시작 실패:', err);
        return res.status(500).send('앱 시작 실패');
      }
      res.send(`✅ 앱 "${name}" 시작 완료`);
    });
  }, res);
});

app.listen(port, () => {
  console.log(`🚀 PM2 API 서버 실행 중: http://localhost:${port}`);
});

