// pages/stepNumber/stepNumber.js
var moment = require('../../utils/moment.min');
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
    this.getRun()
  },
  getRun() {
    let getOriginalData = new Promise((resOriginal,errOriginal)=>{
      wx.getSetting({
        success: res => {
          if (!res.authSetting['scope.werun']) {
            wx.authorize({
              scope: 'scope.record',
              success() {
                console.log("允许")
                // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
                wx.startRecord()
              },
              fail() {
                console.log("不允许")
              }
            })
          } else {
            wx.getWeRunData({
              success(res) {
                //由于数据是进行加密的所以我们通过条用云函数的方式进行解密
                wx.cloud.callFunction({
                  name: 'getSessionKey',
                  data: {
                    weRunData: wx.cloud.CloudID(res.cloudID) // 这个 CloudID 值到云函数端会被替换
                  }
                }).then(res=>{
                  resOriginal(res.result.weRunData.data)
                }) 
              }
            })
          }
        }
      })
    
    })
    Promise.all([getOriginalData]).then(el=>{
      console.log(el[0].stepInfoList)
      el[0].stepInfoList.forEach(item=>{
        item.time = moment(item.timestamp*1000).format('YYYY年MM月DD日')
      })
      this.setData({
        WXStepNumber:el[0].stepInfoList
      })
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