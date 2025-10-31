<template>
  <view class="profile-page">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-btn" @click="onBackClick">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">个人中心</text>
        <view style="width: 64rpx;"></view>
      </view>
    </view>

    <view class="content">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="user-avatar" @click="handleToAvatar">
          <image 
            :src="avatar || '/static/images/profile.jpg'" 
            class="avatar-image" 
            mode="aspectFill"
          />
        </view>
        <view class="user-info">
          <view v-if="!name" class="login-prompt" @click="handleToLogin">
            <text class="login-text">点击登录</text>
          </view>
          <view v-else class="user-details">
            <text class="user-name">{{ nickname || name }}</text>
            <text class="user-phone" v-if="phone">{{ phone }}</text>
            <!-- 
            <view v-else class="bind-phone-tip" @click="handleBindPhone">
              <text class="bind-text">绑定手机号</text>
            </view>
            -->
          </view>
        </view>
      </view>

      <!-- 常用功能标题 -->
      <view class="section-header">
        <text class="section-title">常用功能</text>
      </view>

      <!-- 功能网格 -->
      <view class="function-grid">
        <view class="function-item" @click="handleAppointmentRecord">
          <view class="function-icon-wrapper">
            <text class="function-icon">📋</text>
          </view>
          <text class="function-title">挂号记录</text>
        </view>
        
        <view class="function-item" @click="handleHospitalInfo">
          <view class="function-icon-wrapper">
            <text class="function-icon">🏥</text>
          </view>
          <text class="function-title">医院介绍</text>
        </view>
        
        <view class="function-item" @click="handleDoctorTeam">
          <view class="function-icon-wrapper">
            <text class="function-icon">👥</text>
          </view>
          <text class="function-title">专家团队</text>
        </view>
        
        <view class="function-item" @click="handleMyopiaSurgery">
          <view class="function-icon-wrapper">
            <text class="function-icon">👁️</text>
          </view>
          <text class="function-title">近视手术</text>
        </view>
        
        <!-- 
        <view class="function-item" @click="handlePatientManagement">
          <view class="function-icon-wrapper">
            <text class="function-icon">👤</text>
          </view>
          <text class="function-title">就诊人管理</text>
        </view>
        
        <view class="function-item" @click="handleSettings">
          <view class="function-icon-wrapper">
            <text class="function-icon">⚙️</text>
          </view>
          <text class="function-title">设置</text>
        </view>
        -->
      </view>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store'
import { computed, getCurrentInstance } from "vue"
import { onShow } from '@dcloudio/uni-app'
import { requireLogin } from '@/utils/login-guard'

const { proxy } = getCurrentInstance()
const userStore = useUserStore()

// 响应式用户数据
const name = computed(() => userStore.name)
const avatar = computed(() => userStore.avatar)
const nickname = computed(() => userStore.nickname)
const phone = computed(() => userStore.phone)
const isNewUser = computed(() => userStore.isNewUser)

// 页面显示时检查登录状态
onShow(async () => {
  try {
    const result = await requireLogin('访问个人中心')
    
    if (result && result.needLogin && result.code) {
      // 需要登录并获取到了微信code
      try {
        uni.showLoading({
          title: '登录中...'
        })
        
        const userData = await userStore.wxLogin(result.code)
        uni.hideLoading()
        
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
      } catch (error) {
        uni.hideLoading()
        console.error('登录失败:', error)
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
        
        // 登录失败，返回首页
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index'
          })
        }, 1500)
      }
    }
  } catch (error) {
    // 用户取消登录，返回首页
    console.log('用户取消登录')
    uni.switchTab({
      url: '/pages/index'
    })
  }
})

// 返回按钮点击
const onBackClick = () => {
  uni.navigateBack()
}

// 微信登录
const handleToLogin = () => {
  // 在微信小程序中直接进行微信登录
  //#ifdef MP-WEIXIN
  wxLogin()
  //#endif
  
  // 非微信小程序环境提示
  //#ifndef MP-WEIXIN
  uni.showToast({
    title: '请在微信小程序中使用',
    icon: 'none'
  })
  //#endif
}

// 微信登录方法
const wxLogin = () => {
  uni.showLoading({
    title: '登录中...'
  })
  
  uni.login({
    provider: 'weixin',
    success: (loginRes) => {
      console.log('获取微信code成功:', loginRes.code)
      
      // 调用后端接口进行登录
      userStore.wxLogin(loginRes.code).then((userData) => {
        uni.hideLoading()
        uni.showToast({
          title: userData.isNewUser ? '欢迎新用户！' : '登录成功',
          icon: 'success',
          duration: 2000
        })
      }).catch((error) => {
        uni.hideLoading()
        console.error('微信登录失败:', error)
        uni.showModal({
          title: '登录失败',
          content: '微信登录失败，请重试',
          showCancel: false
        })
      })
    },
    fail: (error) => {
      uni.hideLoading()
      console.error('获取微信code失败:', error)
      uni.showModal({
        title: '登录失败',
        content: '获取微信授权失败，请重试',
        showCancel: false
      })
    }
  })
}

// 跳转到头像页面
const handleToAvatar = () => {
  if (!name.value) {
    handleToLogin()
    return
  }
  proxy.$tab.navigateTo('/pages/mine/avatar/index')
}

// 绑定手机号 - 暂时注释
/*
const handleBindPhone = () => {
  uni.showToast({
    title: '绑定手机号功能开发中',
    icon: 'none'
  })
}
*/

// 挂号记录
const handleAppointmentRecord = () => {
  if (!name.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  uni.navigateTo({
    url: '/pages/appointment-history/index'
  })
}

// 医院介绍
const handleHospitalInfo = () => {
  uni.navigateTo({
    url: '/pages/hospital/index'
  })
}

// 专家团队
const handleDoctorTeam = () => {
  uni.navigateTo({
    url: '/pages/expert-team/index'
  })
}

// 近视手术
const handleMyopiaSurgery = () => {
  uni.navigateTo({
    url: '/pages/myopia-surgery/index'
  })
}



// 就诊人管理 - 暂时注释
/*
const handlePatientManagement = () => {
  if (!name.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  uni.showToast({
    title: '就诊人管理功能开发中',
    icon: 'none'
  })
}
*/

// 设置 - 暂时注释
/*
const handleSettings = () => {
  uni.showActionSheet({
    itemList: ['个人信息', '应用设置', '常见问题', '关于我们', '退出登录'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          if (name.value) {
            proxy.$tab.navigateTo('/pages/mine/info/index')
          } else {
            handleToLogin()
          }
          break
        case 1:
          proxy.$tab.navigateTo('/pages/mine/setting/index')
          break
        case 2:
          proxy.$tab.navigateTo('/pages/mine/help/index')
          break
        case 3:
          proxy.$tab.navigateTo('/pages/mine/about/index')
          break
        case 4:
          if (name.value) {
            handleLogout()
          } else {
            uni.showToast({
              title: '您还未登录',
              icon: 'none'
            })
          }
          break
      }
    }
  })
}
*/

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logOut().then(() => {
          uni.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          // 可以选择跳转到首页或登录页
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/index'
            })
          }, 1500)
        }).catch((error) => {
          console.error('退出登录失败:', error)
          uni.showToast({
            title: '退出失败',
            icon: 'none'
          })
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.profile-page {
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
  padding: 32rpx;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 32rpx;
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 48rpx;
}

.user-avatar {
  position: relative;
}

.avatar-image {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 4rpx solid #e5e7eb;
}

.user-info {
  flex: 1;
}

.login-prompt {
  padding: 16rpx 0;
}

.login-text {
  font-size: 36rpx;
  color: #138aec;
  font-weight: 500;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.user-phone {
  font-size: 28rpx;
  color: #6b7280;
}

.bind-phone-tip {
  padding: 8rpx 0;
}

.bind-text {
  font-size: 24rpx;
  color: #138aec;
}

.section-header {
  padding: 48rpx 0 32rpx 0;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32rpx;
}

.function-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  padding: 48rpx 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.function-item:active {
  transform: scale(0.95);
  background-color: rgba(19, 138, 236, 0.05);
}

.function-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background-color: rgba(19, 138, 236, 0.1);
  margin-bottom: 24rpx;
}

.function-icon {
  font-size: 60rpx;
}

.function-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
  text-align: center;
}
</style>