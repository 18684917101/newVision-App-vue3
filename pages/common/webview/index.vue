<template>
  <view class="webview-container">
    <view v-if="!params.url" class="loading-container">
      <text class="loading-text">正在加载文章...</text>
    </view>
    <web-view 
      v-else
      :webview-styles="webviewStyles" 
      :src="decodedUrl"
      @message="handleMessage"
      @error="handleError"
    ></web-view>
  </view>
</template>

<script>
  export default {
    data() {
      return {
        params: {},
        webviewStyles: {
          progress: {
            color: "#138aec"
          }
        }
      }
    },
    computed: {
      decodedUrl() {
        if (!this.params.url) return ''
        try {
          const decoded = decodeURIComponent(this.params.url)
          console.log('解码URL:', decoded)
          
          // 如果是本地路径，在微信小程序中需要特殊处理
          if (decoded.startsWith('/static/')) {
            //#ifdef MP-WEIXIN
            // 微信小程序中需要使用相对路径
            return decoded.substring(1) // 去掉开头的 /
            //#endif
            
            //#ifdef APP-PLUS
            // App中使用plus API处理本地文件
            if (typeof plus !== 'undefined') {
              const baseUrl = plus.io.convertLocalFileSystemURL('_www')
              return baseUrl + decoded
            }
            //#endif
            
            return decoded
          }
          
          return decoded
        } catch (error) {
          console.error('URL解码失败:', error)
          return this.params.url
        }
      }
    },
    props: {
      src: {
        type: [String],
        default: null
      }
    },
    onLoad(event) {
      console.log('=== webview页面加载开始 ===')
      console.log('webview页面加载参数:', event)
      console.log('原始URL参数:', event.url)
      console.log('原始title参数:', event.title)
      
      this.params = event
      
      if (event.title) {
        const decodedTitle = decodeURIComponent(event.title)
        console.log('解码后的标题:', decodedTitle)
        uni.setNavigationBarTitle({
          title: decodedTitle
        })
      } else {
        uni.setNavigationBarTitle({
          title: '公众号文章'
        })
      }
      
      if (event.url) {
        const decodedUrl = decodeURIComponent(event.url)
        console.log('准备加载URL:', decodedUrl)
        console.log('URL是否以https开头:', decodedUrl.startsWith('https'))
        console.log('URL格式验证:', /^https?:\/\//.test(decodedUrl))
      } else {
        console.error('没有接收到URL参数')
      }
      
      console.log('=== webview页面加载完成 ===')
    },
    methods: {
      handleMessage(event) {
        console.log('webview消息:', event)
      },
      handleError(event) {
        console.error('webview加载错误:', event)
        
        // 特殊处理重复 web-view 错误
        if (event.detail && event.detail.errMsg && 
            event.detail.errMsg.includes('could not insert two web-view')) {
          uni.showModal({
            title: '提示',
            content: '页面正在加载中，请稍后再试',
            showCancel: false,
            success: () => {
              // 返回上一页
              uni.navigateBack()
            }
          })
          return
        }
        
        uni.showToast({
          title: '页面加载失败',
          icon: 'none'
        })
      }
    }
  }
</script>

<style>
.webview-container {
  width: 100%;
  height: 100vh;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.loading-text {
  color: #999;
  font-size: 28rpx;
}
</style>
