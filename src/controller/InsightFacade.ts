import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as fs from "fs-extra";
import * as path from "path";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    private dict: any;
    private cacheDir = path.join(__dirname, "../../data");
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
                Log.trace(readDir);
                const dictInCache = fs.readFileSync(readDir).toString();
                this.dict = JSON.parse(dictInCache);
            }
        }
        Log.trace("InsightFacadeImpl::init()");
    }

    private notValidID = (id: string, kind: InsightDatasetKind) => {
        if (kind === InsightDatasetKind.Rooms) {
            return true;
        }
        if (id.includes("_")) {
            return true;
        } else {
            if (id.trim().length === 0) {
                return true;
            } else if (id in this.dict) {
                return true;
            } else {
                return !/[^_]+/.test(id);
            }
        }
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

    private writeIntoDisc = () => {
        const stringData = JSON.stringify(this.dict);
        const writeDir = path.join(this.cacheDir, "./disc.json");
        fs.writeFileSync( writeDir, stringData);
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
                        let allData: {changed: boolean; values: any[]} = {
                            changed: false, values: []
                        };
                        results.forEach((r) => {
                            if (r.includes("result")) {
                                const jsonContent = JSON.parse(r);
                                if ("result" in jsonContent) {
                                    if (!(jsonContent.result.length === 0)) {
                                        jsonContent.result.forEach((values: any) => {
                                            allData.changed = true;
                                            allData["values"].push(values);
                                        });
                                    }
                                }
                            }
                        });
                        return allData;
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
        return Promise.reject("Not implemented.");
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
