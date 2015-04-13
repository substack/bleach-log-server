var http = require('http');
var path = require('path');
var fs = require('fs');
var hyperstream = require('hyperstream');
var vstr = require('virtual-dom-stringify');
var h = require('virtual-dom/h');
var Router = require('routes');

var strftime = require('strftime');
var timeago = require('timeago');

var pubdir = path.join(__dirname, 'public');
var ecstatic = require('ecstatic')(pubdir);

var sizelim = require('size-limit-stream');
var concat = require('concat-stream');
var through = require('through2');
var qs = require('querystring');

module.exports = function (db) {
    var router = Router();
    
    router.addRoute('/', function (req, res, m) {
        read('layout.html').pipe(hyperstream({
            '#content': bleachlog(db)
        })).pipe(res);
    });
    
    router.addRoute('/save', function (req, res, m) {
        req.pipe(post(function (err, params) {
            if (err) return error(res, 400, err);
            
            var key = [ 'bleach', Date.now() ];
            db.put(key, params, function (err) {
                if (err) error(res, 500, err)
                else res.end('ok\n')
            });
        }));
    });
    
    return function (req, res) {
        var m = router.match(req.url);
        if (m) m.fn(req, res, { params: m.params })
        else ecstatic(req, res)
    };
};

function error (res, code, msg) {
    res.statusCode = code;
    res.end(msg + '\n');
}

function bleachlog (db) {
    var r = through.obj(write);
    var opts = {
        gt: [ 'bleach', null ],
        lt: [ 'bleach', undefined ],
        limit: 25
    };
    db.createReadStream(opts).pipe(r);
    var rows = [];
    return r;
    
    function write (row, enc, next) {
        var time = new Date(row.key[1]);
        this.push(vstr(h('div.bleach', [
            h('div.time', [
                strftime('%Y-%m-%d %T', time),
                '\n',
                h('div.ago', timeago(time))
            ]),
            h('div.cups', String(row.value.cups) + ' cups')
        ])));
        next();
    }
}

function read (p) {
    return fs.createReadStream(path.join(pubdir, p))
}

function post (cb) {
    var r = sizelim(1024*64);
    r.pipe(concat(function (body) {
        cb(null, qs.parse(body.toString()));
    }));
    r.on('error', cb);
    return r;
}
