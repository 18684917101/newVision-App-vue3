<script setup>
  import config from './config'
  import { getToken, isTokenExpired } from '@/utils/auth'
  import { useConfigStore, useUserStore } from '@/store'
  import { getCurrentInstance } from "vue"
  import { onLaunch } from '@dcloudio/uni-app'
  
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

  // 检查登录状态（仅记录，不执行自动登录）
  function checkLoginStatus() {
    const token = getToken()
    
    if (token && !isTokenExpired()) {
      console.log('应用启动：用户已登录')
    } else {
      console.log('应用启动：用户未登录，等待手动登录')
    }
  }

</script>

<style lang="scss">
  @import '@/static/scss/index.scss'
</style>
