export function deleteProp (obj, path) {
    if (!obj || !path) {
        return;
    }
    if (typeof path === 'string') {
        path = path.split('.');
    }
    for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]];
        if (typeof obj === 'undefined') {
            return;
        }
    }
    delete obj[path.pop()];
}