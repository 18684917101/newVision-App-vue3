/**
 * 登录检查和路由守卫工具
 * 用于需要登录才能访问的功能
 */

import { getToken, isTokenExpired } from '@/utils/auth'

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  const token = getToken()
  return token && !isTokenExpired()
}

/**
 * 显示登录提示弹窗
 * @param {string} action - 需要登录的操作名称
 * @returns {Promise} 用户选择的结果
 */
export function showLoginPrompt(action = '使用此功能') {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '登录提示',
      content: `${action}需要先登录，是否立即登录？`,
      confirmText: '立即登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          resolve(true)
        } else {
          reject(false)
        }
      },
      fail: () => {
        reject(false)
      }
    })
  })
}

/**
 * 跳转到登录页面
 * @param {string} redirectUrl - 登录成功后要跳转的页面
 */
export function navigateToLogin(redirectUrl = '') {
  const loginUrl = '/pages/login'
  
  if (redirectUrl) {
    // 将重定向地址作为参数传递
    const encodedUrl = encodeURIComponent(redirectUrl)
    uni.navigateTo({
      url: `${loginUrl}?redirect=${encodedUrl}`
    })
  } else {
    uni.navigateTo({
      url: loginUrl
    })
  }
}

/**
 * 微信登录
 * @returns {Promise} 登录结果
 */
export function performWxLogin() {
  return new Promise((resolve, reject) => {
    uni.showLoading({
      title: '登录中...'
    })
    
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        if (!loginRes.code) {
          uni.hideLoading()
          uni.showToast({
            title: '获取微信授权失败',
            icon: 'none'
          })
          reject(new Error('获取微信授权码失败'))
          return
        }
        
        // 这里需要调用store中的wxLogin方法
        // 由于循环依赖问题，在具体页面中调用
        resolve(loginRes.code)
      },
      fail: (error) => {
        uni.hideLoading()
        uni.showToast({
          title: '获取微信授权失败',
          icon: 'none'
        })
        reject(error)
      }
    })
  })
}

/**
 * 登录守卫 - 检查登录状态，未登录则提示并跳转
 * @param {string} action - 需要登录的操作名称
 * @param {string} redirectUrl - 登录成功后要跳转的页面
 * @returns {Promise<boolean>} 是否已登录或用户选择登录
 */
export function requireLogin(action = '使用此功能', redirectUrl = '') {
  return new Promise((resolve, reject) => {
    if (isLoggedIn()) {
      // 已登录，直接继续
      resolve(true)
      return
    }
    
    // 未登录，显示提示
    showLoginPrompt(action).then(() => {
      // 用户选择登录
      //#ifdef MP-WEIXIN
      // 微信小程序直接进行微信登录
      performWxLogin().then((code) => {
        // 这里返回code，让调用页面处理具体的登录逻辑
        resolve({ needLogin: true, code })
      }).catch(() => {
        reject(false)
      })
      //#endif
      
      //#ifndef MP-WEIXIN
      // 非微信环境跳转到登录页面
      navigateToLogin(redirectUrl)
      reject(false) // 需要跳转，当前操作中断
      //#endif
      
    }).catch(() => {
      // 用户取消登录
      reject(false)
    })
  })
}

/**
 * 简单的登录检查，不显示提示
 * @returns {boolean} 是否已登录
 */
export function checkLogin() {
  return isLoggedIn()
}

/**
 * 退出登录后的清理工作
 */
export function afterLogout() {
  // 清理可能的缓存数据
  uni.removeStorageSync('showNewUserGuide')
  uni.removeStorageSync('needRetryLogin')
  
  console.log('用户已退出登录')
}

