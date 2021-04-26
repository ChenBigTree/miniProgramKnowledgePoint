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

module.exports = {
  getValueByPath,
  doWithTree 
}