var h = require('virtual-dom/h');
var strftime = require('strftime');
var timeago = require('timeago');

module.exports = function (row) {
    var time = new Date(row.key[1]);
    return h('div.bleach.' + (row.class || ''), [
        h('div.time', [
            strftime('%Y-%m-%d %T', time),
            '\n',
            h('div.ago', timeago(time))
        ]),
        h('div.cups', String(row.value.cups) + ' cups')
    ]);
};
