require('nekodev').gulp({
    browser: false,
    jest: {
        config: {
            unmockedModulePathPatterns: [
                'ansi-regex',
                'bluebird',
                'color-convert',
                'lodash',
            ],
        },
    },
});
