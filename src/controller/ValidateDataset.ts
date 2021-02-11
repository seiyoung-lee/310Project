import Log from "../Util";
import {InsightError} from "./IInsightFacade";
export default class ValidateDataset {
    private globalID: string;
    private readonly allKeys: string[];
    constructor() {
        this.globalID = "";
        this.allKeys = ["fail", "pass", "avg", "year", "audit", "course", "uuid", "instructor", "title", "id", "dept"];
    }
    public checkWhere(query: any, dict: any): boolean {
        if (typeof query !== "object" || query === null) {
            return false;
        }
        if (Array.isArray(query)) { return false; }
        let keyNumbers: string[] = ["fail", "pass", "avg", "year", "audit"];
        let keyStrings: string[] = ["course", "uuid", "instructor", "title", "id", "dept"];
        let moreThanOne = false;
        let wentIn = false;
        for (let key in query) {
            wentIn = true;
            if (moreThanOne) { return false; }
            moreThanOne = true;
            try {
                let cleanKey: string[] = key.split("_");
                if (this.globalID === "") {
                    this.globalID = cleanKey[0];
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
                if (cleanKey[1] in keyNumbers && typeof query[key] !== "number") {
                    return false;
                }
                if (cleanKey[1] in keyStrings && typeof query[key] !== "string") {
                    return false;
                }
            } catch (e) {
                throw new InsightError();
            }
        }
        if (!wentIn) {
            return false;
        }
        return true;
    }

    public checkAndOr(query: any, dict: any): boolean {
        if (!(Array.isArray(query))) {
        return false; }

        if (query.length === 0) {
            return false; }
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

    public checkOrder(query: any, columns: string[], orderKeys: string): string {
        if (typeof query !== "string") { return orderKeys; }
        if (!columns.includes(query)) { return orderKeys; }
        try {
            let cleanKey = query.split("_");
            if (cleanKey.length !== 2) { return orderKeys; }
            if (this.globalID === "") {
                this.globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== this.globalID) {
                    return orderKeys;
                }
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
        if (and && or) { return false; }
        if (and) {
            if (!this.checkAndOr(query["AND"], dict)) { return false; }
        } else if (or) {
            if (!this.checkAndOr(query["OR"], dict)) { return false; }
        } else {
            let moreThanOne: boolean = false;
            for (let key in query) {
                if (moreThanOne) { return false; }
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
            inputQuery == null || Object.keys(inputQuery).length <= 1 || Object.keys(inputQuery).length > 2) {
            return false; }
        if (!inputQuery.hasOwnProperty("WHERE")) {
        return false; }
        let not: boolean = inputQuery["WHERE"].hasOwnProperty("NOT");
        if (not) {
            if (!(this.checkNot(inputQuery["WHERE"]["NOT"], dict))) { return false; }
        } else {
            let and: boolean = inputQuery["WHERE"].hasOwnProperty("AND");
            let or: boolean = inputQuery["WHERE"].hasOwnProperty("OR");
            if (and && or) { return false; }
            if (and) {
                if (!this.checkAndOr(inputQuery["WHERE"]["AND"], dict)) { return false; }
            } else if (or) {
                if (!this.checkAndOr(inputQuery["WHERE"]["OR"], dict)) { return false; }
            } else {
                let moreThanOne: boolean = false;
                for (let key in inputQuery["WHERE"]) {
                    if (moreThanOne) { return false; }
                    moreThanOne = true;
                    if (["GT", "EQ", "LT", "IS"].includes(key)) {
                        if (!(this.checkWhere(inputQuery["WHERE"][key], dict))) {
                            return false;
                        }
                    } else if (key === "NOT") {
                        if (!(this.checkNot(inputQuery["WHERE"][key], dict))) {
                            return false;
                        }
                    } else { return false; }
                }
            }
        }
        // options
        if (!inputQuery.hasOwnProperty("OPTIONS")) { return false; }
        for (let key in inputQuery["OPTIONS"]) {
            if (!(["COLUMNS", "ORDER"].includes(key))) { return false; }
        }
        let orderKeys: string = "";
        if (!(Array.isArray(inputQuery["OPTIONS"]["COLUMNS"]))) { return false; }
        if (!inputQuery["OPTIONS"].hasOwnProperty("COLUMNS")) { return false; }
        if (!(this.checkColumns(inputQuery["OPTIONS"]["COLUMNS"], orderKeys, dict))) { return false; }
        if ("ORDER" in inputQuery["OPTIONS"]) {
            orderKeys = this.checkOrder(inputQuery["OPTIONS"]["ORDER"], inputQuery["OPTIONS"]["COLUMNS"], orderKeys);
            if (orderKeys.length === 0) { return false; }
        }
        return true;
    }
}
