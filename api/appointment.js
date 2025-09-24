import request from '@/utils/request'

// 获取可用号源列表
export function getAvailableSlots(params) {
  return request({
    url: '/c/appointment/slots',
    method: 'get',
    params: params
  })
}

// 根据医生ID获取号源
export function getSlotsByDoctor(doctorId, params = {}) {
  return request({
    url: `/c/appointment/slots/doctor/${doctorId}`,
    method: 'get',
    params: params
  })
}

// 根据医生ID和日期获取号源
export function getSlotsByDoctorAndDate(doctorId, date) {
  return request({
    url: `/c/appointment/slots/doctor/${doctorId}/${date}`,
    method: 'get'
  })
}

// 根据科室ID获取号源
export function getSlotsByDepartment(departmentId, params = {}) {
  return request({
    url: `/c/appointment/slots/department/${departmentId}`,
    method: 'get',
    params: params
  })
}

// 获取号源详情
export function getSlotDetail(id) {
  return request({
    url: `/c/appointment/slots/${id}`,
    method: 'get'
  })
}

// 预约号源（旧接口）
export function bookAppointment(data) {
  return request({
    url: '/c/appointment/book',
    method: 'post',
    data: data
  })
}

// 创建预约挂号（新接口）
export function createAppointment(data) {
  return request({
    url: '/c/appointment',
    method: 'post',
    data: data
  })
}

// 取消预约
export function cancelAppointment(appointmentId) {
  return request({
    url: `/c/appointment/cancel/${appointmentId}`,
    method: 'post'
  })
}

// 获取用户预约历史（旧接口）
export function getUserAppointments(params) {
  return request({
    url: '/c/appointment/user',
    method: 'get',
    params: params
  })
}

// 获取我的预约记录（新接口）
export function getMyAppointments() {
  return request({
    url: '/c/appointment/my',
    method: 'get'
  })
}

// 获取预约详情
export function getAppointmentDetail(appointmentId) {
  return request({
    url: `/c/appointment/${appointmentId}`,
    method: 'get'
  })
}
