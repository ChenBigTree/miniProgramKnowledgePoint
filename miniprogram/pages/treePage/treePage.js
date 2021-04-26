// pages/tree/tree.js 
let nodeAllData
const {
  getAreasList
} = require("./areas")
const {
  doWithTree,
} = require("../../utility/public")
const daquArray = ['dongBei', 'huaDong', 'huaZhong', 'huaNan', 'huaBei', 'xiBei', 'xiNan', 'gangAoTai']
Page({

  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    nodeAllData = getAreasList()
    let noNodesData = this.initializesSubset(JSON.parse(JSON.stringify(nodeAllData)), 1)
    this.setData(noNodesData)
  },
  getNodesDataFun() {
    return nodeAllData
  },
  onTreeToggle(event) {
    // console.log(event)
    const that = this
    const targetId = event.target.id
    console.log('展开', targetId)
    const detail = event.detail
    if (targetId && detail && detail.node) {
      const node = detail.node
      // 打开某个节点时，关闭其它树打开的节点
      daquArray.forEach(daquId => {
        let daqu = that.selectComponent(`#${daquId}`)
        if (node.open == true) {
          if (daquId !== targetId) {
            daqu.unFoldAllNodes()
          }
          if (daquId === targetId && node.nodes.length == 0 && node.level < 3) {
            daqu.setData({
              [node.key + '.nodes']: that.getSubsetData(targetId, detail.node.code)
            })
          }
        }
      })
    }
  },
  initializesSubset(getNodes, num) {
    daquArray.forEach(daqu => {
      doWithTree(getNodes[daqu][0].nodes, node => {
        if (node.level == num) {
          node.nodes = []
        }
      })
    })
    return getNodes
  },
  getSubsetData(daquId, code) {
    let subsetData = []
    doWithTree(nodeAllData[daquId][0].nodes, node => {
      if (node.code == code) {
        subsetData = node.nodes
      }
    })
    return subsetData
  },
  getSelectedNodeCount() {
    let selectedNodeCount = 0
    daquArray.forEach(daquId => {
      doWithTree(nodeAllData[daquId][0].nodes, node => {
        if (node.level == 3 && !node.nodes && node.checked === 1) {
          selectedNodeCount += 1
        }
      })
    })
    return selectedNodeCount
  },
  changeAllBtn() {
    this.setData({
      allSelect: !this.data.allSelect
    })
  },
  getAllCheckedNodes() {
    let pages = getCurrentPages()
    let lastPage = pages[pages.length - 2]
    lastPage['getNodeDataFun'](nodeAllData)

    wx.navigateBack({
      delta: 1
    })
  },
  onTreeChecked(event) {
    const that = this
    console.log("event", event)
    const detail = event.detail
    const targetId = event.target.id
    let falseNumber = 0
    const nodeCodeData = this.getSubsetData(targetId, detail.node.code)
    console.log("页面改变事件nodeCodeData", nodeCodeData)
    let checked = detail.node.checked
    let node = detail.node
    if (detail && targetId) {
      if (node.level == 1) {
        if (node.nodes.length == 0) {
          const nodeCodeData = this.getSubsetData(targetId, detail.node.code)
          nodeCodeData.forEach(codeData => {
            codeData.checked = checked
            codeData.nodes.forEach(code => {
              code.checked = checked
            })
          })
        }
      }
      if (node.level == 0) {
        doWithTree(nodeAllData[targetId][0].nodes, node => {
          node.checked = checked
        })
      }
      daquArray.forEach(daquId => {
        const daqu = that.selectComponent(`#${daquId}`)
        if (daquId !== targetId) {
          daqu.updateCheckedNodesCount()
        }
        if (daqu.data.thisPageIsAllSelect === false) falseNumber += 1
      })
      let selectedNodeCount = that.getSelectedNodeCount()
      console.log("selectedNodeCount", selectedNodeCount)
      that.setData({
        selectedNodeCount,
        allSelect: falseNumber == 0 ? true : false
      })
    }
  },
  checkAllNodes() {
    const that = this
    const allSelect = that.data.allSelect || false
    const unCheckAll = allSelect ? true : false
    let dataObj = {},
      secondObj = {},
      total = 0,
      checked = unCheckAll ? 0 : 1
    console.log("是否全选", checked)
    daquArray.map(daquId => {
      const result = that[daquId].checkAll(unCheckAll)
      Object.assign(dataObj, result.dataObj)
      if (result.secondObj && Object.keys(result.secondObj).length) {
        Object.assign(secondObj, result.secondObj)
      }
      // total += result.total
      nodeAllData[daquId][0].checked = checked
      doWithTree(nodeAllData[daquId][0].nodes, node => {
        node.checked = checked
        if (node.checked == 1 && !node.disabled && node.level === 3) total += 1
      })
    })

    dataObj['allSelect'] = !allSelect
    dataObj['selectedNodeCount'] = total

    that.setData(dataObj)
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