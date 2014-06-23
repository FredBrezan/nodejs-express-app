var jade = require('jade')

var html = jade.renderFile('views/index.jade', {compileDebug: true})

console.log(require.cache)
for (var i in require.cache) console.log(i)

//console.log(html)

