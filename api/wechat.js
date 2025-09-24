import request from '@/utils/request'

// 微信登录重试函数
export function wxLoginWithRetry(code, retryCount = 3) {
  return new Promise((resolve, reject) => {
    function attemptLogin(attempts) {
      wxLogin(code).then(resolve).catch((error) => {
        if (attempts > 1) {
          console.log(`微信登录失败，剩余重试次数: ${attempts - 1}`)
          setTimeout(() => {
            attemptLogin(attempts - 1)
          }, 1000) // 延迟1秒重试
        } else {
          reject(error)
        }
      })
    }
    attemptLogin(retryCount)
  })
}

// 微信小程序登录
export function wxLogin(code) {
  return request({
    url: '/c/auth/wx-login',
    headers: {
      isToken: false
    },
    method: 'post',
    data: {
      code: code
    },
    timeout: 10000, // 10秒超时
    retry: 2 // 自动重试2次
  })
}

// 刷新token
export function refreshToken() {
  return request({
    url: '/c/auth/refresh-token',
    method: 'post'
  })
}

// 获取用户信息
export function getWxUserInfo() {
  return request({
    url: '/c/auth/user-info',
    method: 'get'
  })
}

// 绑定手机号
export function bindPhone(data) {
  return request({
    url: '/c/auth/bind-phone',
    method: 'post',
    data: data
  })
}

// 退出登录
export function wxLogout() {
  return request({
    url: '/c/auth/logout',
    method: 'post'
  })
}
