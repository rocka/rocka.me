'use strict';

const path = require('path');

const Mount = require('koa-mount');
const Static = require('koa-static-cache');

const route = Mount('/static', Static(path.join(process.cwd(), 'www-root/static'), {
    maxAge: 365 * 24 * 60 * 60,
    gzip: true,
    usePrecompiledGzip: true
}));

module.exports = {
    name: 'static-route-plugin',
    version: '0.1.0',
    description: 'serve `./static` as `/static` using koa-static-cache.',
    author: 'rocka <i@rocka.me>',
    routes: route
};
