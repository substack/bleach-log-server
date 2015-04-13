#!/usr/bin/env node

var http = require('http');

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    alias: { p: 'port', d: 'datadir' },
    default: { port: 5000, datadir: 'hot-tub-data' }
});

var level = require('level');
var db = level(argv.datadir, {
    keyEncoding: require('bytewise'),
    valueEncoding: 'json'
});

var server = http.createServer(require('../')(db));
server.listen(argv.port);

server.once('listening', function () {
    console.log('listening on :' + server.address().port);
});
