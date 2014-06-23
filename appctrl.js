
var swe = require('swe')
var express = require('express')
var iosocket = require('socket.io')
var childProc = require('child_process')
var util = require('util')
var fmt = util.format


swe.Class("Controller").implementation = {
    
    __init__: function() {
        console.log('Controller: __init__');
        this.app = express();
        this.port = 9233;
        this.server = null;
        this.child = null;
        this.version = 5;
    },
    
    forkServer: function() {
        this.child = childProc.fork('./server.js')
        var childPid = this.child.pid
        console.log('Controller: server[%d] forked', childPid)
        var self = this;
        this.child.on('error', function() { console.log('child[%d] event: error', childPid); });
        this.child.on('exit', function() { console.log('child[%d] event: exit', childPid); });
        this.child.on('close', function() { console.log('child[%d] event: close', childPid); });
        this.child.on('disconnect', function() { console.log('child[%d] event: disconnect', childPid); });
    },

    stop: function() {
        if (this.child == null) return
        var msg = fmt('Controller: stopping child %d', this.child.pid)
        this.child.kill()
        this.child = null;
        if (this.socket) this.socket.emit('status', msg);            
        console.log('Controller: stop:', msg)
    },

    start: function() {
        if (this.child != null) return;
        this.forkServer();
        var msg = fmt('Controller: child %d: started', this.child.pid)
        if (this.socket) this.socket.emit('status', msg);            
        console.log('Controller: start:', msg)
    },

    restart: function(resp) {
        console.log('Controller: restart')
        this.stop();
        process.send('restart')
    },
    
    shutdown: function(resp) {
        console.log('Controller: shutdown')
        this.stop();
        process.send('shutdown')
    },

    boot: function() {
        console.log('Controller: booting ..')
        var self = this;
        this.app.set('view engine', 'jade');
        this.app.use(express.static(__dirname + '/common'))
        this.app.get('/', function(req, resp) { resp.render('controller') })
        this.app.get('/pages/*', function(req, resp) { resp.send(req.url) })
        this.server = this.app.listen(this.port)
        
        this.io = iosocket(this.server);
        this.io.on('connection', function(socket) {
            console.log('A WS client connected')
            self.socket = socket
            socket.on('disconnect', function() { 
                self.socket = null
                console.log('client disconnected') 
            })
            socket.on('message', function(m) { 
                console.log('client sent message:', m)
                if (self[m]) self[m]()
            })
        })
        console.log('Controller: running ..')
    },
    
};

var controller = new Controller();
controller.boot()


