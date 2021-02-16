module.exports = {
    jsxBracketSameLine: true,
    printWidth: 120,
    singleQuote: true,
    tabWidth: 4,
    endOfLine: 'crlf',
    overrides: [
        {
            files: ['*.html', '*.json', 'webpack.config.js'],
            options: {
                'tabWidth': 2
            }
        }
    ]
};
