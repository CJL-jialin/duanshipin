import request from '../utils/request'

export const authApi = {
  // 登录
  login(username: string, password: string) {
    return request({
      url: '/auth/login',
      method: 'post',
      data: { username, password }
    })
  },

  // 注册
  register(username: string, email: string, password: string) {
    return request({
      url: '/auth/register',
      method: 'post',
      data: { username, email, password }
    })
  },

  // 获取当前用户信息
  getCurrentUser() {
    return request({
      url: '/user/me',
      method: 'get'
    })
  },

  // 更新用户信息
  updateProfile(data: any) {
    return request({
      url: '/user/profile',
      method: 'put',
      data
    })
  }
}
