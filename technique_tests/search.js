const FlexSearch = require('./flexsearch.min.js')
const {
    performance
} = require('perf_hooks')

x = new FlexSearch('speed')
for (let i = 0; i < 1000000; i++) {
    x.add(i, i.toString())
}

let t1 = performance.now()
x.search("99")
let t2 = performance.now()

console.log(t2 - t1)
