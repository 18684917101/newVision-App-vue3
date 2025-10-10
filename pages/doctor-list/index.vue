<template>
  <view class="doctor-list-page">
    <!-- 自定义导航栏 -->
    <view class="header">
      <view class="header-content">
        <view class="back-btn" @click="onBackClick">
          <text class="back-icon">←</text>
        </view>
        <text class="header-title">{{ deptName || '医生列表' }}</text>
        <view style="width: 64rpx;"></view>
      </view>
    </view>
    
    <view class="content">
      <!-- 医生列表 -->
      <view class="doctor-section" v-if="!loading">
        <view class="doctor-list">
          <view 
            v-for="(doctor, index) in doctorList" 
            :key="doctor.id || index"
            class="doctor-item"
            @click="onDoctorClick(doctor)"
          >
            <image class="doctor-avatar" :src="doctor.avatar || '/static/images/profile.jpg'" mode="aspectFill"></image>
            <view class="doctor-info">
              <view class="doctor-header">
                <text class="doctor-name">{{ doctor.name }}</text>
                <view class="doctor-status" :class="doctor.status === 'available' ? 'status-available' : 'status-busy'">
                  <text class="status-text">{{ doctor.status === 'available' ? '可预约' : '已约满' }}</text>
                </view>
              </view>
              <text class="doctor-title">{{ doctor.title }}</text>
              <text class="doctor-dept" v-if="showAll && doctor.deptName">{{ doctor.deptName }}</text>
              <text class="doctor-specialty" v-if="doctor.specialty">擅长：{{ doctor.specialty }}</text>
              <view class="doctor-stats" v-if="doctor.experience || doctor.rating">
                <text class="stat-item" v-if="doctor.experience">从业{{ doctor.experience }}年</text>
                <text class="stat-item" v-if="doctor.rating">好评率{{ doctor.rating }}%</text>
              </view>
            </view>
            <view class="appointment-btn" v-if="doctor.status === 'available'">
              <text class="btn-text">预约</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!loading && doctorList.length === 0" class="empty-container">
        <text class="empty-text">该科室暂无医生信息</text>
        <view class="empty-action" @click="onBackClick">
          <text class="action-text">返回科室列表</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDoctorsByDept, getAllDoctors } from '@/api/department'

// 响应式数据
const loading = ref(true)
const doctorList = reactive([])
const deptId = ref('')
const deptName = ref('')
const showAll = ref(false) // 是否显示所有医生

// 页面加载时获取参数
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  
  deptId.value = options.deptId || ''
  deptName.value = decodeURIComponent(options.deptName || '')
  showAll.value = options.showAll === 'true' // 新增：是否显示所有医生
  
  if (showAll.value) {
    // 显示所有医生
    deptName.value = '医生团队'
    loadAllDoctors()
  } else if (deptId.value) {
    // 按科室显示医生
    loadDoctors()
  } else {
    // 如果没有科室ID，显示模拟数据
    loadMockDoctors()
  }
})

// 获取医生列表（真实API）
const loadDoctors = async () => {
  try {
    loading.value = true
    const response = await getDoctorsByDept({
      pageNum: 1,
      pageSize: 20,
      deptId: deptId.value
    })
    
    if (response.code === 200) {
      // 处理API返回的数据格式，将用户数据转换为医生数据
      const doctors = response.rows.map(user => ({
        id: user.userId,
        name: user.nickName || user.userName,
        title: getRandomTitle(), // 随机分配职称
        specialty: getSpecialtyByDept(deptName.value), // 根据科室分配专长
        experience: getRandomExperience(), // 随机分配经验年限
        rating: getRandomRating(), // 随机分配评分
        status: user.status === '0' ? 'available' : 'busy', // 根据用户状态判断可约状态
        avatar: user.avatar || '/static/images/profile.jpg',
        phone: user.phonenumber,
        email: user.email,
        dept: user.dept
      }))
      
      doctorList.splice(0, doctorList.length, ...doctors)
    } else {
      uni.showToast({
        title: response.msg || '获取医生信息失败',
        icon: 'none'
      })
      // 如果API失败，加载模拟数据
      loadMockDoctors()
    }
  } catch (error) {
    console.error('获取医生列表失败:', error)
    uni.showToast({
      title: '网络错误，使用模拟数据',
      icon: 'none'
    })
    // 网络错误时加载模拟数据
    loadMockDoctors()
  } finally {
    loading.value = false
  }
}

// 获取所有医生列表（真实API）
const loadAllDoctors = async () => {
  try {
    loading.value = true
    const response = await getAllDoctors(100) // roleId = 100
    
    if (response.code === 200) {
      // 处理API返回的数据格式，将用户数据转换为医生数据
      const doctors = response.rows.map(user => ({
        id: user.userId,
        name: user.nickName || user.userName,
        title: getRandomTitle(), // 随机分配职称
        specialty: getGeneralSpecialty(), // 通用专长
        experience: getRandomExperience(), // 随机分配经验年限
        rating: getRandomRating(), // 随机分配评分
        status: user.status === '0' ? 'available' : 'busy', // 根据用户状态判断可约状态
        avatar: user.avatar || '/static/images/profile.jpg',
        phone: user.phonenumber,
        email: user.email,
        dept: user.dept,
        deptName: user.dept?.deptName || '未知科室'
      }))
      
      doctorList.splice(0, doctorList.length, ...doctors)
    } else {
      uni.showToast({
        title: response.msg || '获取医生信息失败',
        icon: 'none'
      })
      // 如果API失败，加载模拟数据
      loadMockDoctors()
    }
  } catch (error) {
    console.error('获取所有医生列表失败:', error)
    uni.showToast({
      title: '网络错误，使用模拟数据',
      icon: 'none'
    })
    // 网络错误时加载模拟数据
    loadMockDoctors()
  } finally {
    loading.value = false
  }
}

// 随机分配职称
const getRandomTitle = () => {
  const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
  return titles[Math.floor(Math.random() * titles.length)]
}

// 根据科室获取专长
const getSpecialtyByDept = (deptName) => {
  const specialties = {
    '屈光科': '近视手术、散光矫正、远视治疗',
    '光学科': '眼镜验配、角膜塑形镜',
    '眼科': '白内障、青光眼、眼底病',
    '内科': '心血管疾病、呼吸系统疾病',
    '外科': '普通外科、微创手术',
    '妇产科': '妇科疾病、产科护理',
    '儿科': '儿童常见病、疫苗接种',
    '口腔科': '口腔疾病、牙齿矫正',
    '耳鼻咽科': '耳鼻喉疾病、听力检查',
    '皮肤科': '皮肤病、美容整形'
  }
  
  // 匹配科室名称关键字
  for (const [key, value] of Object.entries(specialties)) {
    if (deptName.includes(key)) {
      return value
    }
  }
  
  return '各类常见疾病诊疗'
}

// 获取通用专长（用于所有医生列表）
const getGeneralSpecialty = () => {
  const specialties = [
    '内科常见疾病诊疗',
    '外科手术及护理',
    '妇产科疾病治疗', 
    '儿科疾病诊断',
    '眼科疾病治疗',
    '口腔疾病处理',
    '皮肤病诊疗',
    '耳鼻喉科疾病',
    '骨科疾病治疗',
    '心血管疾病诊疗',
    '呼吸系统疾病',
    '消化系统疾病'
  ]
  return specialties[Math.floor(Math.random() * specialties.length)]
}

// 随机分配经验年限
const getRandomExperience = () => {
  return Math.floor(Math.random() * 20) + 5 // 5-25年
}

// 随机分配评分
const getRandomRating = () => {
  return Math.floor(Math.random() * 8) + 92 // 92-99分
}

// 加载模拟医生数据
const loadMockDoctors = () => {
  const mockDoctors = [
    {
      id: 1,
      name: '张华明',
      title: '主任医师',
      specialty: '屈光手术、角膜病',
      experience: 25,
      rating: 98,
      status: 'available',
      avatar: '/static/images/profile.jpg',
      deptName: showAll.value ? '眼科' : undefined
    },
    {
      id: 2,
      name: '李美娟',
      title: '副主任医师',
      specialty: '青光眼、眼底病',
      experience: 18,
      rating: 96,
      status: 'busy',
      avatar: '/static/images/profile.jpg',
      deptName: showAll.value ? '眼科' : undefined
    },
    {
      id: 3,
      name: '王建国',
      title: '主治医师',
      specialty: '白内障、眼外伤',
      experience: 12,
      rating: 94,
      status: 'available',
      avatar: '/static/images/profile.jpg',
      deptName: showAll.value ? '内科' : undefined
    },
    {
      id: 4,
      name: '陈小丽',
      title: '主治医师',
      specialty: '妇科常见疾病诊疗',
      experience: 8,
      rating: 95,
      status: 'available',
      avatar: '/static/images/profile.jpg',
      deptName: showAll.value ? '妇产科' : undefined
    },
    {
      id: 5,
      name: '刘志强',
      title: '副主任医师',
      specialty: '外科手术及护理',
      experience: 15,
      rating: 97,
      status: 'available',
      avatar: '/static/images/profile.jpg',
      deptName: showAll.value ? '外科' : undefined
    }
  ]
  
  // 如果是显示所有医生，只显示有科室的数据
  const displayDoctors = showAll.value ? mockDoctors : mockDoctors.slice(0, 3)
  
  doctorList.splice(0, doctorList.length, ...displayDoctors)
  loading.value = false
}

// 返回按钮点击
const onBackClick = () => {
  uni.navigateBack()
}

// 医生点击事件
const onDoctorClick = (doctor) => {
  if (doctor.status === 'available') {
    // 跳转到预约详情页面，传递更多医生信息
    const params = {
      doctorId: doctor.id,
      doctorName: encodeURIComponent(doctor.name),
      deptName: encodeURIComponent(deptName.value),
      doctorTitle: encodeURIComponent(doctor.title),
      doctorSpecialty: encodeURIComponent(doctor.specialty),
      doctorExperience: doctor.experience,
      doctorRating: doctor.rating
    }
    
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    uni.navigateTo({
      url: `/pages/appointment-detail/index?${queryString}`
    })
  } else {
    uni.showToast({
      title: '该医生已约满',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.doctor-list-page {
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

.doctor-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.doctor-item {
  display: flex;
  gap: 24rpx;
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.doctor-item:active {
  transform: scale(0.98);
  background-color: rgba(19, 138, 236, 0.05);
}

.doctor-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.doctor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.doctor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.doctor-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.doctor-status {
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}

.status-available {
  background-color: #dcfce7;
}

.status-busy {
  background-color: #fef2f2;
}

.status-text {
  font-size: 20rpx;
  color: #16a34a;
}

.status-busy .status-text {
  color: #dc2626;
}

.doctor-title {
  font-size: 24rpx;
  color: #138aec;
}

.doctor-dept {
  font-size: 22rpx;
  color: #f59e0b;
  background-color: #fef3c7;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  align-self: flex-start;
}

.doctor-specialty {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.4;
}

.doctor-stats {
  display: flex;
  gap: 24rpx;
}

.stat-item {
  font-size: 20rpx;
  color: #9ca3af;
}

.appointment-btn {
  background-color: #138aec;
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  align-self: flex-start;
  margin-top: 8rpx;
}

.btn-text {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
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

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
  margin-bottom: 32rpx;
}

.empty-action {
  background-color: #138aec;
  padding: 16rpx 32rpx;
  border-radius: 24rpx;
}

.action-text {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 500;
}
</style>
