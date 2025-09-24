import request from '@/utils/request'

// 获取微信公众号文章列表（旧接口）
export function getWechatArticles(params = {}) {
  return request({
    url: '/c/wechat/articles',
    method: 'get',
    params: {
      limit: 3,  // 默认获取最近3篇
      ...params
    }
  })
}

// 获取最新3篇文章（新接口）
export function getLatestArticles() {
  return request({
    url: '/c/wechat/article/latest',
    method: 'get'
  })
}

// 获取公众号文章详情
export function getWechatArticleDetail(articleId) {
  return request({
    url: `/c/wechat/articles/${articleId}`,
    method: 'get'
  })
}

// 记录文章点击量
export function recordArticleClick(articleId) {
  return request({
    url: `/c/wechat/articles/${articleId}/click`,
    method: 'post'
  })
}

// 搜索公众号文章
export function searchWechatArticles(keyword, params = {}) {
  return request({
    url: '/c/wechat/articles/search',
    method: 'get',
    params: {
      keyword,
      limit: 10,
      ...params
    }
  })
}

// 获取文章分类
export function getArticleCategories() {
  return request({
    url: '/c/wechat/articles/categories',
    method: 'get'
  })
}
