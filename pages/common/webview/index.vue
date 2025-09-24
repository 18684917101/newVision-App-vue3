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
        uni.showToast({
          title: '文章加载失败',
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
