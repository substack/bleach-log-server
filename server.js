var http = require('http');
var path = require('path');
var fs = require('fs');
var hyperstream = require('hyperstream');
var vstr = require('virtual-dom-stringify');

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port' },
    default: { port: 5000 }
});

var pubdir = path.join(__dirname, 'public');

var router = require('routes')();
var ecstatic = require('ecstatic')(pubdir);
var render = require('bulk-require')(path.join(__dirname, 'render'), ['*.js']);

router.addRoute('/', function (req, res, m) {
    read('layout.html').pipe(hyperstream({
        '#content': vstr(render.root())
    })).pipe(res);
});

var server = http.createServer(function (req, res) {
    var m = router.match(req.url);
    if (m) m.fn(req, res, { params: m.params })
    else ecstatic(req, res)
});
server.listen(argv.port);

server.once('listening', function () {
    console.log('listening on :' + server.address().port);
});

function read (p) { return fs.createReadStream(path.join(pubdir, p)) }
