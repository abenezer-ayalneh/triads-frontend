// @ts-check
import eslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import angular from 'angular-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import stylistic from '@stylistic/eslint-plugin'

export default tsEslint.config(
	{
		ignores: ['eslint.config.mjs'],
	},
	{
		files: ['**/*.ts'],
		extends: [eslint.configs.recommended, ...tsEslint.configs.recommended, ...tsEslint.configs.stylistic, ...angular.configs.tsRecommended],
		processor: angular.processInlineTemplates,
		rules: {
			'@angular-eslint/directive-selector': [
				'error',
				{
					type: 'attribute',
					prefix: 'app',
					style: 'camelCase',
				},
			],
			'@angular-eslint/component-selector': [
				'error',
				{
					type: 'element',
					prefix: 'app',
					style: 'kebab-case',
				},
			],
		},
	},
	{
		files: ['**/*.html'],
		extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
	},
	{
		plugins: {
			'simple-import-sort': simpleImportSort,
			'unused-imports': unusedImports,
			'@stylistic': stylistic,
		},
		rules: {
			'@angular-eslint/template/interactive-supports-focus': 'off',
			'@angular-eslint/template/click-events-have-key-events': 'off',
			'@angular-eslint/component-class-suffix': 'off',
			'@stylistic/lines-between-class-members': 'warn',
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'no-unused-vars': 'off', // or "@typescript-eslint/no-unused-vars": "off",
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
		},
	},
)
