// pages/tree/tree.js 
let nodeAllData
const {
  doWithTree,
  getValueByPath,
  getAreasList
} = require("../../utility/public")
const daquArray = ['dongBei', 'huaDong', 'huaZhong', 'huaNan', 'huaBei', 'xiBei', 'xiNan', 'gangAoTai']
Page({

  /**
   * 页面的初始数据
   */
  data: {
    areasname: "",

    selectedNodeCount: 0,
    allSelect: false,
    allSaItemCode: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    options.allSaItemCode = '[210000, 210100, 210102, 220200, 220202, 220203]'
    options.allSaItemName = '["unconditionalPinkage", "unconditionalPinkage", "unconditionalPinkage", "unconditionalPinkage", "unconditionalPinkage", "nonDistributionArea"]'
    options.areasname = "nonDistributionArea"

    nodeAllData = getAreasList()
    let updataData = {}
    if (options.allSaItemCode) {
      updataData.allSaItemCode = JSON.parse(options.allSaItemCode)
      updataData.allSaItemName = JSON.parse(options.allSaItemName)
    }
    if (options.areasname) {
      updataData.areasname = options.areasname
    }

    this.setData(updataData)
    if (this.data.allSaItemCode.length == 0) {
      let noNodesData = this.initializesSubset(JSON.parse(JSON.stringify(nodeAllData)), 1)
      this.setData(noNodesData)
    } else {
      this.combinationSaItemArr()
    }
  },

  combinationSaItemArr() {
    let getNodes = nodeAllData
    let allSaItemNameList = this.data.allSaItemName
    let allSaItemCode = this.data.allSaItemCode
    let thisPageIsAllSelect = true
    let selectedNodeCount = 0
    let fatherCodeArr = []
    let fatherLevelsArr = []
    const areasname = this.data.areasname
    daquArray.forEach(daqu => {
      doWithTree(getNodes[daqu][0].nodes, node => {
        let isIndexOf = allSaItemCode.indexOf(node.code)
        const areasnameArrIndexOf = isIndexOf != -1 ? allSaItemNameList[isIndexOf] : ''
        if (isIndexOf >= 0) {
          if (node.level === 3 && areasnameArrIndexOf === areasname) getNodes[daqu][0].checked = 2
        }
        const isHasField = areasnameArrIndexOf == areasname || areasnameArrIndexOf.indexOf(areasname) != -1
        if (Array.isArray(node.nodes) && node.nodes.length) {
          if (isIndexOf != -1 && isHasField) {
            node.checked = 2
          }
        } else {
          if (isIndexOf != -1) {
            node.checked = 1
            node.disabled = isHasField ? false : true
            if (fatherCodeArr.indexOf(node.parentId) == -1) {
              fatherLevelsArr.push({
                [daqu]: node.key.split('.')
              })
              fatherCodeArr.push(node.parentId)
            }
          }
        }
        if (node.checked === 1 && (!node.nodes || !node.nodes.length) && !node.disabled) { // 叶子选中才累加数量
          selectedNodeCount += 1
        }
        if (node.checked !== 1 && !node.disabled && (!node.nodes || !node.nodes.length)) {
          thisPageIsAllSelect = false
        }
      })
    })
    nodeAllData = getNodes
    this.getFatherData(fatherLevelsArr, getNodes)
    let pageData = this.initializesSubset(JSON.parse(JSON.stringify(getNodes)), 1)
    pageData.selectedNodeCount = selectedNodeCount
    pageData.allSelect = thisPageIsAllSelect
    this.setData(pageData)
  },
  getFatherData(fatherLevelsArr, getNodes) {
    fatherLevelsArr.forEach(item => {
      let levelsKeys = Object.keys(item)[0]
      let levels = Object.values(item)[0]
      for (let i = levels.length - 2; i >= 0; i--) {
        let fatherKey = levels[0]
        let temp = 1
        while (temp <= i) {
          fatherKey += '.' + levels[temp]
          temp++
        }
        const father = getValueByPath({
          nodes: getNodes[levelsKeys]
        }, fatherKey)
        if (!father) {
          continue
        }
        let parentToCheck = 0
        let isDisabledParent = false
        if (father.nodes && father.nodes.length) {
          if (father.nodes.filter(n => (!n.disabled && n.checked > 0)).length > 0) {
            parentToCheck = 2
          }
          if (father.nodes.filter(n => n.checked == 1).length === father.nodes.length) {
            parentToCheck = 1
          }
          if (father.nodes.filter(n => n.disabled).length === father.nodes.length) {
            isDisabledParent = true
          }
          father.checked = parentToCheck
          father.disabled = isDisabledParent
        }
      }
    })
  },
  getNodesDataFun() {
    return nodeAllData
  },
  onTreeToggle(event) {
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
    // lastPage['getNodeDataFun'](nodeAllData)
    this.getNodeDataFun(nodeAllData)
  },
  onTreeChecked(event) {
    const that = this
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
      console.log("已选的数量", selectedNodeCount)
      that.setData({
        selectedNodeCount,
        allSelect: falseNumber == 0 ? true : false
      })
    }
  },
  getNodeDataFun(nodeAll) {
    console.log("确认选择的地区", nodeAll)
    let areaName = []
    let expectedOutcome = {
      codeList: [],
      nameList: []
    }
    let choiceArea = []
    for (let daquId in nodeAll) {
      doWithTree(nodeAll[daquId][0].nodes, node => {
        if (node.checked > 0 && !node.disabled) {
          expectedOutcome.nameList.push(node.name)
          expectedOutcome.codeList.push(node.code)
          if (node.checked == 1 && node.level == 3) choiceArea.push(node)
        }
        if (node.level == 2 && !node.disabled && node.checked > 0) {
          if (node.checked == 1) {
            if (node.nodes.filter(fil => fil.checked != 1 || fil.disabled).length > 0) {
              areaName.push(node.name + '部分地区')
            } else {
              areaName.push(node.name)
            }
          } else {
            areaName.push(node.name + '部分地区')
          }
        }
      })
    }
    console.log('所选择的区', choiceArea)
    console.log('所选择的市', areaName)
    console.log('确认选择结果result', expectedOutcome)
  },
  checkAllNodes() {
    const that = this
    const allSelect = that.data.allSelect || false
    const unCheckAll = allSelect ? true : false
    let dataObj = {},
      secondObj = {},
      total = 0,
      checked = unCheckAll ? 0 : 1
    daquArray.map(daquId => { 
      const result = that.selectComponent(`#${daquId}`).checkAll(unCheckAll)
      Object.assign(dataObj, result.dataObj)
      if (result.secondObj && Object.keys(result.secondObj).length) {
        Object.assign(secondObj, result.secondObj)
      }
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