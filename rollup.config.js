import {terser} from 'rollup-plugin-terser'


export default [
    {
        input: './lib/index.js',
        output: {
            file: './dist/sum-type.umd.js',
            format: 'umd',
            name: 'stags',
            sourcemap: 'external'
        },
    
    },
    {
        input: './lib/index.js',
        plugins: [
            terser()
        ],
        output: {
            file: './dist/sum-type.umd.min.js',
            format: 'umd',
            name: 'stags',
            sourcemap: 'external'
        },
    },
    {
        input: './lib/index.js',
        output: {
            file: './dist/sum-type.esm.js',
            format: 'esm',
            sourcemap: 'external'
        },
    },
    {
        input: './lib/index.js',
        plugins: [
            terser()
        ],
        output: {
            file: './dist/sum-type.esm.min.js',
            format: 'esm',
            sourcemap: 'external'
        },
    }
]