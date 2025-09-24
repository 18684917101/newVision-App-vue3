const TokenKey = 'App-Token'
const RefreshTokenKey = 'App-Refresh-Token'
const TokenExpireKey = 'App-Token-Expire'

export function getToken() {
  return uni.getStorageSync(TokenKey)
}

export function setToken(token, expireTime) {
  uni.setStorageSync(TokenKey, token)
  if (expireTime) {
    uni.setStorageSync(TokenExpireKey, expireTime)
  }
  return token
}

export function removeToken() {
  uni.removeStorageSync(TokenKey)
  uni.removeStorageSync(TokenExpireKey)
  uni.removeStorageSync(RefreshTokenKey)
}

export function getRefreshToken() {
  return uni.getStorageSync(RefreshTokenKey)
}

export function setRefreshToken(refreshToken) {
  return uni.setStorageSync(RefreshTokenKey, refreshToken)
}

export function removeRefreshToken() {
  return uni.removeStorageSync(RefreshTokenKey)
}

export function isTokenExpired() {
  const expireTime = uni.getStorageSync(TokenExpireKey)
  if (!expireTime) {
    return false
  }
  
  const currentTime = Date.now()
  return currentTime >= expireTime
}

export function getTokenExpireTime() {
  return uni.getStorageSync(TokenExpireKey)
}

export function setTokenExpireTime(expireTime) {
  return uni.setStorageSync(TokenExpireKey, expireTime)
}
