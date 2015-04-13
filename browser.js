var wsock = require('websocket-stream');
var through = require('through2');
var split = require('split2');
var render = { row: require('./render/row.js') };
var h = require('virtual-dom/h');

var whref = (location.protocol === 'https:' ? 'wss://' : 'ws://')
    + location.host
;
var ws = wsock(whref);
var content = document.querySelector('#content');
var state = { rows: [] };

ws.pipe(split()).pipe(through.obj(function (line, enc, next) {
    var row = JSON.parse(line);
    row.class = ix ++ % 2 ? 'dark' : 'light';
    state.rows.unshift(row);
    loop.update(state);
    next();
}));

var main = require('main-loop');
var ix = content.children.length % 2;
var loop = main(state, layout, require('virtual-dom'));
content.insertBefore(loop.target, content.children[0]);

function layout (state) {
    return h('div', state.rows.map(render.row))
}
