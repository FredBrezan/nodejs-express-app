console.log('App: started')

var util = require('util');
var swe = require('swe');
var childProc = require('child_process')

function fork(procPath) {
    var child = childProc.fork(procPath)
    var childId = util.format('[%s:%d]', procPath, child.pid)
    var action = '';
    console.log('%s: forked', childId)
    child.on('error', function(err)       { console.log('%s: error: %s', childId, err) });
    child.on('exit', function(code, sig)  { 
        console.log('%s: exit: code=%d signal=%d', childId, code, sig, action) 
        if (action == 'restart') fork(procPath)
    });
    child.on('close', function(code, sig) { console.log('%s: close: code=%d signal=%d', childId, code, sig) });
    child.on('disconnect', function()     { console.log('%s: disconnect', childId) });
    child.on('message', function(m) {            
        console.log('%s: message "%s"', childId, m);
        action = m;
        child.kill();
    });
}

fork('./appctrl.js')

console.log('App: running ..')
