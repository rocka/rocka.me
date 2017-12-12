'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');

const access = util.promisify(fs.access);

const Send = require('koa-send');
const Router = require('koa-router');

const router = new Router();

router.get('/:file', async (ctx, next) => {
    const filePath = path.join(process.cwd(), 'www-root', ctx.params.file);
    console.log(filePath);
    const err = await access(filePath, fs.constants.R_OK)
    console.log(err);
    if (err) {
        next();
    } else {
        await Send(ctx, filePath, { root: '/' }); 
    }
});

module.exports = {
    name: 'root-content-plugin',
    version: '0.1.0',
    description: 'try serve `/:file`',
    author: 'rocka <i@rocka.me>',
    routes: router.routes()
};
