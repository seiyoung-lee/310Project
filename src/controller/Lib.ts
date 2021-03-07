import {InsightError} from "./IInsightFacade";
import Log from "../Util";

/**
 * Collection of logging methods. Useful for making the output easier to read and understand.
 */
export default class Lib {
    public static sort(orderKey: string, sections: any): any[] {
        return sections.sort(((a: any, b: any) => {
            return a[orderKey] > b[orderKey] ? 1 : a[orderKey] < b[orderKey] ? -1 : 0;
        }));
    }

    private static sortGivenSections(orderKeys: string[], sections: any, dir: string): any[] {
        Log.trace(orderKeys);
        return sections.sort(((a: any, b: any) => {
            if (dir === "DOWN") {
                for (let orderKey of orderKeys) {
                    if (a[orderKey] > b[orderKey]) {
                        return -1;
                    } else if (a[orderKey] < b[orderKey]) {
                        return 1;
                    }
                }
                return 0;
            } else {
                for (let orderKey of orderKeys) {
                    if (a[orderKey] < b[orderKey]) {
                        return -1;
                    } else if (a[orderKey] > b[orderKey]) {
                        return 1;
                    }
                }
                return 0;
            }
        }));
    }

    public static checkObjectOrder (
        query: any,
        columns: string[],
        orderKeys: string,
        globalID: string,
        allKeys: string[]): boolean {
        if (typeof query !== "object" || query === null || typeof query === "undefined") {
            return false;
        }
        const queryKeys = Object.keys(query);
        if (queryKeys.length === 2 && queryKeys.includes("dir") && queryKeys.includes("keys")) {
            if (query["dir"] !== "UP" && query["dir"] !== "DOWN") {
                return false;
            }
            if (!Array.isArray(query["keys"])) {
                return false;
            }
            if (query["keys"].length <= 0) {
                return false;
            }
            for (let key of query["keys"]) {
                if (!columns.includes(key)) {
                    return false;
                }
                if (typeof key !== "string") {
                    return false;
                }
                let cleanKey = key.split("_");
                if (cleanKey.length !== 2) {
                    return false;
                }
                if (cleanKey[0] !== globalID) {
                    return false;
                }
                if (cleanKey.length !== 2 || !(allKeys.includes(cleanKey[1]))) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    public static sortFirst(orderKey: {dir: string; keys: string[]}, sections: any): any {
        return this.sortGivenSections(orderKey.keys, sections, orderKey.dir);
    }
}
