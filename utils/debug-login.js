/**
 * 调试登录工具
 * 用于微信小程序开发环境下的登录状态调试
 */

import { getToken, isTokenExpired } from '@/utils/auth'

/**
 * 打印当前登录状态
 */
export function printLoginStatus() {
  console.log('=== 当前登录状态 ===')
  
  const token = getToken()
  if (!token) {
    console.log('Token: 无')
    console.log('登录状态: 未登录')
    return
  }
  
  console.log('Token:', token.substring(0, 20) + '...')
  
  const expired = isTokenExpired()
  console.log('Token过期状态:', expired ? '已过期' : '有效')
  console.log('登录状态:', expired ? '需要重新登录' : '已登录')
  
  // 检查存储的用户信息
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo) {
    console.log('用户信息:', {
      nickName: userInfo.nickName || '未设置',
      userName: userInfo.userName || '未设置',
      userId: userInfo.userId || '未设置'
    })
  } else {
    console.log('用户信息: 无')
  }
  
  console.log('=== 登录状态检查完成 ===')
}

/**
 * 检查微信环境
 */
export function checkWxEnvironment() {
  console.log('=== 微信环境检查 ===')
  
  // #ifdef MP-WEIXIN
  // 获取系统信息
  try {
    const systemInfo = uni.getSystemInfoSync()
    console.log('微信版本:', systemInfo.version)
    console.log('基础库版本:', systemInfo.SDKVersion)
    console.log('平台:', systemInfo.platform)
    console.log('品牌:', systemInfo.brand)
    console.log('型号:', systemInfo.model)
    
    // 检查微信登录能力
    console.log('微信登录能力检查:')
    uni.checkSession({
      success: () => {
        console.log('- 微信登录状态: 有效')
      },
      fail: () => {
        console.log('- 微信登录状态: 无效，需要重新登录')
      }
    })
    
    // 检查网络状态
    uni.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType)
        console.log('网络状态:', res.networkType === 'none' ? '无网络' : '网络正常')
      }
    })
    
  } catch (error) {
    console.error('获取系统信息失败:', error)
  }
  // #endif
  
  // #ifndef MP-WEIXIN
  console.log('当前不在微信小程序环境')
  // #endif
  
  console.log('=== 微信环境检查完成 ===')
}

/**
 * 打印存储信息
 */
export function printStorageInfo() {
  console.log('=== 本地存储信息 ===')
  
  try {
    const storageInfo = uni.getStorageInfoSync()
    console.log('存储空间使用:', `${storageInfo.currentSize}KB / ${storageInfo.limitSize}KB`)
    console.log('存储的键值:', storageInfo.keys)
    
    // 打印重要的存储项
    const importantKeys = ['userInfo', 'token', 'roles', 'permissions']
    importantKeys.forEach(key => {
      try {
        const value = uni.getStorageSync(key)
        if (value) {
          console.log(`${key}:`, typeof value === 'string' ? value.substring(0, 50) + '...' : value)
        } else {
          console.log(`${key}: 无`)
        }
      } catch (e) {
        console.log(`${key}: 读取失败`)
      }
    })
    
  } catch (error) {
    console.error('获取存储信息失败:', error)
  }
  
  console.log('=== 存储信息检查完成 ===')
}

/**
 * 清理调试数据
 */
export function clearDebugData() {
  console.log('=== 清理调试数据 ===')
  
  try {
    // 清理登录相关数据
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('roles')
    uni.removeStorageSync('permissions')
    uni.removeStorageSync('needRetryLogin')
    uni.removeStorageSync('showNewUserGuide')
    
    console.log('调试数据清理完成')
    console.log('重启应用以应用更改')
    
  } catch (error) {
    console.error('清理调试数据失败:', error)
  }
  
  console.log('=== 调试数据清理完成 ===')
}

/**
 * 模拟登录失败场景
 */
export function simulateLoginFailure() {
  console.log('=== 模拟登录失败 ===')
  clearDebugData()
  console.log('已清理登录数据，下次启动将触发登录流程')
}

/**
 * 打印完整的调试信息
 */
export function printFullDebugInfo() {
  console.log('\n'.repeat(2))
  console.log('████████████████████████████████████████')
  console.log('█         RuoYi-App 调试信息           █')
  console.log('████████████████████████████████████████')
  
  checkWxEnvironment()
  console.log('\n')
  printLoginStatus()
  console.log('\n')
  printStorageInfo()
  
  console.log('████████████████████████████████████████')
  console.log('█            调试信息结束               █')
  console.log('████████████████████████████████████████')
  console.log('\n'.repeat(2))
}

// 开发环境下在控制台提供全局调试方法
// #ifdef MP-WEIXIN
if (process.env.NODE_ENV === 'development') {
  // 将调试方法挂载到全局，方便控制台调用
  if (typeof global !== 'undefined') {
    global.debugLogin = {
      printLoginStatus,
      checkWxEnvironment,
      printStorageInfo,
      clearDebugData,
      simulateLoginFailure,
      printFullDebugInfo
    }
  }
}
// #endif
