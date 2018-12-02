import babel from 'rollup-plugin-babel'
import {terser} from 'rollup-plugin-terser'

export default {
    input: './lib/index.js',
    plugins: [
        babel(),
        terser()
    ],
    output: {
        file: './dist/sst.min.js',
        format: 'umd',
        name: 'sst',
        sourcemap: 'external'
    },

}