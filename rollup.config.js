import babel from 'rollup-plugin-babel'
import {terser} from 'rollup-plugin-terser'

export default {
    input: './lib/index.js',
    plugins: [
        babel(),
        terser()
    ],
    output: {
        file: './dist/sum-type.min.js',
        format: 'umd',
        name: 'SumType',
        sourcemap: 'external'
    },

}