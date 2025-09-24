<template>
  <view class="appointment-detail-page">
    <!-- 自定义导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-btn" @click="onBackClick">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">预约详情</text>
        <view style="width: 64rpx;"></view>
      </view>
    </view>
    
    <view class="content">
      <!-- 医生信息 -->
      <view class="doctor-card">
        <image class="doctor-avatar" src="/static/images/profile.jpg" mode="aspectFill"></image>
        <view class="doctor-info">
          <text class="doctor-name">{{ doctorName }}</text>
          <text class="doctor-dept">{{ deptName }}</text>
          <text class="doctor-desc">{{ doctorTitle }}{{ doctorExperience ? ` | 从业${doctorExperience}年` : '' }}{{ doctorRating ? ` | 好评率${doctorRating}%` : '' }}</text>
          <text class="doctor-specialty" v-if="doctorSpecialty">擅长：{{ doctorSpecialty }}</text>
        </view>
      </view>
      
      <!-- 选择就诊日期 -->
      <view class="date-section">
        <text class="section-title">选择就诊日期</text>
        <view class="date-picker">
          <picker mode="date" :value="selectedDate" @change="onDateChange" :start="minDate" :end="maxDate">
            <view class="picker-input">
              <text class="date-text">{{ formatDate(selectedDate) }}</text>
              <text class="arrow-icon">→</text>
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 选择时间段 -->
      <view class="time-section">
        <text class="section-title">选择时间段</text>
        
        <!-- 加载状态 -->
        <view v-if="slotsLoading" class="loading-container">
          <text class="loading-text">获取号源中...</text>
        </view>
        
        <!-- 号源列表 -->
        <view v-else-if="availableSlots.length > 0" class="time-slots">
          <view 
            v-for="(slot, index) in availableSlots" 
            :key="slot.id"
            class="time-slot"
            :class="{ 'slot-selected': selectedSlot && selectedSlot.id === slot.id, 'slot-disabled': !isSlotAvailable(slot) }"
            @click="onSlotClick(slot)"
          >
            <text class="slot-time">{{ formatSlotTime(slot) }}</text>
            <text class="slot-info">{{ formatSlotInfo(slot) }}</text>
            <text class="slot-status">{{ getSlotStatus(slot) }}</text>
          </view>
        </view>
        
        <!-- 无号源状态 -->
        <view v-else class="empty-slots">
          <text class="empty-text">该日期暂无可预约号源</text>
          <text class="empty-hint">请选择其他日期</text>
        </view>
      </view>
      
      <!-- 患者信息 -->
      <view class="patient-section">
        <text class="section-title">患者信息</text>
        <view class="form-item">
          <text class="form-label">姓名</text>
          <input class="form-input" v-model="patientInfo.name" placeholder="请输入患者姓名" />
        </view>
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input class="form-input" v-model="patientInfo.phone" placeholder="请输入手机号码" />
        </view>
        <view class="form-item">
          <text class="form-label">症状描述</text>
          <textarea class="form-textarea" v-model="patientInfo.symptoms" placeholder="请简单描述症状（选填）" />
        </view>
      </view>
      
      <!-- 预约须知 -->
      <view class="notice-section">
        <text class="section-title">预约须知</text>
        <view class="notice-content">
          <text class="notice-item">• 请提前15分钟到达医院</text>
          <text class="notice-item">• 携带有效身份证件</text>
          <text class="notice-item">• 如需取消请提前2小时联系医院</text>
          <text class="notice-item">• 预约成功后请按时就诊</text>
        </view>
      </view>
    </view>
    
    <!-- 底部预约按钮 -->
    <view class="footer">
      <view class="appointment-summary">
        <text class="summary-text">{{ doctorName }} | {{ formatDate(selectedDate) }} {{ selectedTimeSlotText }}</text>
        <text v-if="selectedSlot && selectedSlot.slotFee > 0" class="fee-text">挂号费：¥{{ selectedSlot.slotFee }}</text>
        <text v-if="selectedSlot && selectedSlot.location" class="location-text">就诊地点：{{ selectedSlot.location }}</text>
        <text v-if="selectedSlot && selectedSlot.roomNo" class="room-text">诊室：{{ selectedSlot.roomNo }}</text>
      </view>
      <view 
        class="submit-btn"
        :class="{ 'btn-disabled': !canSubmit }"
        @click="onSubmitAppointment"
      >
        <text class="submit-text">{{ selectedSlot && selectedSlot.slotFee > 0 ? `确认预约 ¥${selectedSlot.slotFee}` : '确认预约' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { submitAppointment } from '@/api/department'
import { getSlotsByDoctorAndDate, createAppointment } from '@/api/appointment'
import { useUserStore } from '@/store'

// 响应式数据
const userStore = useUserStore()
const doctorId = ref('')
const doctorName = ref('')
const deptName = ref('')
const doctorTitle = ref('')
const doctorSpecialty = ref('')
const doctorExperience = ref('')
const doctorRating = ref('')
const selectedDate = ref('')
const minDate = ref('')
const maxDate = ref('')
const slotsLoading = ref(false)
const availableSlots = reactive([])
const selectedSlot = ref(null)
const slotsCache = reactive(new Map()) // 号源缓存
const lastLoadKey = ref('') // 上次加载的缓存键

// 患者信息
const patientInfo = reactive({
  name: '',
  phone: '',
  symptoms: ''
})

// 计算属性
const selectedTimeSlotText = computed(() => {
  return selectedSlot.value ? formatSlotTime(selectedSlot.value) : ''
})

const canSubmit = computed(() => {
  return patientInfo.name && 
         patientInfo.phone && 
         selectedDate.value && 
         selectedSlot.value
})

// 页面加载时获取参数
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  
  doctorId.value = options.doctorId || ''
  doctorName.value = decodeURIComponent(options.doctorName || '')
  deptName.value = decodeURIComponent(options.deptName || '')
  doctorTitle.value = decodeURIComponent(options.doctorTitle || '医师')
  doctorSpecialty.value = decodeURIComponent(options.doctorSpecialty || '')
  doctorExperience.value = options.doctorExperience || ''
  doctorRating.value = options.doctorRating || ''
  
  // 设置日期范围（今天到30天后）
  const today = new Date()
  const maxDay = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  minDate.value = formatDateValue(today)
  maxDate.value = formatDateValue(maxDay)
  
  // 先设置日期，再设置watch监听器，避免重复调用
  selectedDate.value = minDate.value
  
  // 设置watch监听器后，手动调用一次获取号源
  setupDateWatcher()
  
  // 初始加载号源
  loadAvailableSlots()
})

// 设置日期监听器
const setupDateWatcher = () => {
  // 监听日期变化，重新获取号源
  watch(selectedDate, (newDate, oldDate) => {
    // 只有当日期真正变化时才重新获取号源
    if (newDate && oldDate && newDate !== oldDate && doctorId.value) {
      console.log(`日期变化: ${oldDate} -> ${newDate}`)
      selectedSlot.value = null // 重置选择的号源
      loadAvailableSlots()
    }
  })
}

// 获取可用号源
const loadAvailableSlots = async () => {
  if (!doctorId.value || !selectedDate.value) return
  
  // 生成缓存键
  const cacheKey = `${doctorId.value}_${selectedDate.value}`
  
  // 检查是否正在加载相同的数据，避免重复调用
  if (slotsLoading.value && lastLoadKey.value === cacheKey) {
    console.log('正在加载相同数据，跳过重复调用')
    return
  }
  
  // 检查缓存
  if (slotsCache.has(cacheKey)) {
    console.log('使用缓存的号源数据:', cacheKey)
    const cachedSlots = slotsCache.get(cacheKey)
    availableSlots.splice(0, availableSlots.length, ...cachedSlots)
    return
  }
  
  try {
    slotsLoading.value = true
    lastLoadKey.value = cacheKey
    availableSlots.splice(0, availableSlots.length) // 清空现有数据
    
    // 调用真实API接口
    console.log(`获取号源: 医生ID=${doctorId.value}, 日期=${selectedDate.value}`)
    
    try {
      const response = await getSlotsByDoctorAndDate(doctorId.value, selectedDate.value)
      
      if (response.code === 200 && response.data) {
        const slots = Array.isArray(response.data) ? response.data : []
        availableSlots.push(...slots)
        
        // 缓存号源数据（缓存5分钟）
        slotsCache.set(cacheKey, [...slots])
        setTimeout(() => {
          slotsCache.delete(cacheKey)
          console.log('清除号源缓存:', cacheKey)
        }, 5 * 60 * 1000)
        
        console.log('获取到真实号源:', slots.length, '个')
        console.log('号源数据:', slots)
        return
      } else {
        console.warn('API返回错误:', response.msg)
        throw new Error(response.msg || 'API调用失败')
      }
    } catch (apiError) {
      console.warn('API调用失败，使用模拟数据:', apiError)
      
      // 显示错误提示但不阻断用户操作
      uni.showToast({
        title: '获取号源失败，显示模拟数据',
        icon: 'none',
        duration: 2000
      })
      
      // 如果API失败，使用模拟数据
      console.log('使用模拟号源数据')
      const mockSlots = generateMockSlots()
      availableSlots.push(...mockSlots)
      
      // 缓存模拟数据（缓存时间较短）
      slotsCache.set(cacheKey, [...mockSlots])
      setTimeout(() => {
        slotsCache.delete(cacheKey)
      }, 2 * 60 * 1000)
    }
    
  } catch (error) {
    console.error('获取号源失败:', error)
    uni.showToast({
      title: '获取号源失败',
      icon: 'none'
    })
  } finally {
    slotsLoading.value = false
    lastLoadKey.value = ''
  }
}

// 生成模拟号源数据（与真实API数据结构保持一致）
const generateMockSlots = () => {
  const dateStr = selectedDate.value
  
  const mockSlots = [
    {
      createBy: "admin",
      createTime: `${dateStr} 14:08:47`,
      updateBy: null,
      updateTime: `${dateStr} 14:08:47`,
      remark: null,
      id: 1,
      doctorId: parseInt(doctorId.value) || 100,
      doctorName: doctorName.value || "张三",
      departmentId: 101,
      departmentName: deptName.value || "屈光科",
      startTime: `${dateStr} 08:00:00`,
      endTime: `${dateStr} 09:00:00`,
      capacity: 20,
      bookedCount: 15,
      slotFee: 50.00,
      slotType: "NORMAL",
      location: "浦江院区",
      roomNo: "304",
      status: "OPEN",
      closed: false,
      full: false,
      open: true,
      cancelled: false,
      availableCount: 5,
      normalSlot: true,
      expertSlot: false,
      specialSlot: false
    },
    {
      createBy: "admin",
      createTime: `${dateStr} 14:08:47`,
      updateBy: null,
      updateTime: `${dateStr} 14:08:47`,
      remark: null,
      id: 2,
      doctorId: parseInt(doctorId.value) || 100,
      doctorName: doctorName.value || "张三",
      departmentId: 101,
      departmentName: deptName.value || "屈光科",
      startTime: `${dateStr} 09:00:00`,
      endTime: `${dateStr} 10:00:00`,
      capacity: 20,
      bookedCount: 8,
      slotFee: 50.00,
      slotType: "NORMAL",
      location: "浦江院区",
      roomNo: "304",
      status: "OPEN",
      closed: false,
      full: false,
      open: true,
      cancelled: false,
      availableCount: 12,
      normalSlot: true,
      expertSlot: false,
      specialSlot: false
    },
    {
      createBy: "admin",
      createTime: `${dateStr} 14:08:47`,
      updateBy: null,
      updateTime: `${dateStr} 14:08:47`,
      remark: null,
      id: 3,
      doctorId: parseInt(doctorId.value) || 100,
      doctorName: doctorName.value || "张三",
      departmentId: 101,
      departmentName: deptName.value || "屈光科",
      startTime: `${dateStr} 10:00:00`,
      endTime: `${dateStr} 11:00:00`,
      capacity: 20,
      bookedCount: 20,
      slotFee: 50.00,
      slotType: "NORMAL",
      location: "浦江院区",
      roomNo: "304",
      status: "OPEN",
      closed: false,
      full: true, // 已约满
      open: true,
      cancelled: false,
      availableCount: 0,
      normalSlot: true,
      expertSlot: false,
      specialSlot: false
    },
    {
      createBy: "admin",
      createTime: `${dateStr} 14:08:47`,
      updateBy: null,
      updateTime: `${dateStr} 14:08:47`,
      remark: "专家号",
      id: 4,
      doctorId: parseInt(doctorId.value) || 100,
      doctorName: doctorName.value || "张三",
      departmentId: 101,
      departmentName: deptName.value || "屈光科",
      startTime: `${dateStr} 14:00:00`,
      endTime: `${dateStr} 15:00:00`,
      capacity: 15,
      bookedCount: 5,
      slotFee: 80.00,
      slotType: "EXPERT",
      location: "浦江院区",
      roomNo: "304",
      status: "OPEN",
      closed: false,
      full: false,
      open: true,
      cancelled: false,
      availableCount: 10,
      normalSlot: false,
      expertSlot: true,
      specialSlot: false
    }
  ]
  
  return mockSlots
}

// 格式化号源时间显示
const formatSlotTime = (slot) => {
  if (!slot.startTime || !slot.endTime) return '时间待定'
  
  const startTime = new Date(slot.startTime)
  const endTime = new Date(slot.endTime)
  
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  return `${formatTime(startTime)}-${formatTime(endTime)}`
}

// 格式化号源信息
const formatSlotInfo = (slot) => {
  // 使用新的 availableCount 字段，如果没有则计算
  const remainingCount = slot.availableCount !== undefined 
    ? slot.availableCount 
    : (slot.capacity - slot.bookedCount)
  return `剩余${remainingCount}个号`
}

// 获取号源状态文本
const getSlotStatus = (slot) => {
  if (!isSlotAvailable(slot)) {
    if (slot.full) {
      return '已约满'
    }
    if (slot.closed) {
      return '已关闭'
    }
    if (slot.cancelled) {
      return '已取消'
    }
    return '不可预约'
  }
  
  // 显示号源类型和费用
  let statusText = ''
  if (slot.expertSlot) {
    statusText = '专家号'
  } else if (slot.specialSlot) {
    statusText = '特需号'
  } else {
    statusText = '普通号'
  }
  
  if (slot.slotFee && slot.slotFee > 0) {
    statusText += ` ¥${slot.slotFee}`
  }
  
  return statusText
}

// 检查号源是否可用
const isSlotAvailable = (slot) => {
  // 使用新的字段来判断可用性
  return slot.open && !slot.full && !slot.closed && !slot.cancelled && slot.availableCount > 0
}

// 号源点击事件
const onSlotClick = (slot) => {
  if (!isSlotAvailable(slot)) {
    let message = '该时间段不可预约'
    if (slot.full) {
      message = '该时间段已约满'
    } else if (slot.closed) {
      message = '该时间段已关闭'
    } else if (slot.cancelled) {
      message = '该时间段已取消'
    }
    
    uni.showToast({
      title: message,
      icon: 'none'
    })
    return
  }
  
  selectedSlot.value = slot
  console.log('选择号源:', slot)
}

// 格式化日期显示
const formatDate = (dateValue) => {
  if (!dateValue) return '请选择日期'
  
  const date = new Date(dateValue)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天'
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[date.getDay()]
    return `${month}月${day}日 星期${weekDay}`
  }
}

// 格式化日期值
const formatDateValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 日期选择事件
const onDateChange = (e) => {
  selectedDate.value = e.detail.value
  // watch监听器会自动处理号源重新加载
}

// 返回按钮点击
const onBackClick = () => {
  uni.navigateBack()
}

// 提交预约
const onSubmitAppointment = async () => {
  if (!canSubmit.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    })
    return
  }
  
  // 手机号验证
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(patientInfo.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '提交中...'
    })
    
    const appointmentData = {
      scheduleId: selectedSlot.value.id,              // 号源ID（使用新的字段名）
      customerAccountId: userStore.id || 1,           // 就诊人ID（从用户store获取，没有则使用默认值）
      customerAccountName: patientInfo.name,         // 就诊人姓名
      status: "BOOKED",                               // 预约状态
      paymentStatus: "UNPAID",                        // 支付状态
      remark: patientInfo.symptoms || "无特殊要求"     // 备注（症状描述）
    }
    
    console.log('提交预约数据:', appointmentData)
    const response = await createAppointment(appointmentData)
    
    if (response.code === 200 && response.data) {
      uni.hideLoading()
      
      const appointmentResult = response.data
      console.log('预约成功:', appointmentResult)
      
      uni.showModal({
        title: '预约成功',
        content: `预约单号：${appointmentResult.appointmentNo}\n就诊时间：${formatDate(selectedDate.value)} ${formatSlotTime(selectedSlot.value)}\n挂号费：¥${appointmentResult.appointmentFee || selectedSlot.value.slotFee}`,
        showCancel: false,
        confirmText: '知道了',
        success: (res) => {
          if (res.confirm) {
            // 跳转到预约历史页面或首页
            uni.navigateBack()
          }
        }
      })
      
      // 清空号源缓存，确保数据实时性
      const cacheKey = `${doctorId.value}_${selectedDate.value}`
      if (slotsCache.has(cacheKey)) {
        slotsCache.delete(cacheKey)
        console.log('预约成功后清除号源缓存:', cacheKey)
      }
      
    } else {
      uni.hideLoading()
      uni.showToast({
        title: response.msg || '预约失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('提交预约失败:', error)
    uni.showToast({
      title: '网络错误，请重试',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.appointment-detail-page {
  background-color: #f6f7f8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  padding: 32rpx;
  padding-bottom: 200rpx;
}

.doctor-card {
  display: flex;
  gap: 24rpx;
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 32rpx;
}

.doctor-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
}

.doctor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.doctor-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.doctor-dept {
  font-size: 24rpx;
  color: #138aec;
}

.doctor-desc {
  font-size: 24rpx;
  color: #6b7280;
}

.doctor-specialty {
  font-size: 24rpx;
  color: #138aec;
  margin-top: 8rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 24rpx;
}

.date-section, .time-section, .patient-section, .notice-section {
  margin-bottom: 48rpx;
}

.date-picker {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
}

.date-text {
  font-size: 28rpx;
  color: #1a1a1a;
}

.arrow-icon {
  font-size: 28rpx;
  color: #6b7280;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.time-slot {
  background-color: #ffffff;
  padding: 24rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.slot-selected {
  background-color: #138aec;
}

.slot-disabled {
  background-color: #f3f4f6;
  opacity: 0.6;
}

.slot-time {
  font-size: 28rpx;
  color: #1a1a1a;
  font-weight: bold;
}

.slot-info {
  font-size: 22rpx;
  color: #6b7280;
}

.slot-status {
  font-size: 20rpx;
  color: #16a34a;
}

.slot-selected .slot-time,
.slot-selected .slot-info,
.slot-selected .slot-status {
  color: #ffffff;
}

.slot-disabled .slot-status {
  color: #dc2626;
}

.slot-disabled .slot-time,
.slot-disabled .slot-info {
  color: #9ca3af;
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

.empty-slots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #6b7280;
}

.empty-hint {
  font-size: 24rpx;
  color: #9ca3af;
}

.form-item {
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 16rpx;
}

.form-label {
  font-size: 28rpx;
  color: #1a1a1a;
  margin-bottom: 16rpx;
  display: block;
}

.form-input {
  width: 100%;
  font-size: 28rpx;
  color: #1a1a1a;
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  font-size: 28rpx;
  color: #1a1a1a;
  line-height: 1.4;
}

.notice-content {
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.notice-item {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 2;
  display: block;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top: 2rpx solid rgba(0, 0, 0, 0.1);
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
}

.appointment-summary {
  margin-bottom: 16rpx;
}

.summary-text {
  font-size: 24rpx;
  color: #6b7280;
  display: block;
  margin-bottom: 8rpx;
}

.fee-text {
  font-size: 22rpx;
  color: #138aec;
  font-weight: 500;
}

.location-text,
.room-text {
  font-size: 20rpx;
  color: #6b7280;
  display: block;
  margin-top: 4rpx;
}

.submit-btn {
  background-color: #138aec;
  padding: 32rpx;
  border-radius: 16rpx;
  text-align: center;
}

.btn-disabled {
  background-color: #d1d5db;
}

.submit-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}
</style>
