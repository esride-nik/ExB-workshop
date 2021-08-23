// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
    },
    globals: {
        require: true,
        module: true,
    },
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports env=es6 doesn't include modules, which we are using
        project: 'tsconfig.json',
    },
    settings: {
        react: {
            version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
        },
    },
    plugins: ['@typescript-eslint', 'prettier', 'react'],
    extends: [
        'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
        'eslint:recommended', // base eslint recommend rules
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
        'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
        'prettier/react',
    ],
    rules: {
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
        'no-alert': 'error',
        '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
        '@typescript-eslint/strict-boolean-expressions': [
            'warn',
            {
                allowString: false,
                allowNumber: false,
                allowNullableObject: true,
                allowNullableBoolean: false,
                allowNullableString: false,
                allowNullableNumber: false,
                allowAny: false,
                allowRuleToRunWithoutStrictNullChecksIKnowWhatIAmDoing: false,
            },
        ],
        // TODO: Activate when R3 stories are done --> Refactor
        //'max-lines-per-function': ['warn', 40],
    },
};
