import {InsightDatasetKind, InsightError, QueryValues, ResultTooLargeError} from "./IInsightFacade";
import Lib from "./Lib";
import Transformations from "./Transformations";
import PerformQueryHelper from "./PerformQueryHelper";

export default class PerformQueryClass {
    private readonly dict: any;
    private keyStrings: string[];
    private keyNumbers: string[];
    constructor(dict: any) {
        this.dict = dict;
    }

    private getColumnsAndDataSet = (columns: string[]) => {
        if (columns.length === 0) {
            throw new InsightError("column dataset");
        } else {
            let keys: string[] = [];
            let id: string = "";
            columns.forEach((column: string) => {
                if (!(column.includes("_"))) {
                    keys.push(column);
                } else {
                    const columnArray = column.split("_");
                    if (keys.length === 0) {
                        id = columnArray[0];
                        if (id in this.dict) {
                            keys.push(columnArray[1]);
                        } else {
                            throw new InsightError("column dataset");
                        }
                    } else {
                        if (id === columnArray[0]) {
                            keys.push(columnArray[1]);
                        } else {
                            throw new InsightError("column dataset");
                        }
                    }
                }
            });
            return { datasetID: id, columns: keys };
        }
    }

    private OrAndQuery(query: QueryValues, not: boolean, type: string, sections: any[]): any [] {
        const OrAndArray = query.query[type];
        if (OrAndArray.length === 0 || !Array.isArray(OrAndArray)) {
            throw new InsightError("OR AND AND error");
        }
        let ret: any[] = [];
        let newQueryOR: QueryValues;
        if ((type === "OR" && not) || (type === "AND" && !not)) {
            for (let i = 0; i < OrAndArray.length; i++) {
                newQueryOR = { query: OrAndArray[i], columns: query.columns, id: query.id };
                if (i === 0) {
                    ret = this.getQuery(newQueryOR, not, false, sections);
                } else {
                    ret = this.getQuery(newQueryOR, not, false, ret);
                }
            }
        } else {
            for (let item of OrAndArray) {
                newQueryOR = { query: item, columns: query.columns, id: query.id };
                const dummyArray = ret.concat(this.getQuery(newQueryOR, not, false, sections));
                const dummySet = new Set(dummyArray);
                ret = [...dummySet];
            }
        }
        return ret;
    }

    private isQuery(query: any, not: boolean, sections: any[]) {
        const isObject = query.query["IS"];
        const keys = Object.keys(isObject);
        const val = keys[0].split("_");
        if (keys.length !== 1 || val[0] !== query.id || !this.keyStrings.includes(val[1]) ||
            typeof(isObject[keys[0]]) !== "string" || isObject[keys[0]] === null) {
                throw new InsightError("IS QUERY");
        }
        let ret: any[] = [];
        let hasAsterisk: boolean = false;
        let startEndAll: number = -2;
        let valArray: string[] = [];
        if (isObject[keys[0]].includes("*")) {
            valArray = isObject[keys[0]].split("*");
            hasAsterisk = true;
            if (isObject[keys[0]] === "**" || isObject[keys[0]] === "*") {
                return sections;
            } else if (valArray.length === 2) {
                if (valArray[0] === "") {
                    startEndAll = -1;
                } else if (valArray[1] === "") {
                    startEndAll = 1;
                } else {
                    throw new InsightError("invalid asterisk");
                }
            } else if (valArray.length === 3) {
                if (valArray[0] === "" && valArray[2] === "") {
                    startEndAll = 0;
                } else {
                    throw new InsightError("invalid asterisk");
                }
            } else {
                throw new InsightError("invalid asterisk");
            }
        }
        ret = this.isQueryHelper(ret, not, hasAsterisk, startEndAll, valArray, val, sections, isObject, keys);
        return ret;
    }

    private isQueryHelper(ret: any[], not: boolean, hasAsterisk: boolean, startEndAll: number,
                          valArray: string[], val: any, sections: any[], isObject: any, keys: any): any[] {
        sections.forEach((section: any) => {
            if (hasAsterisk) {
                if (startEndAll === -1) {
                    if (not) {
                        if (!section[val[1]].endsWith(valArray[1])) {
                            ret.push(section);
                        }
                    } else {
                        if (section[val[1]].endsWith(valArray[1])) {
                            ret.push(section);
                        }
                    }
                } else if (startEndAll === 1) {
                    if (not) {
                        if (!section[val[1]].startsWith(valArray[0])) {
                            ret.push(section);
                        }
                    } else {
                        if (section[val[1]].startsWith(valArray[0])) {
                            ret.push(section);
                        }
                    }
                } else if (startEndAll === 0) {
                    if (not) {
                        if (!section[val[1]].includes(valArray[1])) {
                            ret.push(section);
                        }
                    } else {
                        if (section[val[1]].includes(valArray[1])) {
                            ret.push(section);
                        }
                    }
                } else {
                    throw new InsightError("invalid asterisk");
                }
            } else if (not && section[val[1]] !== isObject[keys[0]]) {
                ret.push(section);
            } else if (!not && section[val[1]] === isObject[keys[0]]) {
                ret.push(section);
            }
        });
        return ret;
    }

    private greaterQuery(query: QueryValues, not: boolean, sections: any[]) {
        const greaterObject = query.query["GT"];
        const val = this.numberQueryValid(greaterObject, query.id);
        let ret: any[] = [];
        sections.forEach((section: any) => {
            if (not && section[val[0]] <= greaterObject[val[1]]) {
                ret.push(section);
            } else if (!not && section[val[0]] > greaterObject[val[1]]) {
                ret.push(section);
            }
        });
        return ret;
    }

    private numberQueryValid(query: any, id: string) {
        const keys = Object.keys(query);
        const val = keys[0].split("_");
        if (keys.length !== 1 || val[0] !== id || !this.keyNumbers.includes(val[1])
            || typeof (query[keys[0]]) !== "number" || query[keys[0]] === null) {
            throw new InsightError("NUMBER QUERY VALID");
        }
        return [val[1], keys[0]];
    }

    private lessQuery(query: QueryValues, not: boolean, sections: any[]) {
        const lessObject = query.query["LT"];
        const val = this.numberQueryValid(lessObject, query.id);
        let ret: any[] = [];
        sections.forEach((section: any) => {
            if (not && section[val[0]] >= lessObject[val[1]]) {
                ret.push(section);
            } else if (!not && section[val[0]] < lessObject[val[1]]) {
                ret.push(section);
            }
        });
        return ret;
    }

    private equalQuery(query: QueryValues, not: boolean, sections: any[]) {
        const eqObject = query.query["EQ"];
        const val = this.numberQueryValid(eqObject, query.id);
        let ret: any[] = [];
        sections.forEach((section: any) => {
            if (not && section[val[0]] !== eqObject[val[1]]) {
                ret.push(section);
            } else if (!not && section[val[0]] === eqObject[val[1]]) {
                ret.push(section);
            }
        });
        return ret;
    }

    private isObject = (obj: any) => {
        return obj === Object(obj);
    }

    private getRightKeys = (query: QueryValues, sections: any[]) => {
        let ret: any[] = [];
        sections.forEach((section: any) => {
            let rightKeys: any = {};
            query.columns.forEach((col) => {
                rightKeys[`${query.id}_${col}`] = section[col];
            });
            ret.push(rightKeys);
        });
        return ret;
    }

    private getQuery(query: QueryValues, not: boolean, start: boolean, sections: any[]): any[] {
        if (this.isObject(query.query)) {
            const keys = Object.keys(query.query);
            if (start && keys.length === 0) {
                return sections;
            } else if (keys.length === 0) {
                throw new InsightError("get query");
            } else {
                if ("NOT" in query.query) {
                    const newQuery: QueryValues = { query: query.query["NOT"], columns: query.columns, id: query.id };
                    return this.getQuery(newQuery, !not, false, sections);
                } else if ("AND" in query.query) {
                    return this.OrAndQuery(query, not, "AND", sections);
                } else if ("OR" in query.query) {
                    return this.OrAndQuery(query, not, "OR", sections);
                } else if ("IS" in query.query) {
                    return this.isQuery(query, not, sections);
                } else if ("LT" in query.query) {
                    return this.lessQuery(query, not, sections);
                } else if ("EQ" in query.query) {
                    return this.equalQuery(query, not, sections);
                } else if ("GT" in query.query) {
                    return this.greaterQuery(query, not, sections);
                } else {
                    throw new InsightError("get query 3");
                }
            }
        } else {
            throw new InsightError("get query 2");
        }
    }

    public performQuery(query: any): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            try {
                const pqh = new PerformQueryHelper();
                const hasOrder = pqh.checkOuterQuery(query, this.dict);
                this.keyNumbers = pqh.getKeyNums();
                this.keyStrings = pqh.getKeyStrs();
                const columnsForSections = this.getColumnsAndDataSet(query["OPTIONS"]["COLUMNS"]);
                const myQuery: QueryValues = { query: query["WHERE"],
                    columns: columnsForSections["columns"], id: columnsForSections["datasetID"]
                };
                const sections = this.dict[columnsForSections["datasetID"]].sections;
                let theQuery = this.getQuery(myQuery, false, true, sections);
                let sectionsRightKeys =  [];
                if (hasOrder[1]) {
                    sectionsRightKeys = new Transformations(theQuery, query["TRANSFORMATIONS"],
                        query["OPTIONS"]["COLUMNS"]).applyTransformation();
                    if (sectionsRightKeys.length >= 5000) {
                        return reject(new ResultTooLargeError());
                    }
                } else {
                    if (theQuery.length >= 5000) {
                        return reject(new ResultTooLargeError());
                    }
                    sectionsRightKeys = this.getRightKeys(myQuery, theQuery);
                }
                if (hasOrder[0]) {
                    if (typeof query["OPTIONS"]["ORDER"] === "string") {
                        return resolve(Lib.sort(query["OPTIONS"]["ORDER"], sectionsRightKeys));
                    } else if (typeof query["OPTIONS"]["ORDER"] === "object") {
                        return resolve(Lib.sortFirst(query["OPTIONS"]["ORDER"], sectionsRightKeys));
                    } else {
                        return reject(new InsightError());
                    }
                } else {
                    return resolve(sectionsRightKeys);
                }
            } catch (e) {
                return reject(e);
            }
        });
    }
}
