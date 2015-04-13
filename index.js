var http = require('http');
var path = require('path');
var fs = require('fs');
var hyperstream = require('hyperstream');
var vstr = require('virtual-dom-stringify');
var Router = require('routes');

var pubdir = path.join(__dirname, 'public');
var bulk = require('bulk-require');
var render = bulk(path.join(__dirname, 'render'), ['*.js']);
var ecstatic = require('ecstatic')(pubdir);

module.exports = function (db) {
    var router = Router();
    
    router.addRoute('/', function (req, res, m) {
        read('layout.html').pipe(hyperstream({
            '#content': vstr(render.root())
        })).pipe(res);
    });
    
    return function (req, res) {
        var m = router.match(req.url);
        if (m) m.fn(req, res, { params: m.params })
        else ecstatic(req, res)
    };
};

function read (p) { return fs.createReadStream(path.join(pubdir, p)) }
