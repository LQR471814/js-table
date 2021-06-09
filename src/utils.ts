export function range(min: number, max: number) {
    const arr = Array(max - min)
        .fill(0)
        .map((_, i) => i + min);
    return arr;
}
