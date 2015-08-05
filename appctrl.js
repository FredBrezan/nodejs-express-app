
var express = require('express')
var iosocket = require('socket.io')
var childProc = require('child_process')
var util = require('util')
var path = require('path');
var domain = require('domain')
var swe = require('swe')
var fmt = util.format

//##################################################################################################
JadeLocalsObj = {

    pretty  : false,
    fmt     : util.format,
    editor  : 'tinymce',

    a: function(text, opts) {
        var s = '';
        for (var i in opts) s += util.format(' %s="%s"', i, opts[i]);
        return util.format('<a%s>%s</a>', s, text);
    },

    link: function(text, opts) {
        return function(t) { JadeLocals.a(t == undefined ? text : t, opts) }
    },

    inc: function(incpath) {
        var type = path.extname(incpath)
        //console.log(incpath)
        switch (type) {
            case '.js': return util.format('<script src="%s" type="text/javascript"></script>\n', incpath)
            case '.css': return util.format('<link href="%s" type="text/css" rel="stylesheet">\n', incpath)
            default: return util.format('<!-- UNKOWN INCLUDE TYPE %s for %s -->\n', type, incpath)
        }
    },

    dump: function(v) {
        var s = ''
        for (var x in v)  {
            var t = typeof(v[x])
            var r = v[x]
            if (t == 'object') r = '[object]';
            else if (t == 'function') r = '[function]';
            s += util.format("%s = %s <br>", x, r);
        }
        return s;
    },
}
swe.Class("JadeLocals").implementation = JadeLocalsObj

//##################################################################################################

swe.Class("Controller").implementation = {

    __init__: function() {
        console.log('Controller: __init__');
        this.app = express();
        this.port = 9233;
        this.server = null;
        this.child = null;
        this.version = 5;
    },

    initViewEngine: function() {
        var jlocals =  JadeLocalsObj
        this.app.set('view engine', 'jade')
        this.app.locals.module = module
        this.app.locals.util = util
        for (var x in jlocals) this.app.locals[x] = jlocals[x];
        this.app.locals.jlocals = jlocals
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

    handleRenderErr: function(req, resp, err, html) {
        console.log('Controller: rendering error: ', html)
        resp.render('error', {err: err, html: html})
    },

    handleGetPages: function(req, resp) {
        var self = this
        try {
            //d.add(req)
            //d.add(resp)
            //foo.bar()
            console.log('get pages: url=%s path=%s', req.url, req.path)
            this.app.locals.jlocals.editor = 'ckk'
            this.app.locals.jlocals.pretty = true
            resp.render('controller', { $$: self.app.locals.jlocals }, function(err, html) {
                if (err) self.handleRenderErr(req, resp, err, html)
                else resp.send(html)
            })
        } catch (err) {
            console.log('Caught', err)
        }
    },

    boot: function() {
        console.log('Controller: booting ..')
        var self = this;
        var d = domain.create();
        d.on('error', function (err) {
            console.log("Domain Error", err)
        })
        this.initViewEngine()
        this.app.use(express.static(__dirname + '/common'))
        //this.app.get('/', function(req, resp) { resp.render('controller') })
        this.app.get('/*', function(req, resp) { self.handleGetPages(req, resp) } )
        d.run(function() {
            self.server = self.app.listen(self.port)
        })

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
try {
    controller.boot()
}
catch (e) {
    console.log(e)
}



