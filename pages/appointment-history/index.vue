<template>
  <view class="appointment-history-page">
    <!-- 自定义导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-btn" @click="onBackClick">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">挂号记录</text>
        <view style="width: 64rpx;"></view>
      </view>
    </view>

    <view class="content">
      <!-- 状态筛选 -->
      <view class="filter-tabs">
        <view 
          v-for="(tab, index) in statusTabs" 
          :key="index"
          class="filter-tab"
          :class="{ 'tab-active': activeTab === index }"
          @click="onTabClick(index)"
        >
          <text class="tab-text">{{ tab.name }}</text>
        </view>
      </view>

      <!-- 预约记录列表 -->
      <view class="appointment-list" v-if="!loading">
        <view 
          v-for="(appointment, index) in filteredAppointments" 
          :key="index"
          class="appointment-item"
          @click="onAppointmentClick(appointment)"
        >
          <view class="appointment-header">
            <text class="appointment-date">{{ appointment.date }}</text>
            <view class="appointment-status" :class="getStatusClass(appointment.status)">
              <text class="status-text">{{ getStatusText(appointment.status) }}</text>
            </view>
          </view>
          
          <view class="appointment-info">
            <text class="doctor-name">{{ appointment.doctorName }}</text>
            <text class="department">{{ appointment.department }}</text>
            <text class="appointment-time">{{ appointment.time }}</text>
          </view>
          
          <view class="appointment-actions" v-if="appointment.status === 'BOOKED'">
            <view class="action-btn cancel-btn" @click.stop="onCancelAppointment(appointment)">
              <text class="action-text">取消预约</text>
            </view>
            <view class="action-btn reschedule-btn" @click.stop="onRescheduleAppointment(appointment)">
              <text class="action-text">改期</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && filteredAppointments.length === 0" class="empty-container">
        <text class="empty-icon">📅</text>
        <text class="empty-text">暂无{{ statusTabs[activeTab].name }}记录</text>
        <view class="empty-action" @click="goToAppointment">
          <text class="action-text">立即预约</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getMyAppointments, cancelAppointment } from '@/api/appointment'

// 响应式数据
const loading = ref(false)
const activeTab = ref(0)

// 状态选项卡（匹配API返回的状态值）
const statusTabs = reactive([
  { name: '全部', value: 'all' },
  { name: '已预约', value: 'BOOKED' },
  { name: '已取消', value: 'CANCELLED' },
  { name: '已完成', value: 'COMPLETED' }
])

// 预约记录数据
const appointmentList = reactive([])

// 过滤后的预约记录
const filteredAppointments = computed(() => {
  const currentTab = statusTabs[activeTab.value]
  if (currentTab.value === 'all') {
    return appointmentList
  }
  return appointmentList.filter(item => item.status === currentTab.value)
})

// 页面加载
onMounted(() => {
  loadAppointments()
})

// 加载预约记录
const loadAppointments = async () => {
  loading.value = true
  
  try {
    console.log('加载我的预约记录...')
    const response = await getMyAppointments()
    
    if (response.code === 200 && response.data) {
      const appointments = Array.isArray(response.data) ? response.data : []
      
      // 转换数据格式以适配页面显示
      const formattedAppointments = appointments.map(appointment => ({
        id: appointment.id,
        appointmentNo: appointment.appointmentNo,
        date: formatAppointmentDate(appointment.appointmentStartTime),
        time: formatAppointmentTime(appointment.appointmentStartTime, appointment.appointmentEndTime),
        doctorName: appointment.doctorName,
        department: appointment.departmentName,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        appointmentFee: appointment.appointmentFee,
        patientName: appointment.customerAccountName,
        roomNo: appointment.roomNo,
        createTime: appointment.createTime,
        // 原始数据保留
        original: appointment
      }))
      
      appointmentList.splice(0, appointmentList.length, ...formattedAppointments)
      console.log('获取到预约记录:', formattedAppointments.length, '条')
    } else {
      console.warn('获取预约记录失败:', response.msg)
      uni.showToast({
        title: response.msg || '获取预约记录失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取预约记录失败:', error)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 格式化预约日期
const formatAppointmentDate = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  const date = new Date(dateTimeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化预约时间
const formatAppointmentTime = (startTime, endTime) => {
  if (!startTime) return ''
  
  const start = new Date(startTime)
  const startHour = String(start.getHours()).padStart(2, '0')
  const startMin = String(start.getMinutes()).padStart(2, '0')
  
  if (endTime) {
    const end = new Date(endTime)
    const endHour = String(end.getHours()).padStart(2, '0')
    const endMin = String(end.getMinutes()).padStart(2, '0')
    return `${startHour}:${startMin}-${endHour}:${endMin}`
  }
  
  return `${startHour}:${startMin}`
}

// 选项卡点击
const onTabClick = (index) => {
  activeTab.value = index
}

// 返回按钮
const onBackClick = () => {
  uni.navigateBack()
}

// 预约记录点击
const onAppointmentClick = (appointment) => {
  let content = `预约单号：${appointment.appointmentNo}\n医生：${appointment.doctorName}\n科室：${appointment.department}\n就诊时间：${appointment.date} ${appointment.time}\n患者：${appointment.patientName}`
  
  if (appointment.appointmentFee) {
    content += `\n挂号费：¥${appointment.appointmentFee}`
  }
  
  if (appointment.roomNo) {
    content += `\n诊室：${appointment.roomNo}`
  }
  
  if (appointment.paymentStatus) {
    const paymentText = appointment.paymentStatus === 'PAID' ? '已支付' : '未支付'
    content += `\n支付状态：${paymentText}`
  }
  
  uni.showModal({
    title: '预约详情',
    content: content,
    showCancel: false
  })
}

// 取消预约
const onCancelAppointment = async (appointment) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消此次预约吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({
            title: '取消中...'
          })
          
          const response = await cancelAppointment(appointment.id)
          
          if (response.code === 200) {
            // 更新本地状态
            appointment.status = 'CANCELLED'
            uni.hideLoading()
            uni.showToast({
              title: '已取消预约',
              icon: 'success'
            })
          } else {
            uni.hideLoading()
            uni.showToast({
              title: response.msg || '取消失败',
              icon: 'none'
            })
          }
        } catch (error) {
          uni.hideLoading()
          console.error('取消预约失败:', error)
          uni.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 改期预约
const onRescheduleAppointment = (appointment) => {
  uni.showToast({
    title: '改期功能开发中',
    icon: 'none'
  })
}

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 'BOOKED':
      return 'status-booked'
    case 'COMPLETED':
      return 'status-completed'
    case 'CANCELLED':
      return 'status-cancelled'
    default:
      return ''
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'BOOKED':
      return '已预约'
    case 'COMPLETED':
      return '已完成'
    case 'CANCELLED':
      return '已取消'
    default:
      return '未知状态'
  }
}

// 跳转到预约页面
const goToAppointment = () => {
  uni.navigateTo({
    url: '/pages/appointment/index'
  })
}
</script>

<style lang="scss" scoped>
.appointment-history-page {
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

.filter-tabs {
  display: flex;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.tab-active {
  background-color: #138aec;
}

.tab-text {
  font-size: 28rpx;
  color: #6b7280;
}

.tab-active .tab-text {
  color: #ffffff;
  font-weight: 500;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.appointment-item {
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.appointment-item:active {
  transform: scale(0.98);
}

.appointment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.appointment-date {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.appointment-status {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}

.status-booked {
  background-color: #dbeafe;
}

.status-completed {
  background-color: #dcfce7;
}

.status-cancelled {
  background-color: #fef2f2;
}

.status-text {
  font-size: 20rpx;
  font-weight: 500;
  color: #2563eb;
}

.status-completed .status-text {
  color: #166534;
}

.status-cancelled .status-text {
  color: #991b1b;
}

.appointment-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.doctor-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #138aec;
}

.department {
  font-size: 24rpx;
  color: #6b7280;
}

.appointment-time {
  font-size: 24rpx;
  color: #6b7280;
}

.appointment-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  border: 2rpx solid;
}

.cancel-btn {
  border-color: #ef4444;
}

.cancel-btn .action-text {
  color: #ef4444;
  font-size: 24rpx;
}

.reschedule-btn {
  border-color: #138aec;
}

.reschedule-btn .action-text {
  color: #138aec;
  font-size: 24rpx;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
  margin-bottom: 48rpx;
}

.empty-action {
  background-color: #138aec;
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
}

.empty-action .action-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
}
</style>
