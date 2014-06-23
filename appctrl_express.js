
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

    stop: function(resp) {
        console.log('Controller: stop')
        if (this.child) {
            if (resp) resp.send(fmt('Controller: stopping child %d', this.child.pid));
            this.child.kill()
            this.child = null;
        } else {
            if (resp) resp.send(fmt('Controller: child is already stopped'));            
        }
    },

    start: function(resp) {
        console.log('Controller: start')
        if (this.child) {
            if (resp) resp.send(fmt('Controller: child %d: already running', this.child.pid));            
        } else {
            this.forkServer();
            if (resp) resp.send(fmt('Controller: forked child %d', this.child.pid));
        }
    },
    
    ws_stop: function() {
        if (this.child) {
            var msg = fmt('Controller: stopping child %d', this.child.pid)
            this.child.kill()
            this.child = null;
        } else {
            var msg = fmt('Controller: child is already stopped');
        }
        if (this.socket) this.socket.emit('status', msg);            
        console.log('Controller: stop:', msg)
    },

    ws_start: function() {
        if (this.child) {
            var msg = fmt('Controller: child %d: already running', this.child.pid)
        } else {
            this.forkServer();
            var msg = fmt('Controller: child %d: started', this.child.pid)
        }
        if (this.socket) this.socket.emit('status', msg);            
        console.log('Controller: start:', msg)
    },

    ws_restart: function(resp) {
        console.log('Controller: restart')
        this.ws_stop();
        process.send('restart')
        //this.start(resp);
    },
    
    ws_shutdown: function(resp) {
        console.log('Controller: shutdown')
        this.ws_stop();
        process.send('shutdown')
        //process.exit();
    },

    handleCtrlResp: function(respEventName, ctrlMsg) {
        console.log('Controller: response "%s" sent, handled with with status "%s"', ctrlMsg, respEventName)
    },
    
    sendCtrl: function(resp, msg) {
        var self = this;
        resp.on('finish', function() { self.handleCtrlResp('finish', msg); })
        resp.on('close',  function() { self.handleCtrlResp('close', msg); })
        if (msg in this) this[msg](resp);
    },
    
    boot: function() {
        console.log('Controller: booting ..')
        var self = this;
        this.app.set('view engine', 'jade');
        this.app.use(express.static(__dirname + '/common'))
        this.app.use('/ctrl/start', function(req, resp) { self.sendCtrl(resp, 'start') })
        this.app.use('/ctrl/stop', function(req, resp) { self.sendCtrl(resp, 'stop') }) 
        this.app.use('/ctrl/restart', function(req, resp) { self.sendCtrl(resp, 'restart') })
        this.app.use('/ctrl/shutdown', function(req, resp) { self.sendCtrl(resp, 'shutdown') })
        this.app.get('/', function(req, resp) {
            resp.render('controller')
        })
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
                m = 'ws_' + m
                if (self[m]) self[m]()
            })
        })
        //this.forkServer()
        console.log('Controller: running ..')
    },
    
};

var controller = new Controller();
controller.boot()


