module.exports = {
    // title of all HTML pages. Cannot be null.
    title: 'Rocka\'s Blog',
    // local server port. default to `2233` .
    port: 2233,
    // path to article directory. default to `./article` .
    articleDir: './article',
    // path to template directory. set `null` to use built-in template.
    templateDir: './node_modules/neoblog-template-teal/template',
    // plugins to load. At least an empty array.
    plugins: [
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
                name: 'Server Info',
                items: [
                    `OS: ${process.platform} ${process.arch}`,
                    `Node: ${process.version}`
                ]
            }
        ]
    }
};
