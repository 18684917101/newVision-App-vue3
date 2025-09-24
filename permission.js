import { getToken, isTokenExpired } from '@/utils/auth'
import { useUserStore } from '@/store'

// 首页
const homePage = "/pages/index"
  
// 页面白名单（不需要登录就能访问的页面）
const whiteList = [
  '/pages/index', // 首页
  '/pages/doctors/index', // 医生团队（可浏览）
  '/pages/common/webview/index', // 网页浏览
  '/pages/common/textview/index' // 文本浏览
]

// 检查地址白名单
function checkWhite(url) {
  const path = url.split('?')[0]
  return whiteList.indexOf(path) !== -1
}

// 需要登录才能访问的页面
const authRequiredPages = [
  '/pages/appointment/index',
  '/pages/doctor-list/index', 
  '/pages/appointment-detail/index',
  '/pages/appointment-history/index',
  '/pages/mine/index',
  '/pages/work/index',
  '/pages/mine/info/index',
  '/pages/mine/info/edit',
  '/pages/mine/avatar/index',
  '/pages/mine/pwd/index',
  '/pages/mine/setting/index'
]

// 检查是否需要登录
function checkAuthRequired(url) {
  const path = url.split('?')[0]
  return authRequiredPages.some(page => path === page)
}

// 页面跳转验证拦截器
let list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"]
list.forEach(item => {
  uni.addInterceptor(item, {
    invoke(to) {
      const hasToken = getToken()
      const isAuthRequired = checkAuthRequired(to.url)
      
      // 如果已登录且token未过期
      if (hasToken && !isTokenExpired()) {
        return true
      } else {
        // 未登录或token过期状态
        if (isAuthRequired) {
          // 检查是否在微信小程序环境
          //#ifdef MP-WEIXIN
          // 在微信小程序中，可能正在进行静默登录
          if (!hasToken) {
            // 没有token，可能静默登录还在进行中
            handleAuthRequired(to.url)
            return false
          } else if (isTokenExpired()) {
            // token过期，需要重新登录
            handleTokenExpired(to.url)
            return false
          }
          //#endif
          
          //#ifndef MP-WEIXIN
          // 非微信小程序环境，直接提示登录
          handleAuthRequired(to.url)
          return false
          //#endif
        }
        
        // 白名单页面允许访问
        if (checkWhite(to.url)) {
          return true
        }
        
        // 其他页面默认跳转到首页
        uni.reLaunch({ url: homePage })
        return false
      }
    },
    fail(err) {
      console.log('页面跳转失败:', err)
    }
  })
})

// 处理需要授权的页面访问
function handleAuthRequired(targetUrl) {
  //#ifdef MP-WEIXIN
  // 微信小程序环境下，提示用户进行微信授权
  uni.showModal({
    title: '需要登录',
    content: '使用此功能需要微信授权登录，是否立即登录？',
    confirmText: '立即登录',
    cancelText: '稍后再说',
    success: (res) => {
      if (res.confirm) {
        // 用户确认登录，跳转到首页并触发登录
        uni.reLaunch({ 
          url: homePage + '?autoLogin=true&target=' + encodeURIComponent(targetUrl)
        })
      } else {
        // 用户取消，跳转到首页
        uni.reLaunch({ url: homePage })
      }
    }
  })
  //#endif
  
  //#ifndef MP-WEIXIN
  uni.showToast({
    title: '请在微信小程序中使用',
    icon: 'none',
    duration: 2000
  })
  setTimeout(() => {
    uni.reLaunch({ url: homePage })
  }, 2000)
  //#endif
}

// 处理token过期
function handleTokenExpired(targetUrl) {
  console.log('Token已过期，需要重新登录')
  
  // 清理过期的token
  const userStore = useUserStore()
  userStore.logOut().then(() => {
    // 跳转到首页并提示重新登录
    uni.reLaunch({ 
      url: homePage + '?reLogin=true&target=' + encodeURIComponent(targetUrl)
    })
  })
}
