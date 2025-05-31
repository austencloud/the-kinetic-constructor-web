module.exports = {
	root: true,
	extends: ['eslint:recommended'],
	plugins: ['unused-imports'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	overrides: [
		{
			files: ['**/*.ts', '**/*.svelte'],
			parser: '@typescript-eslint/parser',
			plugins: ['@typescript-eslint', 'unused-imports'],
			extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
			rules: {
				'unused-imports/no-unused-imports': 'error',
				'unused-imports/no-unused-vars': [
					'warn',
					{
						vars: 'all',
						varsIgnorePattern: '^_',
						args: 'after-used',
						argsIgnorePattern: '^_'
					}
				],
				'no-console': ['warn', { allow: ['warn', 'error'] }]
			}
		}
	]
};
