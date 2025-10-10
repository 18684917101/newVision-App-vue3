<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="header-content">
        <!-- <view class="login-status" @click="onLoginStatusClick">
          <text class="status-text" v-if="!userToken">点击登录</text>
          <text class="status-text" v-else>{{ userName || '已登录' }}</text>
        </view> -->
        <text class="header-title">首页</text>
        <view class="header-right">
          <view class="notification-btn" @click="onNotificationClick">
            <text class="notification-icon">🔔</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 轮播图区域 -->
    <view class="banner-section">
      <swiper 
        class="banner-swiper" 
        indicator-dots 
        autoplay 
        circular
        interval="3000"
        duration="500"
        indicator-color="rgba(255, 255, 255, 0.5)"
        indicator-active-color="#138aec"
      >
        <swiper-item v-for="(item, index) in bannerList" :key="index">
          <view class="banner-item" @click="onBannerClick(item, index)">
            <image class="banner-image" :src="item.image" mode="aspectFill" @error="onBannerImageError"></image>
            <view v-if="item.title" class="banner-overlay">
              <text class="banner-title">{{ item.title }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 导航选项卡 -->
    <view class="nav-tabs">
      <view class="tab-container">
        <view 
          v-for="(tab, index) in tabList" 
          :key="index"
          class="tab-item"
          :class="{ 'tab-active': activeTab === index }"
          @click="onTabClick(index)"
        >
          <text class="tab-text">{{ tab.name }}</text>
        </view>
      </view>
    </view>

    <!-- 文章资讯区域 -->
    <view class="article-section">
      <view class="section-header">
        <text class="section-title">文章资讯</text>
        <view class="section-subtitle">
          <text class="subtitle-text">最新公众号文章</text>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="articlesLoading" class="articles-loading">
        <text class="loading-text">正在加载文章...</text>
      </view>
      
      <!-- 文章列表 -->
      <view v-else class="article-list">
        <view 
          v-for="(article, index) in articleList" 
          :key="article.id || index"
          class="article-item"
          @click="onArticleClick(article)"
        >
          <view class="article-content">
            <view class="article-header">
              <text class="article-category">{{ article.category }}</text>
              <text v-if="article.readCount" class="article-read-count">阅读 {{ formatReadCount(article.readCount) }}</text>
            </view>
            <text class="article-title">{{ article.title }}</text>
            <text class="article-desc">{{ article.description }}</text>
            <text v-if="article.publishTime" class="article-time">{{ formatPublishTime(article.publishTime) }}</text>
          </view>
          <image class="article-image" :src="article.image" mode="aspectFill" @error="onImageError"></image>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="!articlesLoading && articleList.length === 0" class="articles-empty">
        <text class="empty-text">暂无文章</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import { getLatestArticles, recordArticleClick } from '@/api/wechat-articles'
import { requireLogin } from '@/utils/login-guard'

// 响应式数据
const activeTab = ref(0)
const userStore = useUserStore()
const pendingTarget = ref('') // 待跳转的目标页面

// 用户登录状态
const userToken = computed(() => userStore.token)
const userName = computed(() => userStore.nickname || userStore.name)

// 轮播图数据
const bannerList = reactive([
  {
    image: 'http://119.29.84.237:38080/image/banner1.png',
    title: '医院服务',
    link: ''
  },
  {
    image: 'http://119.29.84.237:38080/image/banner2.png',
    title: '专业团队', 
    link: ''
  },
  // {
  //   image: 'http://119.29.84.237:38080/image/banner3.png',
  //   title: '先进设备',
  //   link: ''
  // },
  // {
  //   image: 'http://119.29.84.237:38080/image/banner4.png',
  //   title: '健康生活',
  //   link: ''
  // },
  // {
  //   image: 'http://119.29.84.237:38080/image/banner5.png',
  //   title: '医疗服务',
  //   link: ''
  // }
])


// 导航选项卡数据
const tabList = reactive([
  { name: '预约挂号', value: 'appointment' },
  { name: '医生团队', value: 'doctors' },
  { name: '来源路线', value: 'route' }
])

// 文章列表数据
const articleList = reactive([])
const articlesLoading = ref(true)

// 页面生命周期
onMounted(() => {
  handlePageParams()
  loadWechatArticles() // 加载公众号文章
  console.log('首页初始化完成，使用新的文章接口: /c/wechat/article/latest')
  console.log('Banner配置:', bannerList.length, '张图片')
  bannerList.forEach((banner, index) => {
    console.log(`Banner ${index + 1}:`, banner.title, banner.image)
  })
  
})

onShow(() => {
  // 页面显示时检查是否有待处理的跳转
  if (pendingTarget.value && userToken.value) {
    const target = pendingTarget.value
    pendingTarget.value = ''
    
    // 延迟跳转，确保页面完全显示
    setTimeout(() => {
      uni.navigateTo({
        url: target
      })
    }, 500)
  }
})

// 处理页面参数
const handlePageParams = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options || {}
  
  // 检查是否需要自动登录
  if (options.autoLogin === 'true') {
    console.log('检测到需要自动登录')
    if (options.target) {
      pendingTarget.value = decodeURIComponent(options.target)
    }
    
    if (!userToken.value) {
      // 如果还没登录，主动触发微信登录
      handleAutoLogin()
    }
  }
  
  // 检查是否需要重新登录
  if (options.reLogin === 'true') {
    console.log('检测到需要重新登录')
    if (options.target) {
      pendingTarget.value = decodeURIComponent(options.target)
    }
    
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    })
  }
}

// 自动登录处理
const handleAutoLogin = () => {
  //#ifdef MP-WEIXIN
  console.log('开始自动微信登录')
  wxLogin()
  //#endif
  
  //#ifndef MP-WEIXIN
  uni.showToast({
    title: '请在微信小程序中使用',
    icon: 'none'
  })
  //#endif
}

// 方法定义
const onNotificationClick = () => {
  uni.showToast({
    title: '通知功能',
    icon: 'none'
  })
}


const onTabClick = (index) => {
  activeTab.value = index
  const tab = tabList[index]
  
  switch(tab.value) {
    case 'appointment':
      // 挂号需要登录
      checkLoginAndNavigate('挂号', '/pages/appointment/index')
      break
    case 'doctors':
      uni.navigateTo({
        url: '/pages/expert-team/index'
      })
      break
    case 'route':
      // 添加平台检测和测试
      testCoordinatesAndPlatform()
      openMapNavigation()
      break
  }
}

// 加载微信公众号文章
const loadWechatArticles = async () => {
  try {
    articlesLoading.value = true
    console.log('获取最新3篇公众号文章...')
    
    const response = await getLatestArticles()
    
    if (response.code === 200 && response.data) {
      const articles = Array.isArray(response.data) ? response.data : []
      
      // 转换数据格式以适配页面显示
      const formattedArticles = articles.map(article => ({
        id: article.articleId, // 使用 articleId 字段
        category: getCategoryText(article.category), // 转换分类显示
        title: article.title,
        description: article.summary || '点击查看详情',
        image: article.coverImage || '/static/images/profile.jpg',
        url: article.originalUrl, // 使用 originalUrl 字段
        publishTime: article.createTime, // 使用 createTime 作为发布时间
        readCount: article.readCount || 0,
        likeCount: article.likeCount || 0,
        author: article.author,
        // 保留原始数据
        original: article
      }))
      
      articleList.splice(0, articleList.length, ...formattedArticles)
      console.log('获取到公众号文章:', formattedArticles.length, '篇', formattedArticles)
    } else {
      console.warn('获取公众号文章失败，使用模拟数据:', response?.msg)
      loadMockArticles()
    }
  } catch (error) {
    console.error('获取公众号文章失败:', error)
    console.log('使用模拟文章数据')
    loadMockArticles()
  } finally {
    articlesLoading.value = false
  }
}

// 转换分类文本显示
const getCategoryText = (category) => {
  const categoryMap = {
    'NOTICE': '医院公告',
    'HEALTH': '健康科普',
    'NEWS': '新闻资讯',
    'ACTIVITY': '活动通知'
  }
  return categoryMap[category] || '公众号文章'
}

// 加载模拟文章数据（作为后备方案）
const loadMockArticles = () => {
  const mockArticles = [
    {
      id: 1,
      category: '医院公告',
      title: '上海新视界东区眼科医院十周年庆典暨学术交流会',
      description: '医院举行十周年庆典暨第二届眼科创新技术学术交流会，展现十年发展成果与责任担当',
      image: '/static/images/profile.jpg',
      url: 'https://mp.weixin.qq.com/s/-DAQDLr01H2329wn_d-2Og',
      publishTime: new Date().toISOString(),
      readCount: 1200,
      likeCount: 50,
      author: '上海新视界东区眼科医院'
    },
    {
      id: 2,
      category: '健康科普', 
      title: '儿童青少年近视防控指引',
      description: '全国综合防控儿童青少年近视宣讲团发布权威防控指南',
      image: '/static/images/profile.jpg',
      url: 'https://mp.weixin.qq.com/s/c_GYNw5Xk6EL1GPNIlaedA',
      publishTime: new Date().toISOString(),
      readCount: 800,
      likeCount: 35,
      author: '教育部政务新媒体'
    },
    {
      id: 3,
      category: '健康科普',
      title: '白内障治疗的科学方法',
      description: '详细介绍白内障的症状、治疗方法和预防措施，手术是唯一有效治愈方法',
      image: '/static/images/profile.jpg',
      url: 'https://mp.weixin.qq.com/s/vPh1sa_1Rp_KOmPzeQ4lZw',
      publishTime: new Date().toISOString(),
      readCount: 950,
      likeCount: 42,
      author: '心向光明'
    }
  ]
  
  articleList.splice(0, articleList.length, ...mockArticles)
}

// 格式化阅读数
const formatReadCount = (count) => {
  if (!count) return 0
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count
}

// 格式化发布时间
const formatPublishTime = (publishTime) => {
  if (!publishTime) return ''
  
  const now = new Date()
  const publishDate = new Date(publishTime)
  const diffInSeconds = Math.floor((now - publishDate) / 1000)
  
  if (diffInSeconds < 60) {
    return '刚刚'
  } else if (diffInSeconds < 3600) {
    return Math.floor(diffInSeconds / 60) + '分钟前'
  } else if (diffInSeconds < 86400) {
    return Math.floor(diffInSeconds / 3600) + '小时前'
  } else if (diffInSeconds < 2592000) {
    return Math.floor(diffInSeconds / 86400) + '天前'
  } else {
    const year = publishDate.getFullYear()
    const month = String(publishDate.getMonth() + 1).padStart(2, '0')
    const day = String(publishDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

// 图片加载错误处理
const onImageError = (e) => {
  console.warn('文章图片加载失败，使用默认图片')
  // 可以设置默认图片
  e.target.src = '/static/images/profile.jpg'
}

// 测试坐标和平台兼容性
const testCoordinatesAndPlatform = () => {
  console.log('=== 平台和坐标测试开始 ===')
  
  // 检测当前平台
  const platform = uni.getSystemInfoSync()
  console.log('当前平台信息:', {
    platform: platform.platform,
    system: platform.system,
    version: platform.version,
    SDKVersion: platform.SDKVersion
  })
  
  // 测试坐标
  const testLat = 31.206882
  const testLng = 121.536984
  console.log('测试坐标:', { testLat, testLng })
  console.log('坐标类型:', typeof testLat, typeof testLng)
  
  // 检查 uni.openLocation 是否可用
  if (typeof uni.openLocation === 'function') {
    console.log('uni.openLocation 方法可用')
  } else {
    console.error('uni.openLocation 方法不可用')
  }
  
  console.log('=== 平台和坐标测试结束 ===')
}

// 直接测试坐标加载
const testDirectCoordinates = () => {
  console.log('=== 直接坐标测试开始 ===')
  
  const testLat = 31.206882
  const testLng = 121.536984
  
  console.log('直接测试坐标:', testLat, testLng)
  
  // 最简单的参数测试
  uni.openLocation({
    latitude: testLat,
    longitude: testLng,
    scale: 16,
    name: '测试医院位置',
    address: '上海市测试地址',
    success: (res) => {
      console.log('直接坐标测试成功:', res)
      uni.showToast({
        title: '坐标加载成功',
        icon: 'success'
      })
    },
    fail: (error) => {
      console.error('直接坐标测试失败:', error)
      uni.showModal({
        title: '坐标测试失败',
        content: `测试坐标 ${testLng}, ${testLat} 加载失败\n\n错误: ${JSON.stringify(error)}\n\n请检查您的设备是否支持地图功能。`,
        showCancel: false,
        confirmText: '确定'
      })
    }
  })
  
  console.log('=== 直接坐标测试结束 ===')
}

// 打开地图导航
const openMapNavigation = () => {
  // 医院坐标信息
  const hospitalInfo = {
    name: '上海新视界东区眼科医院（浦东院区）',
    address: '上海市浦东新区浦建路1000号', // 可以配置具体地址
    latitude: Number(31.206882), // 更精确的纬度坐标
    longitude: Number(121.536984) // 更精确的经度坐标
  }
  
  console.log('打开地图导航到:', hospitalInfo)
  console.log('坐标类型检查:', typeof hospitalInfo.latitude, typeof hospitalInfo.longitude)
  console.log('坐标值:', `纬度: ${hospitalInfo.latitude}, 经度: ${hospitalInfo.longitude}`)
  console.log('新的精确坐标已设置: 121.536984, 31.206882')
  
  // 显示导航选项
  uni.showActionSheet({
    itemList: ['查看医院位置', '获取导航路线', '复制坐标信息', '直接测试坐标'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          // 查看医院位置
          openLocationMap(hospitalInfo)
          break
        case 1:
          // 获取导航路线
          openNavigation(hospitalInfo)
          break
        case 2:
          // 复制坐标信息
          copyCoordinates(hospitalInfo)
          break
        case 3:
          // 直接测试坐标
          testDirectCoordinates()
          break
      }
    },
    fail: (error) => {
      console.error('操作选择失败:', error)
      // 默认直接打开地图
      openLocationMap(hospitalInfo)
    }
  })
}

// 打开地图查看位置
const openLocationMap = (hospitalInfo) => {
  console.log('=== 地图打开调试信息开始 ===')
  console.log('医院信息:', hospitalInfo)
  console.log('准备打开地图，坐标:', hospitalInfo.latitude, hospitalInfo.longitude)
  console.log('坐标类型:', typeof hospitalInfo.latitude, typeof hospitalInfo.longitude)
  console.log('坐标值验证:')
  console.log('  纬度:', hospitalInfo.latitude, '是否为数字:', !isNaN(hospitalInfo.latitude))
  console.log('  经度:', hospitalInfo.longitude, '是否为数字:', !isNaN(hospitalInfo.longitude))
  
  // 坐标验证
  if (!hospitalInfo.latitude || !hospitalInfo.longitude || 
      isNaN(hospitalInfo.latitude) || isNaN(hospitalInfo.longitude)) {
    console.error('坐标数据无效:', {
      latitude: hospitalInfo.latitude,
      longitude: hospitalInfo.longitude
    })
    uni.showToast({
      title: '坐标数据错误',
      icon: 'none'
    })
    return
  }
  
  // 确保坐标为数字类型
  const lat = Number(hospitalInfo.latitude)
  const lng = Number(hospitalInfo.longitude)
  
  console.log('转换后的坐标:', { lat, lng })
  console.log('准备调用 uni.openLocation...')
  
  const locationParams = {
    latitude: lat,
    longitude: lng,
    scale: 16, // 比例尺设为16，显示较详细的地图（范围5-18）
    name: hospitalInfo.name || '医院',
    address: hospitalInfo.address || '医院地址'
  }
  
  console.log('uni.openLocation 参数:', locationParams)
  
  uni.openLocation({
    ...locationParams,
    success: (res) => {
      console.log('地图打开成功:', res)
      console.log('=== 地图打开调试信息结束 ===')
      // 记录用户使用导航功能
      recordMapUsage(hospitalInfo)
    },
    fail: (error) => {
      console.error('地图打开失败:', error)
      console.error('失败的参数:', locationParams)
      console.log('=== 地图打开调试信息结束（失败）===')
      
      // 显示详细错误信息
      uni.showModal({
        title: '地图打开失败',
        content: `错误信息: ${JSON.stringify(error)}\n坐标: ${lat}, ${lng}\n\n是否尝试其他方式？`,
        confirmText: '复制坐标',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            showMapAlternative(hospitalInfo)
          }
        }
      })
    }
  })
}

// 记录地图使用情况（可选）
const recordMapUsage = (hospitalInfo) => {
  try {
    console.log('用户使用了地图导航功能', {
      timestamp: new Date().toISOString(),
      coordinates: `${hospitalInfo.longitude},${hospitalInfo.latitude}`
    })
    // 这里可以添加埋点统计
  } catch (error) {
    console.warn('记录地图使用失败:', error)
  }
}

// 获取导航路线
const openNavigation = (hospitalInfo) => {
  // 先获取用户当前位置
  uni.getLocation({
    type: 'gcj02', // 返回可以用于uni.openLocation的经纬度
    altitude: true, // 传入 true 会返回高度信息，由于获取高度需要较高精确度，会减慢接口返回速度
    success: (userLocation) => {
      console.log('用户当前位置:', userLocation)
      
      // 计算距离
      const distance = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        hospitalInfo.latitude, 
        hospitalInfo.longitude
      )
      
      uni.showModal({
        title: '导航路线',
        content: `当前位置到医院\n直线距离约 ${distance.toFixed(2)} 公里\n\n是否打开地图进行导航？`,
        confirmText: '开始导航',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            openLocationMap(hospitalInfo)
          }
        }
      })
    },
    fail: (error) => {
      console.error('获取位置失败:', error)
      uni.showModal({
        title: '定位权限',
        content: '无法获取您的位置信息，请检查定位权限设置。是否直接查看医院位置？',
        confirmText: '查看位置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            openLocationMap(hospitalInfo)
          }
        }
      })
    }
  })
}

// 计算两点间距离（简单计算）
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const radLat1 = lat1 * Math.PI / 180.0
  const radLat2 = lat2 * Math.PI / 180.0
  const a = radLat1 - radLat2
  const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
  const s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a/2), 2) + 
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b/2), 2)))
  return s * 6378.137 // 地球半径
}

// 复制坐标信息
const copyCoordinates = (hospitalInfo) => {
  const coordinates = `医院坐标: ${hospitalInfo.longitude}, ${hospitalInfo.latitude}`
  uni.setClipboardData({
    data: coordinates,
    success: () => {
      uni.showToast({
        title: '坐标已复制',
        icon: 'success'
      })
    },
    fail: () => {
      uni.showToast({
        title: '复制失败',
        icon: 'none'
      })
    }
  })
}

// 地图备用方案
const showMapAlternative = (hospitalInfo) => {
  const lat = Number(hospitalInfo.latitude) || 31.206882
  const lng = Number(hospitalInfo.longitude) || 121.536984
  
  console.log('显示地图备用方案，坐标:', { lat, lng })
  
  uni.showModal({
    title: '地图坐标信息',
    content: `医院位置坐标:\n经度: ${lng}\n纬度: ${lat}\n\n您可以复制这些坐标到其他地图应用中使用。\n\n是否复制坐标信息？`,
    confirmText: '复制坐标',
    cancelText: '手动输入',
    success: (res) => {
      if (res.confirm) {
        const coordinates = `${lng},${lat}`
        console.log('复制坐标:', coordinates)
        
        // 复制坐标到剪贴板
        uni.setClipboardData({
          data: coordinates,
          success: () => {
            console.log('坐标复制成功')
            uni.showToast({
              title: '坐标已复制到剪贴板',
              icon: 'success',
              duration: 2000
            })
            
            // 显示使用说明
            setTimeout(() => {
              uni.showModal({
                title: '使用说明',
                content: `坐标 ${coordinates} 已复制到剪贴板\n\n您可以:\n1. 打开高德地图、百度地图等应用\n2. 搜索或粘贴这个坐标\n3. 即可找到医院位置`,
                showCancel: false,
                confirmText: '知道了'
              })
            }, 2000)
          },
          fail: (error) => {
            console.error('坐标复制失败:', error)
            uni.showToast({
              title: '复制失败，请手动记录',
              icon: 'none'
            })
            
            // 显示手动输入说明
            uni.showModal({
              title: '手动输入坐标',
              content: `请在地图应用中手动输入以下坐标:\n\n经度: ${lng}\n纬度: ${lat}\n\n或搜索: ${lng},${lat}`,
              showCancel: false,
              confirmText: '知道了'
            })
          }
        })
      } else {
        // 用户选择手动输入
        uni.showModal({
          title: '手动输入坐标',
          content: `请在您的地图应用中输入:\n\n经度: ${lng}\n纬度: ${lat}\n\n或直接搜索: ${lng},${lat}`,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    }
  })
}

// 文章点击事件
const onArticleClick = async (article) => {
  console.log('点击文章:', article.title)
  console.log('文章URL:', article.url)



  if (article.url && article.url.startsWith('http')) {
    wx.openOfficialAccountArticle({
      url: article.url, // 必须是 https://mp.weixin.qq.com/s/... 链接
      success: (res) => {
        console.log('成功打开公众号文章:', res)
      },
      fail: (err) => {
        console.error('打开失败:', err)
        uni.showToast({
          title: '无法打开文章',
          icon: 'none'
        })
      }
    })
  } else {
    uni.showToast({
      title: '文章链接无效',
      icon: 'none'
    })
  }
}


// Banner点击事件
const onBannerClick = (banner, index) => {
  console.log('点击banner:', banner.title, 'index:', index)
  
  // 检查是否是专业团队
  if (banner.title === '专业团队') {
    uni.navigateTo({
      url: '/pages/expert-team/index'
    })
    return
  }
  
  if (banner.link) {
    // 如果有链接，执行跳转
    console.log('跳转到:', banner.link)
    if (banner.link.startsWith('http')) {
      // 外部链接
      uni.navigateTo({
        url: `/pages/common/webview/index?url=${encodeURIComponent(banner.link)}&title=${encodeURIComponent(banner.title)}`
      })
    } else {
      // 内部页面链接
      uni.navigateTo({
        url: banner.link
      })
    }
  } else {
    // 暂无链接的提示或者默认行为
    console.log('banner暂无链接配置')
    uni.showToast({
      title: banner.title || '更多精彩内容敬请期待',
      icon: 'none'
    })
  }
}

// Banner图片加载错误处理
const onBannerImageError = (e) => {
  console.warn('Banner图片加载失败:', e)
}

// 复制文章链接的备用方案
const fallbackCopyLink = (article) => {
  const url = article.url || article.original?.originalUrl
  if (!url) {
    uni.showToast({
      title: '文章链接无效',
      icon: 'none'
    })
    return
  }
  
  console.log('执行复制链接操作:', url)
  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showModal({
        title: '链接已复制',
        content: `公众号文章链接已复制到剪贴板\n\n${article.title}\n\n请在微信中粘贴此链接查看完整文章`,
        showCancel: false,
        confirmText: '知道了'
      })
    },
    fail: () => {
      uni.showModal({
        title: '文章链接',
        content: `请手动复制以下链接在微信中打开：\n\n${url}\n\n文章标题：${article.title}`,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  })
}

// 登录状态点击
const onLoginStatusClick = () => {
  if (!userToken.value) {
    // 未登录，进行微信登录
    //#ifdef MP-WEIXIN
    wxLogin()
    //#endif
    
    //#ifndef MP-WEIXIN
    uni.showToast({
      title: '请在微信小程序中使用',
      icon: 'none'
    })
    //#endif
  } else {
    // 已登录，跳转到个人中心
    uni.navigateTo({
      url: '/pages/mine/index'
    })
  }
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
        
        // 登录成功处理
        if (pendingTarget.value) {
          // 有待跳转的页面，先显示登录成功，然后跳转
          uni.showToast({
            title: '登录成功',
            icon: 'success',
            duration: 1500
          })
          
          // 延迟跳转到目标页面
          setTimeout(() => {
            const target = pendingTarget.value
            pendingTarget.value = ''
            uni.navigateTo({
              url: target
            })
          }, 1500)
        } else {
          // 正常登录提示
          uni.showToast({
            title: userData.isNewUser ? '欢迎新用户！' : '登录成功',
            icon: 'success',
            duration: 2000
          })
        }
      }).catch((error) => {
        uni.hideLoading()
        console.error('微信登录失败:', error)
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      })
    },
    fail: (error) => {
      uni.hideLoading()
      console.error('获取微信code失败:', error)
      uni.showToast({
        title: '获取微信授权失败',
        icon: 'none'
      })
    }
  })
}

// 检查登录状态并导航
const checkLoginAndNavigate = async (action, targetUrl) => {
  try {
    const result = await requireLogin(action, targetUrl)
    
    if (result === true) {
      // 已登录，直接跳转
      uni.navigateTo({
        url: targetUrl
      })
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
          icon: 'success',
          duration: 1500
        })
        
        // 延迟跳转到目标页面
        setTimeout(() => {
          uni.navigateTo({
            url: targetUrl
          })
        }, 1500)
        
      } catch (error) {
        uni.hideLoading()
        console.error('登录失败:', error)
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      }
    }
  } catch (error) {
    // 用户取消登录或其他错误
    console.log('用户取消登录或登录失败')
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  background-color: #f6f7f8;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: rgba(246, 247, 248, 0.8);
  backdrop-filter: blur(10rpx);
  padding: 20rpx 32rpx;
  padding-top: calc(20rpx + var(--status-bar-height));
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.login-status {
  width: 120rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.status-text {
  font-size: 24rpx;
  color: #138aec;
  font-weight: 500;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 64rpx;
}

.notification-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
}

.notification-icon {
  font-size: 40rpx;
}

.banner-section {
  padding: 32rpx;
  padding-top: 16rpx;
}

.banner-swiper {
  width: 100%;
  height: 360rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.banner-item {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
}

.banner-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.banner-item:active .banner-image {
  transform: scale(1.02);
}

.banner-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  padding: 32rpx;
  padding-bottom: 24rpx;
}

.banner-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.nav-tabs {
  border-bottom: 2rpx solid #e5e7eb;
  margin-top: 32rpx;
}

.tab-container {
  display: flex;
  padding: 0 32rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  border-bottom: 4rpx solid transparent;
}

.tab-active {
  border-bottom-color: #138aec;
}

.tab-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #6b7280;
}

.tab-active .tab-text {
  color: #138aec;
  font-weight: bold;
}

.article-section {
  padding: 32rpx;
}

.section-header {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 40rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8rpx;
}

.section-subtitle {
  margin-bottom: 16rpx;
}

.subtitle-text {
  font-size: 24rpx;
  color: #6b7280;
}

.articles-loading {
  text-align: center;
  padding: 80rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #6b7280;
}

.articles-empty {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #9ca3af;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.article-item {
  display: flex;
  align-items: center;
  gap: 32rpx;
  padding: 24rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.article-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4rpx;
}

.article-category {
  font-size: 24rpx;
  color: #138aec;
  font-weight: 500;
}

.article-read-count {
  font-size: 20rpx;
  color: #9ca3af;
}

.article-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.article-desc {
  font-size: 24rpx;
  color: #6b7280;
  line-height: 1.4;
}

.article-time {
  font-size: 20rpx;
  color: #9ca3af;
  margin-top: 4rpx;
}

.article-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

</style>
