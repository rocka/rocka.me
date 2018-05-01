'use strict';

const util = require('util');
const crypto = require('crypto');
const { exec } = require('child_process');
const execAsync = util.promisify(exec);

const KoaRouter = require('koa-router');

class GitHubWebhookPlugin {
    static log(...args) {
        console.log('[GitHubWebhookPlugin]', ...args);
    }

    static get PluginMeta() {
        return {
            name: 'github-webhook-plugin',
            version: '0.1.0',
            description: '`git pull`, `npm ci` and reload config when receive webhook',
            author: 'rocka <i@rocka.me>'
        };
    }

    /**
     * digest hmac and parse response body
     * @param {Router.IRouterContext} ctx
     * @param {string} secret hmac secret
     * @param {string} method hmac method
     */
    hash(ctx, secret = this.secret, method = 'sha1') {
        return new Promise((resolve, reject) => {
            const text = [], digest = [];
            ctx.req.on('data', chunk => text.push(chunk.toString()));
            ctx.req.on('end', () => {
                const rawBody = text.join('');
                ctx.request.rawBody = rawBody;
                if (ctx.is('json')) {
                    try {
                        ctx.request.body = JSON.parse(rawBody);
                    } catch (err) {
                        ctx.request.body = {};
                        GitHubWebhookPlugin.log('cannot parse JSON', text);
                    }
                }
            });
            const hmac = crypto.createHmac(method, secret);
            hmac.on('data', chunk => digest.push(chunk.toString('hex')));
            hmac.on('end', () => resolve(`${method}=${digest.join('')}`));
            hmac.on('error', reject);
            ctx.req.pipe(hmac);
        });
    }

    async preMiddleware(ctx, next) {
        ctx.state.evt = ctx.get('X-GitHub-Event');
        ctx.state.sig = ctx.get('X-Hub-Signature');
        GitHubWebhookPlugin.log(ctx.method, ctx.path, ctx.state.evt);
        try {
            if (!ctx.state.sig) ctx.throw(400, 'Please set `secret` in github webhook');
            const hash = await this.hash(ctx);
            if (ctx.state.sig !== hash) ctx.throw(403, 'wrong hash');
            await next();
        } catch (err) {
            if (err.status && err.message) {
                // is thrown by `ctx.throw`
                ctx.status = err.status;
                ctx.body = { message: err.message };
                return;
            }
            ctx.body = { message: err.stack };
            ctx.status = 500;
        }
    }

    async pingMiddleware(ctx) {
        ctx.status = 200;
        ctx.body = {
            nez: (ctx.request.body.zen || 'zen').split('').reverse().join('')
        };
    }

    async pushMiddleware(ctx) {
        ctx.status = 200;
        ctx.body = 'syncing repo...';
        this.syncRepo();
    }

    constructor({ secret, path = '/webhook/github' }) {
        if (typeof secret !== 'string') {
            throw new Error('[GitHubWebhookPlugin] secret must be string.');
        }
        this.server = null;
        this.secret = secret;
        this.pathname = path;
        this.middleware = {
            ping: this.pingMiddleware,
            push: this.pushMiddleware
        };
        const router = new KoaRouter();
        router.use(this.pathname, this.preMiddleware.bind(this));
        router.post(this.pathname, async (ctx, next) => {
            const middleware = this.middleware[ctx.state.evt];
            if (!middleware) ctx.throw(500, 'unsupported event');
            middleware.call(this, ctx, next);
        });
        this.routes = router.routes();
        return Object.assign(this, GitHubWebhookPlugin.PluginMeta);
    }

    install(blogServer) {
        this.server = blogServer;
    }

    async syncRepo() {
        GitHubWebhookPlugin.log('syncing repo ...');
        await execAsync('git fetch --all');
        await execAsync('git reset --hard origin/master');
        await execAsync('npm ci');
        GitHubWebhookPlugin.log('reloading config ...');
        await this.server.reload();
    }
}

module.exports = GitHubWebhookPlugin;
