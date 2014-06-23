

function checkModule() {
    var mytestImplPath = require.resolve('./mytest.js');    
    delete require.cache[mytestImplPath];
    var mytestImpl = require('./mytest.js');    
    return mytestImpl;
}

module.exports = checkModule()

module.exports.reload = function() {
    var newModule = checkModule()
    for (i in newModule) this[i] = newModule[i]
};

