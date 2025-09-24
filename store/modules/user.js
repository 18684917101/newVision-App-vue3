import { defineStore } from 'pinia'
import { ref } from 'vue'
import config from '@/config'
import storage from '@/utils/storage'
import constant from '@/utils/constant'
import { isHttp, isEmpty } from "@/utils/validate"
import { getInfo, login, logout } from '@/api/login'
import { wxLogin, getWxUserInfo, wxLogout } from '@/api/wechat'
import { getToken, removeToken, setToken, isTokenExpired, setRefreshToken } from '@/utils/auth'
import defAva from '@/static/images/profile.jpg'

const baseUrl = config.baseUrl

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const id = ref(storage.get(constant.id))
  const name = ref(storage.get(constant.name))
  const avatar = ref(storage.get(constant.avatar))
  const roles = ref(storage.get(constant.roles))
  const permissions = ref(storage.get(constant.permissions))
  
  // 微信用户特有信息
  const openid = ref(storage.get('openid'))
  const nickname = ref(storage.get('nickname'))
  const phone = ref(storage.get('phone'))
  const isNewUser = ref(storage.get('isNewUser'))

  const SET_TOKEN = (val) => {
    token.value = val
  }
  const SET_ID = (val) => {
    id.value = val
    storage.set(constant.id, val)
  }
  const SET_NAME = (val) => {
    name.value = val
    storage.set(constant.name, val)
  }
  const SET_AVATAR = (val) => {
    avatar.value = val
    storage.set(constant.avatar, val)
  }
  const SET_ROLES = (val) => {
    roles.value = val
    storage.set(constant.roles, val)
  }
  const SET_PERMISSIONS = (val) => {
    permissions.value = val
    storage.set(constant.permissions, val)
  }
  
  // 微信用户信息设置方法
  const SET_OPENID = (val) => {
    openid.value = val
    storage.set('openid', val)
  }
  const SET_NICKNAME = (val) => {
    nickname.value = val
    storage.set('nickname', val)
  }
  const SET_PHONE = (val) => {
    phone.value = val
    storage.set('phone', val)
  }
  const SET_IS_NEW_USER = (val) => {
    isNewUser.value = val
    storage.set('isNewUser', val)
  }

  // 登录
  const loginAction = (userInfo) => {
    const username = userInfo.username.trim()
    const password = userInfo.password
    const code = userInfo.code
    const uuid = userInfo.uuid
    return new Promise((resolve, reject) => {
      login(username, password, code, uuid).then(res => {
        setToken(res.token)
        SET_TOKEN(res.token)
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 获取用户信息
  const getInfoAction = () => {
    return new Promise((resolve, reject) => {
      getInfo().then(res => {
        const user = res.user
        let avatar = user.avatar || ""
        if (!isHttp(avatar)) {
          avatar = (isEmpty(avatar)) ? defAva : baseUrl + avatar
        }
        const userid = (isEmpty(user) || isEmpty(user.userId)) ? "" : user.userId
        const username = (isEmpty(user) || isEmpty(user.userName)) ? "" : user.userName
        if (res.roles && res.roles.length > 0) {
          SET_ROLES(res.roles)
          SET_PERMISSIONS(res.permissions)
        } else {
          SET_ROLES(['ROLE_DEFAULT'])
        }
		SET_ID(userid)
        SET_NAME(username)
        SET_AVATAR(avatar)
        resolve(res)
      }).catch(error => {
        reject(error)
      })
    })
  }

  // 微信登录
  const wxLoginAction = (code) => {
    return new Promise((resolve, reject) => {
      if (!code) {
        reject(new Error('微信授权码不能为空'))
        return
      }

      wxLogin(code).then(res => {
        // 检查响应数据
        if (!res || res.code !== 200) {
          reject(new Error(res?.msg || '登录失败'))
          return
        }

        const userData = res.data
        if (!userData || !userData.token) {
          reject(new Error('登录响应数据异常'))
          return
        }

        // 保存token和过期时间
        const expireTime = userData.expireTime || (Date.now() + 7 * 24 * 60 * 60 * 1000) // 默认7天过期
        setToken(userData.token, expireTime)
        SET_TOKEN(userData.token)
        
        // 保存刷新token（如果有）
        if (userData.refreshToken) {
          setRefreshToken(userData.refreshToken)
        }
        
        // 保存微信用户信息
        SET_ID(userData.userId || '')
        SET_OPENID(userData.openid || '')
        SET_NICKNAME(userData.nickname || '')
        SET_PHONE(userData.phone || '')
        SET_IS_NEW_USER(userData.isNewUser || false)
        
        // 设置用户名和头像
        const displayName = userData.nickname || `用户${userData.userId}` || '微信用户'
        SET_NAME(displayName)
        
        // 如果有微信头像则使用，否则使用默认头像
        const avatarUrl = userData.avatarUrl || defAva
        SET_AVATAR(avatarUrl)
        
        console.log('微信登录数据保存完成:', {
          userId: userData.userId,
          nickname: userData.nickname,
          isNewUser: userData.isNewUser
        })
        
        resolve({
          ...userData,
          isNewUser: userData.isNewUser || false
        })
      }).catch(error => {
        console.error('微信登录API调用失败:', error)
        
        // 处理不同类型的错误
        if (error.code === 'NETWORK_ERROR') {
          reject(new Error('网络连接失败，请检查网络设置'))
        } else if (error.code === 40029) {
          reject(new Error('微信授权码无效，请重试'))
        } else {
          reject(new Error(error.message || '登录服务暂时不可用'))
        }
      })
    })
  }

  // 退出系统
  const logOutAction = () => {
    return new Promise((resolve, reject) => {
      logout(token.value).then(() => {
        SET_TOKEN('')
        SET_ROLES([])
        SET_PERMISSIONS([])
        SET_OPENID('')
        SET_NICKNAME('')
        SET_PHONE('')
        SET_IS_NEW_USER(false)
        removeToken()
        storage.clean()
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  }

  return {
    token,
    id,
    name,
    avatar,
    roles,
    permissions,
    openid,
    nickname,
    phone,
    isNewUser,
    SET_AVATAR,
    login: loginAction,
    wxLogin: wxLoginAction,
    getInfo: getInfoAction,
    logOut: logOutAction
  }
})
