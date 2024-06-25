import Vue from 'vue'
import App from './App.vue'
import TraceKit from 'tracekit';
import axios from 'axios';
import dayjs from 'dayjs';

const protcol = window.location.protocol;
let errorMonitorUrl = `${protcol}//127.0.0.1:9999`;
const errorMonitorVueInterFace = 'reportVueError'; // vue错误上报接口
TraceKit.report.subscribe((error) => {
  const { message, stack } = error || {};

  const obj = {
    message,
    stack: {
      column: stack[0].column,
      line: stack[0].line,
      func: stack[0].func,
      url: stack[0].url
    }
  };

  axios({
    method: 'POST',
    url: `${errorMonitorUrl}/${errorMonitorVueInterFace}`,
    data: {
      error: obj,
      data: {
        errTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), // 是否移动端
        isWechat: /MicroMessenger/i.test(navigator.userAgent), // 是否微信浏览器
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, // 两个都是false就是未知设备
        isAndroid: /Android/.test(navigator.userAgent) && !/Windows Phone/.test(navigator.userAgent)
      },
      browserInfo: {
        userAgent: navigator.userAgent,
        protcol: protcol
      }
    }
  }).then(() => {
    console.log('错误上报成功');
  }).catch(() => {
    console.log('错误上报失败');
  });
});

Vue.config.errorHandler = (err, vm, info) => {
  TraceKit.report(err);
}

const errorMonitorWindowInterFace = 'reportWindowError'; // window错误上报接口
window.addEventListener('error', args => {
  const err = args.target.src || args.target.href;
  const obj = {
    message: '加载异常' + err
  };
  if (!err) {
    return true;
  }
  axios({
    method: 'POST',
    url: `${errorMonitorUrl}/${errorMonitorWindowInterFace}`,
    data: {
      error: obj,
      data: {
        errTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), // 是否移动端
        isWechat: /MicroMessenger/i.test(navigator.userAgent), // 是否微信浏览器
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, // 两个都是false就是未知设备
        isAndroid: /Android/.test(navigator.userAgent) && !/Windows Phone/.test(navigator.userAgent)
      },
      browserInfo: {
        userAgent: navigator.userAgent,
        protcol: protcol
      }
    }
  }).then(() => {
    console.log('错误上报成功');
  }).catch(() => {
    console.log('错误上报失败');
  });
  return true;
}, true);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app')
