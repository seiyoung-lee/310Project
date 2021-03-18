import {InsightError} from "./IInsightFacade";
import DatasetTypeController from "./DatasetTypeController";
import Lib from "./Lib";
import TransformationStatic from "./TransformationStatic";
export default class ValidateDataset {
    private globalID: string;
    private allKeys: string[];
    private keyNumbers: string[];
    private keyStrings: string[];
    private kind: string;
    constructor() {
        this.globalID = "";
    }

    private setKeys(id: string, dict: any) {
        let dtc = new DatasetTypeController();
        if (dict[id] && dict[id]["type"] === "courses") {
            this.kind = "courses";
            this.allKeys = dtc.getCourseQueryAllKeys();
            this.keyNumbers = dtc.getCourseKeysNum();
            this.keyStrings = dtc.getCourseKeysStr();
        } else if (dict[id] && dict[id]["type"] === "rooms") {
            this.kind = "rooms";
            this.allKeys = dtc.getRoomQueryAllKeys();
            this.keyNumbers = dtc.getRoomKeysNum();
            this.keyStrings = dtc.getRoomKeysStr();
        } else {
            this.allKeys = [];
            this.keyNumbers = [];
            this.keyStrings = [];
        }
    }

    public getKind() {
        return this.kind;
    }

    public checkWhere(query: any, dict: any): boolean {
        if (typeof query !== "object" || query === null) {
            return false;
        }
        if (Array.isArray(query)) {
            return false;
        }
        let moreThanOne = false;
        let wentIn = false;
        for (let key in query) {
            wentIn = true;
            if (moreThanOne) {
                return false;
            }
            moreThanOne = true;
            try {
                let cleanKey: string[] = key.split("_");
                if (this.globalID === "") {
                    this.globalID = cleanKey[0];
                    this.setKeys(dict[cleanKey[0]].type, dict);
                } else {
                    if (cleanKey[0] !== this.globalID) {
                        return false;
                    }
                }
                if (cleanKey.length !== 2) {
                    return false;
                }
                if (!(this.allKeys.includes(cleanKey[1]))) {
                    return false;
                }
                if (cleanKey[1] in this.keyNumbers && typeof query[key] !== "number") {
                    return false;
                }
                if (cleanKey[1] in this.keyStrings && typeof query[key] !== "string") {
                    return false;
                }
            } catch (e) {
                throw new InsightError();
            }
        }
        return wentIn;
    }

    public checkAndOr(query: any, dict: any): boolean {
        if (!(Array.isArray(query))) {
            return false;
        }
        if (query.length === 0) {
            return false;
        }
        for (const object of query) {
            let moreThanOne = false;
            for (let index in object) {
                if (moreThanOne) {
                    return false;
                }
                moreThanOne = true;
                if (index === "AND") {
                    return this.checkAndOr(object[index], dict);
                } else if (index === "OR") {
                    return this.checkAndOr(object[index], dict);
                } else if (["GT", "EQ", "LT", "IS"].includes(index)) {
                    if (!(this.checkWhere(object[index], dict))) {
                        return false;
                    }
                } else if (index === "NOT") {
                    if (!(this.checkNot(object[index], dict))) {
                        return false;
                    }
                } else {

                    return false;
                }
            }
        }
        return true;
    }

    public checkOrder(query: any, columns: string[], orderKeys: string, dict: any): string {
        if (typeof query !== "string") {
            if (Lib.checkObjectOrder(query, columns, orderKeys, this.globalID, this.allKeys)) {
                return "valid object";
            }
            return "";
        }
        if (!columns.includes(query)) {
            return orderKeys;
        }
        try {
            let cleanKey = query.split("_");
            if (cleanKey.length !== 2) {
                return orderKeys;
            }
            if (cleanKey[0] !== this.globalID) {
                if (this.globalID.length !== 0) {
                    return orderKeys;
                }
                this.globalID = cleanKey[0];
                this.setKeys(cleanKey[0], dict);
            }
            if (cleanKey.length !== 2 || !(this.allKeys.includes(cleanKey[1]))) {
                return orderKeys;
            } else {
                orderKeys = query;
                return orderKeys;
            }
        } catch (e) {
            throw new InsightError();
        }
    }

    public checkColumns(query: any, orderKeys: string, dict: any): boolean {
        let ret = true;
        for (const key of query) {
            try {
                let cleanKey: string[] = key.split("_");
                if (this.globalID === "") {
                    this.globalID = cleanKey[0];
                    this.setKeys(dict[cleanKey[0]].type, dict);
                } else {
                    if (cleanKey[0] !== this.globalID) {
                        ret = false;
                        break;
                    }
                }
                if (cleanKey.length !== 2) {
                    ret = false;
                    break;
                }
                if (this.allKeys.indexOf(cleanKey[1]) <= -1) {
                    ret = false;
                    break;
                } else {
                    if (orderKeys.length !== 0 && !(cleanKey[1] === orderKeys)) {
                        ret = false;
                        break;
                    }
                }
            } catch (e) {
                throw new InsightError();
            }
        }
        return ret;
    }

    public checkNot(query: any, dict: any): boolean {
        let and: boolean = query.hasOwnProperty("AND");
        let or: boolean = query.hasOwnProperty("OR");
        if (and && or) {
            return false;
        }
        if (and) {
            if (!this.checkAndOr(query["AND"], dict)) {
                return false;
            }
        } else if (or) {
            if (!this.checkAndOr(query["OR"], dict)) {
                return false;
            }
        } else {
            let moreThanOne: boolean = false;
            for (let key in query) {
                if (moreThanOne) {
                    return false;
                }
                moreThanOne = true;
                if (["GT", "EQ", "LT", "IS"].includes(key)) {
                    if (!(this.checkWhere(query[key], dict))) {
                        return false;
                    }
                } else if (key === "NOT") {
                    if (!(this.checkNot(query[key], dict))) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    public checkQuery(inputQuery: any, dict: any): boolean {
        if (typeof inputQuery === "undefined" || typeof inputQuery !== "object" ||
            inputQuery == null || Object.keys(inputQuery).length <= 1 || Object.keys(inputQuery).length > 3) {
            return false;
        }
        if (!inputQuery.hasOwnProperty("WHERE")) {
            return false;
        }
        let not: boolean = inputQuery["WHERE"].hasOwnProperty("NOT");
        if (not) {
            if (!(this.checkNot(inputQuery["WHERE"]["NOT"], dict))) {
                return false;
            }
        } else {
            let and: boolean = inputQuery["WHERE"].hasOwnProperty("AND");
            let or: boolean = inputQuery["WHERE"].hasOwnProperty("OR");
            if (and && or) {
                return false;
            }
            if (and) {
                if (!this.checkAndOr(inputQuery["WHERE"]["AND"], dict)) {
                    return false;
                }
            } else if (or) {
                if (!this.checkAndOr(inputQuery["WHERE"]["OR"], dict)) {
                    return false;
                }
            } else {
                let moreThanOne: boolean = false;
                for (let key in inputQuery["WHERE"]) {
                    if (moreThanOne) {
                        return false;
                    }
                    moreThanOne = true;
                    if (["GT", "EQ", "LT", "IS"].includes(key)) {
                        if (!(this.checkWhere(inputQuery["WHERE"][key], dict))) {
                            return false;
                        }
                    } else if (key === "NOT") {
                        if (!(this.checkNot(inputQuery["WHERE"][key], dict))) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            }
        }
        return this.checkQueryOptions(inputQuery, dict); // options
    }

    public checkQueryOptions(inputQuery: any, dict: any): boolean {
        if (!inputQuery.hasOwnProperty("OPTIONS")) {
            return false;
        }
        for (let key in inputQuery["OPTIONS"]) {
            if (!(["COLUMNS", "ORDER"].includes(key))) {
                return false;
            }
        }
        const columns = inputQuery["OPTIONS"]["COLUMNS"];
        if (!inputQuery["OPTIONS"].hasOwnProperty("COLUMNS") || !(Array.isArray(columns))) {
            return false;
        } else {
            if (Object.keys(inputQuery).length === 3 && !TransformationStatic.checkTransformation(inputQuery, dict,
                this.globalID)) {
                return false;
            } else if (Object.keys(inputQuery).length !== 3 && !(this.checkColumns(columns, "", dict))) {
                return false;
            }
        }
        if ("ORDER" in inputQuery["OPTIONS"]) {
            if (this.checkOrder(inputQuery["OPTIONS"]["ORDER"], columns, "", dict).length === 0) {
                return false;
            }
        }
        return true;
    }
}
