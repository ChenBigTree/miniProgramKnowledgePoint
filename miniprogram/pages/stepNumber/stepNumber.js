// pages/stepNumber/stepNumber.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 展示本地存储能力
    wx.login({
      success: res => {
        console.log("res",res)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        if (res.code) {
          var APPID = 'wx99155eb36a6a05c7'
          var SECRET = '9775e6aafc4ab3b41c9f168aa41e9881'
          var JSCODE = res.code
          var session_key
          wx.request({
            url: 'https://api.weixin.qq.com/sns/jscode2session?appid=' + APPID + '&secret=' + SECRET + '&js_code=' + JSCODE + '&grant_type=authorization_code',
            data: {
              //code: res.code
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success: function (res) {
              console.log("res.data ",res.data)
              session_key = res.data.session_key
              console.log("session_key: ",session_key)
              wx.getWeRunData({
                success(res) {
                  console.log("res",res)
                  const encryptedRunData = res.encryptedData
                  const runiv = res.iv
                  console.log("加密的数据: ",encryptedRunData)
                  var pc = new WXBizDataCrypt(APPID, session_key)
                  var tmpdata = pc.decryptData(encryptedRunData, runiv)
                  console.log("解密后data：", tmpdata)
                },
                fail(err) {
                  console.log("err",err)
                }
              })
            },
            fail(err){
              console.log("request",err)
            }
          })
        } else {
          console.log('失败' + res.errMsg)
        }
      }
    })
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})