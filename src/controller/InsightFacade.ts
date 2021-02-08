import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ObjectValues
} from "./IInsightFacade";
import ValidateDataset from "./ValidateDataset";
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
        }
        if (id.includes("_")) {
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

    private checkAllKeysCourses = (results: any[]) => {
        let allData: {changed: boolean; values: ObjectValues[]} = {
            changed: false, values: []
        };
        const keys = ["Course", "Avg", "Professor", "Title", "Pass", "Fail", "Audit", "id", "Year", "Subject"];
        results.forEach((r) => {
            if (r.includes("result")) {
                const jsonContent = JSON.parse(r);
                if ("result" in jsonContent) {
                    if (!(jsonContent.result.length === 0)) {
                        jsonContent.result.forEach((values: any) => {
                            let translatedValues: any = {};
                            for (const key of keys) {
                                if (key in values) {
                                    switch (key) {
                                        case "Course":
                                            translatedValues["id"] = values[key];
                                            break;
                                        case "id":
                                            translatedValues["uuid"] = values[key];
                                            break;
                                        case "Subject":
                                            translatedValues["dept"] = values[key];
                                            break;
                                        case "Professor":
                                            translatedValues["instructor"] = values[key];
                                            break;
                                        default:
                                            translatedValues[key.toLowerCase()] = values[key];
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
            }
        });
        return allData;
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        return new Promise<string[]>((resolve, reject) => {
            if (this.notValidID(id, kind)) {
                reject(new InsightError());
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
                       reject(new InsightError());
                    }
                }).catch((e) => {
                    Log.trace(e);
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
        let validate: ValidateDataset = new ValidateDataset();
        let valid: boolean = validate.checkQuery(query, this.dict);
        return new Promise<string[]>( (resolve, reject) => {
            if (!valid) {
                return reject(new InsightError());
            } else {
                // where -> ["AND", "OR", "GT", "EQ", "LT", "IS", "NOT"] -> this.dict.keys
                // options -> ["COLUMNS", "ORDER"] -> this.dict.keys

            return reject("Not implemented.");
        }
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        return new Promise<InsightDataset[]>((resolve, reject) => {
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
