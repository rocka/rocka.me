'use strict';

const CustomPagePlugin = require('@neoblog/plugin-custom-page');
const RootContentPlugin = require('./plugin/root-content');
const GitHubWebhookPlugin = require('@neoblog/plugin-github-webhook');

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
            link: [],
            script: [
                { src: 'https://rocka.me/static/js/melody-player.polyfill.js', async: true }
            ]
        },
        nav: [
            { name: `Rocka's Blog`, link: '/' },
            { name: 'About', link: '/about' }
        ],
        header: {
            img: [
                '/assets/header.jpg',
                '/static/img/header/castle.jpg',
                '/static/img/header/dew.jpg',
                '/static/img/header/nep.jpg',
                '/static/img/header/steve.jpg',
                '/static/img/header/horo1.jpg',
                '/static/img/header/horo2.jpg'
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
                    { text: 'Zeeko', link: 'https://gianthard.rocks', target: '_blank' },
                    { text: 'NeatLine', link: 'http://blog.neatline.cn', target: '_blank' },
                    { text: `Sxyazi's`, link: 'https://sxyz.blog', target: '_blank' },
                    { text: 'FGHRSH', link: 'https://www.fghrsh.net', target: '_blank' }
                ]
            },
            {
                name: 'Server Info',
                items: [
                    { text: `OS: ${process.platform} ${process.arch}` },
                    { text: `Node: ${process.version}` }
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
            email: true
        }
    }
};
