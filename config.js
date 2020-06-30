'use strict';

const CustomPagePlugin = require('@neoblog/plugin-custom-page');
const RootContentPlugin = require('./plugin/root-content');
const GitHubWebhookPlugin = require('@neoblog/plugin-github-webhook');
const RSSPlugin = require('@neoblog/plugin-rss');

module.exports = {
    // title of all HTML pages. Cannot be null.
    title: `Rocka's Blog`,
    // local server port. default to `2233` .
    port: 36592,
    // path to article directory. default to `./article` .
    articleDir: './article',
    // path to template directory. set `null` to use built-in template.
    templateDir: './node_modules/@neoblog/template-teal/template',
    // plugins to load. At least an empty array.
    plugins: [
        new CustomPagePlugin({
            file: './custom/about.md',
            route: '/about'
        }),
        RootContentPlugin,
        new GitHubWebhookPlugin({
            secret: process.env.WEBHOOK_SECRET
        }),
        new RSSPlugin({
            limit: 10,
            route: '/rss',
            feedOptions: {
                site_url: 'https://rocka.me',
                description: 'Talk is cheap, show me the code.',
                language: 'zh'
            },
            itemOptions: {
                author: 'Rocka'
            }
        })
    ],
    // arguments passed to template. can be anything but null.
    templateArgs: {
        lang: 'zh',
        head: {
            meta: [
                { name: 'theme-color', content: '#009688' },
                { httpEquiv: 'content-security-policy', content: `script-src 'self' *.rocka.me rocka.me` }
            ],
            link: [
                { rel: 'stylesheet', href: '/static/js/melody-player/dist/preload.css' }
            ],
            script: [
                { src: '/static/js/melody-player/dist/player.min.js', async: true },
                { src: '/static/js/fathom.js', async: true }
            ]
        },
        nav: [
            { text: `Rocka's Blog`, attr: { href: '/' } },
            { text: 'About', attr: { href: '/about' } }
        ],
        header: {
            img: [
                '/assets/header.jpg',
                '/static/img/header/castle.jpg',
                '/static/img/header/dew.jpg',
                '/static/img/header/steve.jpg',
                '/static/img/header/horo1.jpg',
                '/static/img/header/AzurLane-Neptunia.jpg',
                '/static/img/header/ten_o_yowa.jpg',
                '/static/img/header/shine.jpg',
                '/static/img/header/PLASMA_ULTIMATE.jpg',
                '/static/img/header/firewatch-tower.jpg'
            ],
            motto: {
                upper: 'Talk is cheap',
                lower: 'Show me the code'
            }
        },
        side: [
            {
                name: 'Links',
                items: [
                    { text: 'Zeeko', attr: { href: 'https://gianthard.rocks', target: '_blank' } },
                    // { text: 'Scrap station', attr: { href: 'https://jolyne.club', target: '_blank' } },
                    { text: `Sxyazi's`, attr: { href: 'https://sxyz.blog', target: '_blank' } },
                    { text: 'FGHRSH', attr: { href: 'https://www.fghrsh.net', target: '_blank' } },
                    { text: 'I/O OVER', attr: { href: 'https://ioover.net', target: '_blank' } },
                    // { text: 'jijiwuming', attr: { href: 'https://www.jijiwuming.cn', target: '_blank' } }
                ]
            },
            {
                name: 'Tags',
                items: [
                    { text: 'Linux', attr: { href: '/tag/Linux' } },
                    { text: '碎碎念', attr: { href: '/tag/碎碎念' } },
                    { text: '前端', attr: { href: '/tag/前端' } }
                ]
            },
            {
                name: 'Subscribe',
                items: [
                    { text: 'RSS', attr: { rel: 'alternate', type: 'application/rss+xml', href: 'https://rocka.me/rss' } },
                    { text: 'Mastodon', attr: { rel: 'me', href: 'https://sn.angry.im/@Rocka', target: '_blank' } },
                ]
            }
        ],
        footer: {
            meta: {
                copy: true,
                platform: true,
                theme: true
            }
        },
        isso: {
            lang: 'zh',
            embed: 'https://isso.rocka.me/js/embed.min.js',
            prefix: 'https://isso.rocka.me/',
            author: true,
            email: true,
            replyNotifications: true
        }
    }
};
