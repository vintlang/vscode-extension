const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');

module.exports = [
    js.configs.recommended,
    prettier,
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'commonjs',
            globals: {
                process: 'readonly',
                console: 'readonly',
                module: 'readonly',
                require: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'readonly',
            },
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
];
