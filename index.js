var http = require('http');
var path = require('path');
var fs = require('fs');
var hyperstream = require('hyperstream');
var vstr = require('virtual-dom-stringify');
var Router = require('routes');

var pubdir = path.join(__dirname, 'public');
var ecstatic = require('ecstatic')(pubdir);

var sizelim = require('size-limit-stream');
var concat = require('concat-stream');
var through = require('through2');
var defined = require('defined');

var qs = require('querystring');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var ndjson = require('ndjson');

var render = { row: require('./render/row.js') };

module.exports = Server;
inherits(Server, EventEmitter);

function Server (db) {
    if (!(this instanceof Server)) return new Server(db);
    var self = this;
    this.router = Router();
    
    this.router.addRoute('/', function (req, res, m) {
        read('layout.html').pipe(hyperstream({
            '#content': bleachlog(db)
        })).pipe(res);
    });
    
    this.router.addRoute('/data', function (req, res, m) {
        var opts = {
            gt: [ 'bleach', defined(m.params.gt, null) ],
            lt: [ 'bleach', undefined ],
            limit: defined(m.params.limit, 25),
            reverse: true
        };
        db.createReadStream(opts)
            .pipe(through.obj(function (row, enc, next) {
                this.push({
                    time: new Date(row.key[1]).toISOString(),
                    cups: row.value.cups
                });
                next();
            }))
            .pipe(ndjson.stringify())
            .pipe(res);
        ;
    });
    
    this.router.addRoute('/save', function (req, res, m) {
        if (req.method !== 'POST') {
            return error(res, 400, 'expected a POST');
        }
        req.pipe(post(function (err, params) {
            if (err) return error(res, 400, err);
            
            var key = [ 'bleach', Date.now() ];
            db.put(key, params, function (err) {
                if (err) error(res, 500, err)
                res.end('ok\n')
                self.emit('save', key, params);
            });
        }));
    });
}

Server.prototype.handle = function (req, res) {
    var m = this.router.match(req.url);
    if (m) m.fn(req, res, { params: m.params })
    else ecstatic(req, res)
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
        limit: 25,
        reverse: true
    };
    db.createReadStream(opts).pipe(r);
    var rows = [];
    return r;
    
    function write (row, enc, next) {
        this.push(vstr(render.row(row)));
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
