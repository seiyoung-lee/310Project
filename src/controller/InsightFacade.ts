import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ObjectValues,
    QueryValues
} from "./IInsightFacade";
import PerformQueryClass from "./performQueryClass";
import * as fs from "fs-extra";
import * as path from "path";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private readonly dict: any;
    private cacheDir: string = path.join(__dirname, "../../data");
    constructor() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir);
            this.dict = {};
        } else {
            const filenames = fs.readdirSync(this.cacheDir);
            if (filenames.length === 0) {
                this.dict = {};
            } else {
                const readDir = path.join(this.cacheDir, `./${filenames[0]}`);
                const dictInCache = fs.readFileSync(readDir).toString();
                this.dict = JSON.parse(dictInCache);
            }
        }
        Log.trace("InsightFacadeImpl::init()");
    }
    private notValidIDRemove = (id: string) => {
        if (id.includes("_")) {
            return true;
        } else {
            if (id.trim().length === 0) {
                return true;
            }  else {
                return !/[^_]+/.test(id);
            }
        }
    }
    private notValidID = (id: string, kind: InsightDatasetKind) => {
        if (kind === InsightDatasetKind.Rooms) {
            return true;
        } else {
            if (id in this.dict) {
                return true;
            } else {
                return this.notValidIDRemove(id);
            }
        }
    }
    private writeIntoDisc = () => {
        const stringData = JSON.stringify(this.dict);
        const writeDir = path.join(this.cacheDir, "./disc.json");
        fs.writeFileSync( writeDir, stringData);
    }
    private isNumber = (val: any) => {
        return(typeof (val) === "number");
    }
    private isString = (val: any) => {
        return(typeof (val) === "string");
    }
    private stringNumeric = (val: string) => {
        return /^\d+$/.test(val);
    }
    private datasetOrganizer = (key: string, translatedValues: any, value: number | string) => {
        switch (key) {
            case "Course":
                translatedValues["id"] = value;
                return this.isString(value) ? translatedValues : false;
            case "id":
                translatedValues["uuid"] = `${value}`;
                return this.isNumber(value) ? translatedValues : false;
            case "Subject":
                translatedValues["dept"] = value;
                return this.isString(value) ? translatedValues : false;
            case "Professor":
                translatedValues["instructor"] = value;
                return this.isString(value) ? translatedValues : false;
            case "Avg":
                translatedValues["avg"] = value;
                return this.isNumber(value) ? translatedValues : false;
            case "Title":
                translatedValues["title"] = value;
                return this.isString(value) ? translatedValues : false;
            case "Fail":
                translatedValues["fail"] = value;
                return this.isNumber(value) ? translatedValues : false;
            case "Pass":
                translatedValues["pass"] = value;
                return this.isNumber(value) ? translatedValues : false;
            case "Audit":
                translatedValues["audit"] = value;
                return this.isNumber(value) ? translatedValues : false;
            case "Year":
                if (this.isString(value) && this.stringNumeric(typeof value === "string" ? value : "not")) {
                    translatedValues["year"] = Number(value);
                    return translatedValues;
                } else {
                    return false;
                }
                translatedValues["year"] = value;
            default:
                throw new Error();
        }
    }
    private jsonContentParser = (jsonContent: any, allData: {changed: boolean; values: ObjectValues[]}) => {
        const keys = ["Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year", "Subject"];
        if ("result" in jsonContent) {
            if (!(jsonContent.result.length === 0)) {
                jsonContent.result.forEach((values: any) => {
                    let translatedValues: any = {};
                    for (const key of keys) {
                        if (key in values) {
                            if (key === "Year") {
                                if (values["Section"] === "overall") {
                                    translatedValues = this.datasetOrganizer(key, translatedValues, "1900");
                                } else {
                                    translatedValues = this.datasetOrganizer(key, translatedValues, values[key]);
                                }
                            } else {
                                translatedValues = this.datasetOrganizer(key, translatedValues, values[key]);
                            }
                            if (!translatedValues) {
                                translatedValues = {};
                                break;
                            }
                        } else {
                            translatedValues = {};
                            break;
                        }
                    }
                    if (Object.keys(translatedValues).length !== 0) {
                        allData.changed = true;
                        allData["values"].push(translatedValues);
                    }
                });
            }
        }
        return allData;
    }
    private checkAllKeysCourses = (results: any[]) => {
        let allData: {changed: boolean; values: ObjectValues[]} = {
            changed: false, values: []
        };
        results.forEach((r) => {
            if (r.includes("result")) {
                const jsonContent = JSON.parse(r);
                allData = this.jsonContentParser(jsonContent, allData);
            }
        });
        return allData;
    }
    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (this.notValidID(id, kind)) {
                return reject(new InsightError());
            } else {
                let Zip = new JSZip();
                return Zip.loadAsync(content, {base64: true})
                    .then((result) => {
                        let promises: Array<Promise<any>> = [];
                        result.folder("courses").forEach((relativePath, file) => {
                            promises.push(file.async("string"));
                        });
                        return Promise.all(promises).then((results) =>  {
                            return this.checkAllKeysCourses(results);
                        });
                    }).then((data) => {
                        if (data.changed) {
                            this.dict[id] = {
                                sections: data.values,
                                type: kind
                            };
                            this.writeIntoDisc();
                            return resolve(Object.keys(this.dict));
                        } else {
                            return reject(new InsightError());
                        }
                    }).catch(() => {
                        reject(new InsightError());
                });
            }
        });
    }
    public removeDataset(id: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (this.notValidIDRemove(id)) {
                return reject(new InsightError());
            } else {
                if (!(id in this.dict)) {
                    return reject(new NotFoundError());
                } else {
                    delete this.dict[id];
                    this.writeIntoDisc();
                    resolve(id);
                }
            }
        });
    }
    public performQuery(query: any): Promise<any[]> {
        let pqc = new PerformQueryClass(this.dict);
        return pqc.performQuery(query);
    }
    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve) => {
            const keys = Object.keys(this.dict);
            let ret: InsightDataset[] = [];
            keys.forEach((key) => {
                const values = this.dict[key];
                const pushedVal: InsightDataset = {
                    id: key,
                    kind: values.type,
                    numRows: values.sections.length
                };
                ret.push(pushedVal);
            });
            return resolve(ret);
        });
    }
}
