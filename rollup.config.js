import rootImport from 'rollup-plugin-root-import';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

export default {
    input: 'scripts/AnimationPath.js',
    output: [{
            file: 'build/AnimationPlugin.js',
            format: 'es',
        }, {
            file: 'build/AnimationPlugin.min.js',
            format: 'es',
            name: 'version',
            plugins: [
                terser({mangle: { keep_classnames: true, keep_fnames: true }}),
            ],
        },
    ],
    external: [
        'three',
    ],
    plugins: [
        rootImport({
            // Will first look in `client/src/*` and then `common/src/*`.
            root: `${__dirname}`,
            useInput: 'prepend',

            // If we don't find the file verbatim, try adding these extensions
            extensions: '.js',
        }),
        replace({
            delimiters: ['', ''],
            values: { 'http://localhost:8000': ''},
        }),
    ],
};
