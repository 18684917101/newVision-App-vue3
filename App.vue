<script setup>
  import config from './config'
  import { getToken, isTokenExpired } from '@/utils/auth'
  import { useConfigStore, useUserStore } from '@/store'
  import { getCurrentInstance } from "vue"
  import { onLaunch } from '@dcloudio/uni-app'
  import { setSilentLoginProgress } from '@/utils/request'
  
  //#ifdef MP-WEIXIN
  // 开发环境下导入调试工具
  import { printLoginStatus, checkWxEnvironment } from '@/utils/debug-login'
  //#endif

  const { proxy } = getCurrentInstance()
  const userStore = useUserStore()

  onLaunch(() => {
    initApp()
  })

  // 初始化应用
  function initApp() {
    // 初始化应用配置
    initConfig()
    
    //#ifdef MP-WEIXIN
    // 开发环境下打印调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('=== RuoYi-App 微信小程序启动 ===')
      checkWxEnvironment()
      printLoginStatus()
    }
    //#endif
    
    // 检查用户登录状态和微信登录
    checkLoginStatus()
  }

  function initConfig() {
    useConfigStore().setConfig(config)
  }

  // 检查登录状态
  function checkLoginStatus() {
    //#ifdef MP-WEIXIN
    // 微信小程序静默登录
    wxSilentLogin()
    //#endif
    
    //#ifndef MP-WEIXIN
    // 非微信小程序环境，检查是否有token，没有则提示
    if (!getToken()) {
      console.log('非微信小程序环境，未登录状态')
    }
    //#endif
  }

  // 微信静默登录
  function wxSilentLogin() {
    const token = getToken()
    
    // 设置静默登录状态开始
    setSilentLoginProgress(true)
    console.log('=== 开始静默登录流程 ===')
    
    // 检查token是否存在且未过期
    if (token && !isTokenExpired()) {
      console.log('Token有效，验证用户信息')
      validateToken()
      return
    }
    
    // Token不存在或已过期，进行静默登录
    if (token && isTokenExpired()) {
      console.log('Token已过期，重新登录')
    } else {
      console.log('无Token，开始微信静默登录')
    }
    performWxLogin()
  }

  // 验证token有效性
  function validateToken() {
    userStore.getInfo().then(() => {
      console.log('Token有效，用户已登录')
      // Token有效，无需重新登录
      console.log('=== 静默登录流程完成（token验证成功）===')
      setSilentLoginProgress(false)
    }).catch((error) => {
      console.log('Token无效，重新登录')
      // Token无效，清除并重新登录
      userStore.logOut().then(() => {
        performWxLogin()
      })
    })
  }

  // 执行微信登录
  function performWxLogin() {
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        console.log('获取微信code成功:', loginRes.code)
        
        if (!loginRes.code) {
          console.error('获取微信code失败')
          handleLoginError(new Error('获取微信授权码失败'))
          return
        }
        
        // 调用后端接口进行登录
        userStore.wxLogin(loginRes.code).then((userData) => {
          console.log('微信登录成功:', userData)
          
          // 登录成功后的处理
          handleLoginSuccess(userData)
          
        }).catch((error) => {
          console.error('微信登录失败:', error)
          handleLoginError(error)
        })
      },
      fail: (error) => {
        console.error('获取微信code失败:', error)
        handleLoginError(error)
      }
    })
  }

  // 登录成功处理
  function handleLoginSuccess(userData) {
    // 静默登录成功，不显示提示，提供更好的用户体验
    console.log('静默登录成功:', userData)
    
    // 如果是新用户，可以在这里添加引导逻辑
    if (userData.isNewUser) {
      console.log('新用户首次登录，准备引导流程')
      // 设置新用户标识，首页可以根据这个状态显示引导
      uni.setStorageSync('showNewUserGuide', true)
    }
    
    // 获取用户详细信息
    userStore.getInfo().then(() => {
      // 静默登录完全成功
      console.log('=== 静默登录流程完成 ===')
      setSilentLoginProgress(false)
    }).catch((error) => {
      console.error('获取用户详细信息失败:', error)
      console.log('=== 静默登录流程结束（获取用户信息失败）===')
      setSilentLoginProgress(false)
    })
  }

  // 登录失败处理
  function handleLoginError(error) {
    console.error('微信静默登录失败:', error)
    
    // 静默登录失败时的处理策略
    if (error.message && error.message.includes('网络')) {
      // 网络错误，可以稍后重试
      console.log('网络错误，将在页面显示时重试')
      uni.setStorageSync('needRetryLogin', true)
    } else {
      // 其他错误，记录日志但不影响用户使用
      console.log('静默登录失败，用户可在需要时手动登录')
    }
    
    // 静默登录结束
    console.log('=== 静默登录流程结束（登录失败）===')
    setSilentLoginProgress(false)
    
    // 不显示错误提示，保持静默特性
    // 用户在需要登录的功能中会有相应的登录引导
  }
</script>

<style lang="scss">
  @import '@/static/scss/index.scss'
</style>
