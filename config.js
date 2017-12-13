module.exports = {
    // title of all HTML pages. Cannot be null.
    title: 'Rocka\'s Blog',
    // local server port. default to `2233` .
    port: 36592,
    // path to article directory. default to `./article` .
    articleDir: './article',
    // path to template directory. set `null` to use built-in template.
    templateDir: './neoblog-template-teal/template',
    // plugins to load. At least an empty array.
    plugins: [
        require('./plugin/static-route'),
        require('./plugin/root-content')
    ],
    // arguments passed to template. can be anything but null.
    templateArgs: {
        nav: [
            {
                name: 'Rocka\'s Blog',
                link: '/'
            }
        ],
        side: [
            {
                name: 'Links',
                items: [
                    `<a href="https://zeeko.1503.run" target="_blank">Zeeko</a>`,
                ]
            },
            {
                name: 'Server Info',
                items: [
                    `OS: ${process.platform} ${process.arch}`,
                    `Node: ${process.version}`
                ]
            }
        ]
    }
};
