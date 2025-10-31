<template>
  <view class="myopia-surgery-page">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-btn" @click="onBackClick">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">近视手术</text>
        <view style="width: 64rpx;"></view>
      </view>
    </view>

    <view class="content">
      <image 
        v-for="(img, index) in images" 
        :key="index"
        :src="img.src" 
        :alt="img.alt"
        class="surgery-image"
        mode="widthFix"
        @error="handleImageError"
        @load="handleImageLoad"
      />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 图片数据
const images = ref([
  {
    src: 'https://xcx.shdqyk.com/image/qfm_01.png',
    alt: 'qfm_01'
  },
  {
    src: 'https://xcx.shdqyk.com/image/qfm_02.png',
    alt: 'qfm_02'
  },
  {
    src: 'https://xcx.shdqyk.com/image/qfm_03.png',
    alt: 'qfm_03'
  },
  {
    src: 'https://xcx.shdqyk.com/image/qfm_04.png',
    alt: 'qfm_04'
  }
  ,
  {
    src: 'https://xcx.shdqyk.com/image/qfm_05.png',
    alt: 'qfm_05'
  }
  ,
  {
    src: 'https://xcx.shdqyk.com/image/qfm_06.png',
    alt: 'qfm_06'
  }
  ,
  {
    src: 'https://xcx.shdqyk.com/image/qfm_07.png',
    alt: 'qfm_07'
  }
  ,
  {
    src: 'https://xcx.shdqyk.com/image/qfm_08.png',
    alt: 'qfm_08'
  }
  ,
  {
    src: 'https://xcx.shdqyk.com/image/qfm_09.png',
    alt: 'qfm_09'
  }


])

// 返回按钮点击
const onBackClick = () => {
  uni.navigateBack()
}

// 图片加载失败处理
const handleImageError = (e) => {
  console.error('图片加载失败:', e)
}

// 图片加载成功处理
const handleImageLoad = (e) => {
  console.log('图片加载成功:', e)
}
</script>

<style lang="scss" scoped>
.myopia-surgery-page {
  background-color: #f6f7f8;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgba(246, 247, 248, 0.8);
  backdrop-filter: blur(10rpx);
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.1);
  padding-top: calc(20rpx + var(--status-bar-height));
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
}

.back-icon {
  font-size: 36rpx;
  color: #1a1a1a;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.content {
  padding: 0;
}

.surgery-image {
  width: 100%;
  display: block;
  margin: 0;
  padding: 0;
  border: 0;
}
</style>