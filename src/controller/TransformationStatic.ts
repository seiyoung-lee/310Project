import {InsightDatasetKind} from "./IInsightFacade";
import DatasetTypeController from "./DatasetTypeController";
import Log from "../Util";

export default class TransformationStatic {
    private static getApplyKeys(query: any[]): string[] {
        let ret: string [] = [];
        for (let apply of query) {
            if (typeof apply !== "object" || apply == null) {
                return [];
            }
            const keys = Object.keys(apply);
            if (keys.length !== 1) {
                return [];
            } else {
                ret.push(keys[0]);
            }
        }
        return ret;
    }

    private static checkGroups(group: any[], columns: string[]): boolean {
        if (group.length === 0) {
            return false;
        }
        for (let key of group) {
            if (typeof key !== "string") {
                return false;
            }
            if (!columns.includes(key)) {
                return false;
            }
        }
        return true;
    }

    private static checkApply(query: any[], type: InsightDatasetKind, id: string): boolean {
        let dtc = new DatasetTypeController();
        let keyNumbers = [];
        let allKey = [];
        if (type === InsightDatasetKind.Courses) {
            keyNumbers = dtc.getCourseKeysNum();
            allKey = dtc.getCourseQueryAllKeys();
        } else if (type === InsightDatasetKind.Rooms) {
            keyNumbers = dtc.getRoomKeysNum();
            allKey = dtc.getRoomQueryAllKeys();
        } else {
            return false;
        }
        for (let apply of query) {
            const keys = Object.keys(apply);
            const value = apply[keys[0]];
            const transform = Object.keys(value);
            const keyArray = value[transform[0]].split("_");
            if (transform.length !== 1 || keyArray.length !== 2 || id !== keyArray[0]) {
                return false;
            }
            if (transform[0] === "MAX" || transform[0] === "MIN" || transform[0] === "AVG" || transform[0] === "SUM") {
                if (!keyNumbers.includes(keyArray[1])) {
                    return false;
                }
            } else if (transform[0] === "COUNT") {
                if (!allKey.includes(keyArray[1])) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    private static checkColumns(columns: string[], id: string, type: string, apply: string[]): boolean  {
        let dtc = new DatasetTypeController();
        let allKey = [];
        let ret = id;
        if (type === InsightDatasetKind.Courses) {
            allKey = dtc.getCourseQueryAllKeys();
        } else if (type === InsightDatasetKind.Rooms) {
            allKey = dtc.getRoomQueryAllKeys();
        } else {
            return false;
        }
        for (const column of columns) {
            const columnArray = column.split("_");
            if (columnArray.length !== 2) {
                if (!apply.includes(column)) {
                    return false;
                }
            } else if (ret !== columnArray[0] || !allKey.includes(columnArray[1])) {
                return false;
            }
        }
        return true;
    }

    public static checkTransformation(query: any, dict: any, id: string): boolean {
        try {
            if (!query.hasOwnProperty("TRANSFORMATIONS")) {
                return false;
            }
            const transformation = query["TRANSFORMATIONS"];
            if (Object.keys(transformation).length !== 2) {
                return false;
            }
            for (let key of ["GROUP", "APPLY"]) {
                if (!transformation.hasOwnProperty(key)) {
                    return false;
                } else {
                    if (key === "GROUP") {
                        if (!Array.isArray(transformation["GROUP"])) {
                            return false;
                        }
                    } else {
                        if (!Array.isArray(transformation["APPLY"])) {
                            return false;
                        }
                    }
                }
            }
            if (!this.checkGroups(transformation["GROUP"], query["OPTIONS"]["COLUMNS"])) {
                return false;
            }
            if (id === "") {
                id = transformation["GROUP"][0].split("_")[0];
            }
            const type: InsightDatasetKind = dict[id].type;
            const apply: string[] = this.getApplyKeys(transformation["APPLY"]);
            if (apply.length <= 0 || !this.checkGroups(apply, query["OPTIONS"]["COLUMNS"])) {
                return false;
            }
            return this.checkColumns(query["OPTIONS"]["COLUMNS"], id, type, apply) ?
                this.checkApply(transformation["APPLY"], type, id) : false;
        } catch (e) {
            return false;
        }
    }
}
