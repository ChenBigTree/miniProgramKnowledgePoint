// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require("request-promise")
cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext() 
  return  rp('https://api.weixin.qq.com/sns/jscode2session?appid=wx99155eb36a6a05c7&secret=9775e6aafc4ab3b41c9f168aa41e9881&js_code='+event.code+'&grant_type=authorization_code' )
}