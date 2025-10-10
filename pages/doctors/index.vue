<template>
  <view class="doctors-page">
    <view class="header">
      <text class="title">医生团队</text>
    </view>
    
    <view class="content">
      <view class="search-section">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input 
            class="search-input" 
            placeholder="搜索医生姓名或科室"
            v-model="searchText"
            @input="onSearch"
          />
        </view>
      </view>
      
      <view class="department-tabs">
        <scroll-view scroll-x="true" class="tab-scroll">
          <view class="tab-container">
            <view 
              v-for="(dept, index) in departments" 
              :key="index"
              class="tab-item"
              :class="{ 'tab-active': activeDept === index }"
              @click="onDeptTabClick(index)"
            >
              <text class="tab-text">{{ dept }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
      
      <view class="doctors-list">
        <view 
          v-for="(doctor, index) in filteredDoctors" 
          :key="index"
          class="doctor-card"
          @click="onDoctorDetail(doctor)"
        >
          <image class="doctor-avatar" :src="doctor.avatar" mode="aspectFill"></image>
          <view class="doctor-info">
            <view class="doctor-header">
              <text class="doctor-name">{{ doctor.name }}</text>
            </view>
            <text class="doctor-title">{{ doctor.title }} | {{ doctor.department }}</text>
            <text class="doctor-specialty">擅长：{{ doctor.specialty }}</text>
            <view class="doctor-stats">
              <text class="stat-item">从业{{ doctor.experience }}年</text>
              <text class="stat-item">好评率{{ doctor.rating }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const searchText = ref('')
const activeDept = ref(0)

const departments = reactive(['全部', '内科', '外科', '妇产科', '儿科', '眼科', '口腔科'])

const doctorList = reactive([
  {
    name: '张华明',
    title: '主任医师',
    department: '心血管内科',
    specialty: '冠心病、高血压、心力衰竭',
    experience: 25,
    rating: 98,
    status: 'available',
    avatar: '/static/images/profile.jpg'
  },
  {
    name: '李美娟',
    title: '副主任医师',
    department: '妇产科',
    specialty: '妇科肿瘤、不孕不育',
    experience: 18,
    rating: 96,
    status: 'busy',
    avatar: '/static/images/profile.jpg'
  },
  {
    name: '王建国',
    title: '主治医师',
    department: '外科',
    specialty: '腹腔镜手术、胆囊疾病',
    experience: 12,
    rating: 94,
    status: 'available',
    avatar: '/static/images/profile.jpg'
  },
  {
    name: '陈小红',
    title: '主任医师',
    department: '儿科',
    specialty: '小儿呼吸、过敏性疾病',
    experience: 20,
    rating: 97,
    status: 'available',
    avatar: '/static/images/profile.jpg'
  }
])

const filteredDoctors = computed(() => {
  let filtered = doctorList
  
  // 按科室筛选
  if (activeDept.value > 0) {
    const selectedDept = departments[activeDept.value]
    filtered = filtered.filter(doctor => doctor.department.includes(selectedDept))
  }
  
  // 按搜索文本筛选
  if (searchText.value) {
    filtered = filtered.filter(doctor => 
      doctor.name.includes(searchText.value) || 
      doctor.department.includes(searchText.value) ||
      doctor.specialty.includes(searchText.value)
    )
  }
  
  return filtered
})

const onSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const onDeptTabClick = (index) => {
  activeDept.value = index
}

const onDoctorDetail = (doctor) => {
  uni.navigateTo({
    url: `/pages/doctor-detail/index?name=${doctor.name}`
  })
}
</script>

<style lang="scss" scoped>
.doctors-page {
  background-color: #f6f7f8;
  min-height: 100vh;
}

.header {
  padding: 40rpx 32rpx 20rpx;
  background-color: #ffffff;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.content {
  padding: 0 32rpx;
}

.search-section {
  padding: 32rpx 0;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.search-icon {
  font-size: 32rpx;
  color: #6b7280;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1a1a1a;
}

.department-tabs {
  margin-bottom: 32rpx;
}

.tab-scroll {
  white-space: nowrap;
}

.tab-container {
  display: flex;
  gap: 16rpx;
  padding: 0 8rpx;
}

.tab-item {
  padding: 16rpx 32rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  white-space: nowrap;
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
}

.doctors-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 32rpx;
}

.doctor-card {
  display: flex;
  gap: 24rpx;
  background-color: #ffffff;
  padding: 32rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
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
}

.doctor-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
}


.doctor-title {
  font-size: 24rpx;
  color: #138aec;
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
</style>
