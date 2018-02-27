'use strict';

const path = require('path');

const Mount = require('koa-mount');
const Static = require('koa-static-cache');

const route = Mount(Static({
    dir: path.join(process.cwd(), 'www-root'),
    preload: false,
    dynamic: true
}));

module.exports = {
    name: 'root-content-plugin',
    version: '0.1.0',
    description: 'try serve `/path/to/file` under ./www-root',
    author: 'rocka <i@rocka.me>',
    routes: route
};
