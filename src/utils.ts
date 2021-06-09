export function range(min, max) {
    const arr = Array(max - min)
        .fill(0)
        .map((_, i) => i + min);
    return arr;
}
