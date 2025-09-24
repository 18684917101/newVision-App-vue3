import config from '@/config'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { useUserStore } from '@/store/modules/user'
import { toast, showConfirm, tansParams } from '@/utils/common'

let timeout = 10000
const baseUrl = config.baseUrl

// 静默登录进度状态管理
let silentLoginInProgress = false

/**
 * 设置静默登录进度状态
 * @param {boolean} inProgress - 是否正在进行静默登录
 */
export function setSilentLoginProgress(inProgress) {
  silentLoginInProgress = inProgress
  console.log('静默登录状态更新:', inProgress ? '进行中' : '已完成')
}

/**
 * 获取静默登录进度状态
 * @returns {boolean} 是否正在进行静默登录
 */
export function getSilentLoginProgress() {
  return silentLoginInProgress
}

const request = config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  config.header = config.header || {}
  if (getToken() && !isToken) {
    config.header['Authorization'] = 'Bearer ' + getToken()
  }
  
  // 如果正在进行静默登录，且不是登录相关的请求，则延迟执行
  if (silentLoginInProgress && !config.url.includes('/login') && !config.url.includes('/getInfo')) {
    console.log('静默登录进行中，延迟请求:', config.url)
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (!silentLoginInProgress) {
          clearInterval(checkInterval)
          // 重新发起请求
          request(config).then(resolve).catch(reject)
        }
      }, 100)
      
      // 超时处理，避免无限等待
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error('静默登录超时'))
      }, 10000)
    })
  }
  // get请求映射params参数
  if (config.params) {
    let url = config.url + '?' + tansParams(config.params)
    url = url.slice(0, -1)
    config.url = url
  }
  return new Promise((resolve, reject) => {
    uni.request({
        method: config.method || 'get',
        timeout: config.timeout ||  timeout,
        url: config.baseUrl || baseUrl + config.url,
        data: config.data,
        header: config.header,
        dataType: 'json'
      }).then(response => {
        const res = response
        const code = res.data.code || 200
        const msg = errorCode[code] || res.data.msg || errorCode['default']
        if (code === 401) {
          showConfirm('登录状态已过期，您可以继续留在该页面，或者重新登录?').then(res => {
            if (res.confirm) {
              useUserStore().logOut().then(res => {
                uni.reLaunch({ url: '/pages/login' })
              })
            }
          })
          reject('无效的会话，或者会话已过期，请重新登录。')
        } else if (code === 500) {
          toast(msg)
          reject('500')
        } else if (code !== 200) {
          toast(msg)
          reject(code)
        }
        resolve(res.data)
      })
      .catch(error => {
        let { message } = error
        if (message === 'Network Error') {
          message = '后端接口连接异常'
        } else if (message.includes('timeout')) {
          message = '系统接口请求超时'
        } else if (message.includes('Request failed with status code')) {
          message = '系统接口' + message.substr(message.length - 3) + '异常'
        }
        toast(message)
        reject(error)
      })
  })
}

export default request
