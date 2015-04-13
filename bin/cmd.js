#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    alias: {
        p: 'port',
        d: 'datadir',
        u: 'uid',
        g: 'gid',
        h: 'help'
    },
    default: {
        port: require('is-root')() ? 80 : 5000,
        datadir: 'bleach-data'
    }
});
if (argv.help || argv._[0] === 'help') {
    return fs.createReadStream(path.join(__dirname, 'usage.txt'))
        .pipe(process.stdout)
    ;
}

var alloc = require('tcp-bind');
var fd = alloc(argv.port);
if (argv.gid !== undefined) process.setgid(argv.gid);
if (argv.uid !== undefined) process.setuid(argv.uid);

var http = require('http');
var level = require('level');
var db = level(argv.datadir, {
    keyEncoding: require('bytewise'),
    valueEncoding: 'json'
});

var app = require('../')(db);
var server = http.createServer(app.handle.bind(app));
server.listen(argv.port);

server.once('listening', function () {
    console.log('listening on :' + server.address().port);
});

var wsock = require('websocket-stream');
wsock.createServer({ server: server }, onwsock);

function onwsock (stream) {
    app.on('save', onsave);
    stream.on('end', onend);
    stream.on('close', onend);
    stream.on('error', function () {});
    
    function onsave (key, value) {
        stream.write(JSON.stringify({ key: key, value: value }) + '\n');
    }
    function onend () {
        ended = true;
        server.removeListener('save', onsave);
    }
}
