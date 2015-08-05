// server.js
//==================================================================================================

var express = require('express');
var util = require('util');
var swe = require('swe');
var path = require('path');

//##################################################################################################

var JadeLocals = {

    pretty  : true,
    fmt     : util.format,
    editor  : 'tinymce',

    a: function(text, opts) {
        var s = '';
        for (var i in opts) s += util.format(' %s="%s"', i, opts[i]);
        return util.format('<a%s>%s</a>', s, text);
    },

    inc: function(incpath) {
        var type = path.extname(incpath)
        //console.log(incpath)
        switch(type) {
            case '.js': return util.format('<script src="%s" type="text/javascript"></script>\n', incpath)
            case '.css': return util.format('<link href="%s" type="text/css" rel="stylesheet">\n', incpath)
            default: return util.format('<!-- UNKOWN INCLUDE TYPE %s for %s -->\n', type, incpath)
        }
    },

    dump: function() {
        s = ''
        for (x in this) s += (x + " ");
        return s;
    },
}
//##################################################################################################

swe.Class("PageController").implementation = {

    getPage: function(pagePath) {
        if (pagePath == '/') return '';
        else return null;
    }

}

//##################################################################################################

swe.Class("Server").implementation = {

    __init__: function() {
        this.app = express();
        this.port = 9234;
        this.server = null;
        this.pageController = new PageController()
    },

    initViewEngine: function() {
        //var jlocals = new JadeLocals()
        this.app.set('view engine', 'jade')
        this.app.locals.module = module
        this.app.locals.util = util
        //for (x in jlocals) this.app.locals[x] = jlocals[x];
    },

    initRouteForPages: function() {
        var self = this;
        var router = express.Router()
        router.get('/*', function(req, resp) {
            console.log('Server: route url=%s base=%s original=%s method=%s', req.url, req.baseUrl, req.originalUrl, req.method)
            var page = self.pageController.getPage(req.url)
            resp.locals.path = req.url
            if (page == null) resp.redirect('/action/page/create' + req.url)
            else resp.render('page')
        })
        return router;
    },

    start: function() {
        var self = this
        this.initViewEngine()
        this.app.use(express.static(__dirname + '/common'))
        this.app.use('/pages', this.initRouteForPages())
        this.app.use('/action', function(req, resp, next) {
            console.log('action')
            resp.send('action ' + req.url)
        })
        this.server = this.app.listen(this.port)
        console.log('Server: started on port %d', this.port)
        process.send('started')
    }
}

//##################################################################################################

var server = new Server()
server.start()

//##################################################################################################