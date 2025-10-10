<template>
  <view class="appointment-page">
    <!-- 自定义导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-btn" @click="onBackClick">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">预约挂号</text>
        <view style="width: 64rpx;"></view>
      </view>
    </view>
    
    <view class="content">
      <view class="department-section">
        <text class="section-title">选择科室</text>
        <view class="department-list" v-if="!loading">
          <view 
            v-for="(dept, index) in departmentList" 
            :key="dept.deptId"
            class="department-item"
            @click="onDepartmentClick(dept)"
          >
            <view class="dept-content">
              <text class="dept-name">{{ dept.deptName }}</text>
              <text class="dept-leader" v-if="dept.leader">负责人：{{ dept.leader }}</text>
            </view>
            <text class="arrow-icon">→</text>
          </view>
        </view>
        
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-container">
          <text class="loading-text">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-if="!loading && departmentList.length === 0" class="empty-container">
          <text class="empty-text">暂无科室信息</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getDeptList } from '@/api/department'
import { requireLogin } from '@/utils/login-guard'
import { useUserStore } from '@/store'

// 响应式数据
const loading = ref(true)
const departmentList = reactive([])
const userStore = useUserStore()

// 页面显示时检查登录状态
onShow(async () => {
  try {
    const result = await requireLogin('预约挂号')
    
    if (result === true) {
      // 已登录，加载科室列表
      loadDepartments()
    } else if (result && result.needLogin && result.code) {
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
        
        // 登录成功，加载科室列表
        loadDepartments()
        
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

// 页面加载时不自动获取科室列表，等待登录验证
onMounted(() => {
  // 移除自动加载，改为在登录验证后加载
})

// 获取科室列表
const loadDepartments = async () => {
  try {
    loading.value = true
    const response = await getDeptList({
      pageNum: 1,
      pageSize: 20,
      parentId: 100 // 根据API示例，获取parentId为100的科室
    })
    
    if (response.code === 200) {
      // 清空原有数据并添加新数据
      departmentList.splice(0, departmentList.length, ...response.data)
    } else {
      uni.showToast({
        title: response.msg || '获取科室信息失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取科室列表失败:', error)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 返回按钮点击
const onBackClick = () => {
  uni.navigateBack()
}

// 科室点击事件
const onDepartmentClick = (dept) => {
  // 跳转到医生列表页面
  uni.navigateTo({
    url: `/pages/doctor-list/index?deptId=${dept.deptId}&deptName=${dept.deptName}`
  })
}
</script>

<style lang="scss" scoped>
.appointment-page {
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
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.content {
  padding: 32rpx;
}

.section-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 32rpx;
}

.department-section {
  margin-bottom: 48rpx;
}

.department-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.department-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.department-item:active {
  background-color: rgba(19, 138, 236, 0.1);
  transform: scale(0.98);
}

.dept-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.dept-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #1a1a1a;
}

.dept-leader {
  font-size: 24rpx;
  color: #6b7280;
}

.arrow-icon {
  font-size: 32rpx;
  color: rgba(26, 26, 26, 0.3);
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
}

.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
}
</style>
