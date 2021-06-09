const x = 10
const y = 10000

function time(func) {
    const t1 = performance.now()
    func()
    const t2 = performance.now()

    return t2 - t1
}

array_2d = []
for (let tempY = 0; tempY < x; tempY++) {
    const row = []
    for (let tempX = 0; tempX < y; tempX++) {
        row.push(tempX)
    }
    array_2d.push(row)
}

console.log(
    time(() => {
        const result = []
        for (row of array_2d) {
            result.push(array_2d[0])
        }
    })
)

console.log(
    time(() => {
        array_2d[0]
    })
)
