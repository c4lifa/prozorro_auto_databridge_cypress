const isObject = (obj) => obj != null && obj.constructor.name === "Object";

export function getKeys(obj, keepObjKeys, skipArrays, keys=[], scope=[]) {
        if (Array.isArray(obj)) {
            if (!skipArrays) scope.push('[' + obj.length + ']');
            obj.forEach((o) => getKeys(o, keepObjKeys, skipArrays, keys, scope), keys);
        } else if (isObject(obj)) {
            Object.keys(obj).forEach((k) => {
                if ((!Array.isArray(obj[k]) && !isObject(obj[k])) || keepObjKeys) {
                    let path = scope.concat(k).join('.').replace(/\.\[/g, '[');
                    if (!keys.includes(path)) keys.push(path);
                }
                getKeys(obj[k], keepObjKeys, skipArrays, keys, scope.concat(k));
            }, keys);
        }
        return keys;
}