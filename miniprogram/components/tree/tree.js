const fieldCode = 'code'
const fieldName = 'name'

function splitKeyToArray(key) {
  // 把字符串 'nodes[0].nodes[1].nodes[1]' 分解为数组：
  // ['nodes[0]', 'nodes[0].nodes[1]', 'nodes[0].nodes[1].nodes[1]']
  const array = key.split('.')
  let result = []
  for (var i = 0; i < array.length; i++) {
    let resultKey = array[0]
    let temp = 0
    while (temp < i) {
      resultKey += '.' + array[temp + 1]
      temp++
    }
    result.push(resultKey)
  }
  return result
}
function getValueByPath(obj, path, def) {
  var stringToPath = function (path) {
    if (typeof path !== 'string') return path
    var output = []
    path.split('.').forEach(function (item, index) {
      item.split(/\[([^}]+)\]/g).forEach(function (key) {
        if (key.length > 0) {
          output.push(key)
        }
      })
    })
    return output
  }
  path = stringToPath(path)
  var current = obj
  for (var i = 0; i < path.length; i++) {
    if (!current[path[i]]) return def
    current = current[path[i]]
  }

  return current
}
function doWithTree(nodes, func) {
  if (Array.isArray(nodes) && nodes.length) {
    nodes.forEach(node => {
      func(node)
      if (Array.isArray(node.nodes) && node.nodes.length) {
        doWithTree(node.nodes, func)
      }
    })
  }
}
function updateTree(nodes, exceptCodes, updateNode, updateFields, dataObj = {}, upataNodeData = {}) {
  let updateNodes = {}
  if (Array.isArray(nodes) && nodes.length > 0) {
    for (var node of nodes) {
      if (exceptCodes && exceptCodes.length) {
        if (exceptCodes.indexOf(node[fieldCode]) >= 0) {
          if (Array.isArray(node.nodes) && node.nodes.length) {
            updateTree(node.nodes, exceptCodes, updateNode, updateFields, dataObj, upataNodeData)
          }
          continue
        }
      }
      for (let field of updateFields) {
        if (field === 'open') {
          if (node.unfold) {
            continue
          }
        } else if (field === 'checked') {
          if (node.disabled || node.checked === updateNode[field]) {
            continue
          }
        }
        node[field] = updateNode[field]
        if (node.key) {
          dataObj[node.key + '.' + field] = updateNode[field]
          upataNodeData[node.code] = updateNode[field]
        }
        if (node.nodesKey) {
          updateNodes[node.nodesKey + '.' + field] = updateNode[field]
        }
      }
      if (Array.isArray(node.nodes) && node.nodes.length) {
        updateTree(node.nodes, exceptCodes, updateNode, updateFields, dataObj, upataNodeData)
      }
    }
  }
  return updateNodes
}

function searchTree(element, id) {
  if (element[fieldCode] === id) {
    return element
  } else if (Array.isArray(element.nodes) && element.nodes.length) {
    var i
    var result = null
    for (i = 0; result == null && i < element.nodes.length; i++) {
      result = searchTree(element.nodes[i], id)
    }
    return result
  }
  return null
}

function updateNodes(element, keyValue) {
  Object.keys(keyValue).forEach(key => {
    element[key] = keyValue[key]
  })
  if (Array.isArray(element.nodes) && element.nodes.length) {
    for (let i = 0; i < element.nodes.length; i++) {
      updateNodes(element.nodes[i], keyValue)
    }
  }
}
Component({
  properties: {
    // [{ code, name, nodes:[], checked:0.未选中，1.选中, 2.部分选中 }]
    nodes: Array,
    // 树组件根节点在页面上的 id
    rootId: {
      type: String,
      value: 'tree'
    }
  },

  data: {
    // 根节点数据，总共已选中的节点个数
    checkedNodesCount: 0
  },

  methods: {
    getSelectedNodes() {
      // 获取选择到的节点数据的数组
      const originalNodes = this.getTreeRootData()
      const selectedNodes = []
      const that = this
      doWithTree(originalNodes, node => {
        if (node.checked > 0 && !node.disabled) {
          selectedNodes.push({
            rootId: that.data.rootId,
            [fieldCode]: node[fieldCode],
            [fieldName]: node[fieldName],
            key: node.key,
            parentId: node.parentId,
            checked: node.checked,
            nodes: node.nodes,
            level: node.level
          })
        }
      })
      return selectedNodes
    },

    disableNodes(nodesIdList) {
      // TODO
      if (!Array.isArray(nodesIdList) || !nodesIdList.length) {
        return
      }
      let dataObj = {}
      // 初始化时禁用某些节点，如果父节点被禁用，那所有子节点也会被禁用
      const originalNodes = this.getTreeRootData()
      if (!(Array.isArray(originalNodes) && originalNodes.length)) {
        return
      }
      nodesIdList.forEach(nodeId => {
        const node = searchTree(originalNodes[0], nodeId)
        if (node) {
          dataObj[`${node.key}.disabled`] = true
          updateTree(node.nodes, [], {
            disabled: true
          }, ['disabled'], dataObj)
        }
      })

      if (!Object.keys(dataObj).length) {
        return
      }
      // TODO: 所有子节点被禁用时，父节点也要被禁用
      const treeRoot = this.getTreeRoot()
      treeRoot.setData(dataObj)
    },

    checkAll(unCheckAll = false) {
      const rootId = this.data.rootId
      const originalNodes = this.getTreeRootData()
      let checked = unCheckAll ? 0 : 1

      let dataObj = {},
        secondObj = {},
        total = 0
      if (!originalNodes[0].disabled) {
        doWithTree(originalNodes, node => {
          let keyName = node.key.replace('nodes', rootId)
          if (node.level < 3 && node.nodes.length == 0 && !node.disabled) {
            const subData = this.getSubsetData(node.code)
            doWithTree(subData, subNode => {
              node.checked = checked
              subNode.checked = checked
              if (node.level < 3) {
                dataObj[keyName + ".checked"] = checked
              } else {
                secondObj[keyName + ".checked"] = checked
              }
              const hasChildren = subNode.nodes && subNode.nodes.length
              if (checked && !hasChildren) {
                total++
              }
            })
            secondObj[keyName + ".nodes"] = subData
          } else {
            if (!node.disabled && node.checked !== checked) {
              node.checked = checked
              if (node.level <= 1) {
                // 只选中 0, 1 级
                dataObj[keyName + '.checked'] = checked
              } else {
                // 其它级的节点 加到 secondObj 里，异步更新
                secondObj[keyName + '.checked'] = checked
              }
              const hasChildren = node.nodes && node.nodes.length
              if (checked && !hasChildren) {
                total++
              }
            }
          }
        })
      }
      return {
        // 第一次更新的节点集合
        dataObj,
        // 第二次异步更新的节点集合
        secondObj,
        total
      }
    },

    updateCheckedNodesCount() {
      const originalNodes = this.getTreeRootData()
      let checkedCount = 0
      let thisPageIsAllSelect = true

      doWithTree(originalNodes, node => {
        if (node.checked === 1 && (!node.nodes || !node.nodes.length) && !node.disabled) { // 叶子选中才累加数量
          checkedCount++
        }
        if (node.checked !== 1 && (!node.nodes || !node.nodes.length)) {
          thisPageIsAllSelect = false
        }
      })

      this.getTreeRoot().setData({
        checkedNodesCount: checkedCount,
        thisPageIsAllSelect
      })
      return checkedCount
    },

    getCurrentPage() {
      var pages = getCurrentPages()
      return pages[pages.length - 1]
    },

    getTreeRoot() {
      const page = this.getCurrentPage()
      const rootId = this.data.rootId || 'tree'
      const tree = page.selectComponent(`#${rootId}`)
      return tree
    },

    getTreeRootData() {
      return this.getTreeRoot().data['nodes']
    },

    unFoldAllNodes() {
      // 把所有打开的节点关闭上
      const originalNodes = this.getTreeRootData()
      const setDataObj = {}
      // console.log("originalNodes",originalNodes)
      doWithTree(originalNodes, node => {
        if (node.open && node.open === true) {
          node.open = false
          setDataObj[node.key + '.open'] = false
        }
      })
      if (Object.keys(setDataObj).length) {

        this.getTreeRoot().setData(setDataObj)
      }
    },

    unFoldOtherNodes(openedCodes, setDataObj) {
      // 除了已打开的子级及父级，其它同级或相邻的都要关闭
      // const dataName = this.data.dataName
      const originalNodes = this.getTreeRootData()
      doWithTree(originalNodes, node => {
        if (node.open && !openedCodes.includes(node.key)) {
          node.open = false
          setDataObj[node.key + '.open'] = false
        }
      })
    },

    onToggle(event) {
      const that = this
      let index = parseInt(event.currentTarget.dataset.index),
        node = that.data.nodes[index]
      if (node.unfold) {
        return
      }
      const toOpen = node.open ? false : true
      const nodeKey = node.key
      const dataObj = {
        [`${nodeKey}.open`]: toOpen
      }
      node.open = toOpen
      if (toOpen) {
        const keysArray = splitKeyToArray(nodeKey)
        that.unFoldOtherNodes(keysArray, dataObj)
      }

      const treeRoot = that.getTreeRoot()
      console.log("dataObj", dataObj)
      treeRoot.setData(dataObj)
      that.triggerEvent('toggle', {
        node: node
      }, {
        bubbles: true,
        composed: true
      })
    },

    updateParentNodes(levels, treeRoot, toCheck, index, dataObj) {
      // 从最近的父辈开始处理
      for (var i = levels.length - 2; i >= 0; i--) {
        let fatherKey = levels[0]
        let temp = 1
        while (temp <= i) {
          fatherKey += '.' + levels[temp]
          temp++
        }
        const father = getValueByPath(treeRoot.data, fatherKey) // treeRoot.data[fatherKey]
        if (!father) {
          continue
        }
        let parentToCheck = 0
        if (father.nodes && father.nodes.length) {
          if (i === levels.length - 2) {
            // 当前节点所在的层，赋值当前点击节点 toCheck
            const currentNode = father.nodes[index]
            if (currentNode) {
              currentNode.checked = toCheck
            }
          }
          // 子级 存在 部分选中 或 不选中
          parentToCheck = father.nodes.findIndex(n => (!n.checked || n.checked === 2)) >= 0 ? 2 : 1
          // 如果 子级 全部都是 不选中
          if (father.nodes.filter(n => !n.checked || n.disabled == true).length === father.nodes.length) {
            parentToCheck = 0
          }
        }
        father.checked = parentToCheck
        dataObj[`${fatherKey}.checked`] = parentToCheck
      }
    },

    getSubsetData(code) {
      const rootId = this.data.rootId
      const page = this.getCurrentPage()
      let getNodes = page.getNodesDataFun()
      let subsetData = []
      doWithTree(getNodes[rootId][0].nodes, node => {
        if (node.code == code) {
          subsetData = node.nodes
        }
      })
      return subsetData
    },
    onCheckChange(event) {
      console.log("选择回调")
      const that = this
      let index = parseInt(event.currentTarget.dataset.index),
        node = this.data.nodes[index]
      console.log("node", node)
      console.log("this.data", this.data)
      if (node.disabled) {
        return
      }
      const toCheck = node.checked >= 1 ? 0 : 1
      const nodeKey = node.key

      node.checked = toCheck
      const dataObj = {
        [`${nodeKey}.checked`]: toCheck
      }
      const upataNodeData = {
        [`${node.code}.checked`]: toCheck
      }
      if (node.nodes && node.nodes.length) {
        updateTree(node.nodes, [], {
          checked: toCheck
        }, ['checked'], dataObj, upataNodeData)
      }
      // 处理父辈
      const treeRoot = this.getTreeRoot()
      const levels = nodeKey.split('.')
      // 从最近的父辈开始处理
      that.updateParentNodes(levels, treeRoot, toCheck, index, dataObj, upataNodeData)
      // console.log("upataNodeData", upataNodeData)
      // console.log("dataObj", dataObj)
      treeRoot.setData(dataObj)

      const checkedCount = that.updateCheckedNodesCount()
      const result = {
        node: node,
        checked: checkedCount
      }
      that.triggerEvent('checkChange', result, {
        bubbles: true,
        composed: true
      })
    }
  }
})