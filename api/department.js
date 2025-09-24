import request from '@/utils/request'

// 获取科室列表
export function getDeptList(query) {
  return request({
    url: '/c/dept/list',
    method: 'get',
    params: query
  })
}

// 根据科室ID获取医生列表
export function getDoctorsByDept(query) {
  return request({
    url: '/c/dept/doc-list',
    method: 'get',
    params: query
  })
}

// 获取医生详情
export function getDoctorDetail(doctorId) {
  return request({
    url: `/c/doctor/${doctorId}`,
    method: 'get'
  })
}

// 获取医生可预约时间
export function getAvailableTime(doctorId, date) {
  return request({
    url: '/c/appointment/available-time',
    method: 'get',
    params: {
      doctorId,
      date
    }
  })
}

// 提交预约
export function submitAppointment(data) {
  return request({
    url: '/c/appointment/submit',
    method: 'post',
    data: data
  })
}
