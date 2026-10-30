export function findHazardSpawnX(scene, x, y, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const solidBounds = [
        ...scene.platformGroup.getChildren(),
        ...scene.wallGroup.getChildren(),
    ].map(block => block.getBounds());
    const step = 10;

    for (let distance = 0; distance <= scene.worldWidth; distance += step) {
        const candidates = distance === 0 ? [x] : [x - distance, x + distance];
        for (const candidateX of candidates) {
            if (candidateX - halfWidth < 0 || candidateX + halfWidth > scene.worldWidth) {
                continue;
            }
            const overlapsPit = scene.pits.some(pit =>
                candidateX + halfWidth > pit.left && candidateX - halfWidth < pit.right
            );
            const overlapsSolid = solidBounds.some(bounds =>
                candidateX + halfWidth > bounds.left &&
                candidateX - halfWidth < bounds.right &&
                y + halfHeight > bounds.top &&
                y - halfHeight < bounds.bottom
            );
            if (!overlapsPit && !overlapsSolid) {
                return candidateX;
            }
        }
    }
    return null;
}
