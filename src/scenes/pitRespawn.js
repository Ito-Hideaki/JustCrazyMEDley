export function getGroundRespawnX(pits, x, halfWidth) {
    const merged = [];
    for (const pit of [...pits].sort((a, b) => a.left - b.left)) {
        const previous = merged[merged.length - 1];
        if (previous && pit.left <= previous.right) {
            previous.right = Math.max(previous.right, pit.right);
        } else {
            merged.push({ left: pit.left, right: pit.right });
        }

    }

    if (merged.length === 0) {
        return Math.max(x, halfWidth);
    }

    const distance = pit => Math.max(pit.left - x, x - pit.right, 0);
    const index = merged.reduce((nearest, pit, i) =>
        distance(pit) < distance(merged[nearest]) ? i : nearest, 0);
    const groundLeft = index > 0 ? merged[index - 1].right : 0;
    const groundRight = merged[index].left;
    // Narrow islands still need a center strictly inside their ground segment.
    const margin = Math.min(halfWidth + 1, (groundRight - groundLeft) / 2);
    return Math.max(groundLeft + margin, Math.min(groundRight - 150, groundRight - margin));
}

export function lockPitRespawnInput(scene) {
    scene.mustReleasePitKeys = true;
}

export function isPitInputBlocked(scene) {
    if (!scene.mustReleasePitKeys) {
        return false;
    }
    if ([...Object.values(scene.cursors), scene.spaceKey].some(key => key.isDown)) {
        return true;
    }
    scene.mustReleasePitKeys = false;
    return false;
}
