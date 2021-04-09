import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
} from "./IInsightFacade";
import PerformQueryClass from "./performQueryClass";
import * as fs from "fs-extra";
import * as path from "path";
import * as JSZip from "jszip";
import {IDataSetCreator} from "./IDataSetCreator";
import CoursesDataSetCreator from "./CoursesDataSetCreator";
import RoomsDataSetCreator from "./RoomsDataSetCreator";


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
        if (id === null || typeof id === "undefined" || id.includes("_")) {
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
        if (kind === InsightDatasetKind.Courses || kind === InsightDatasetKind.Rooms) {
            if (id in this.dict) {
                Log.trace(3);
                return true;
            } else {
                Log.trace(2);
                return this.notValidIDRemove(id);
            }
        } else {
            Log.trace(1);
            return true;
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
                Log.trace(id);
                return reject(new InsightError());
            } else {
                let Zip = new JSZip();
                return Zip.loadAsync(content, {base64: true})
                    .then((result) => {
                        let dataSetCreator: IDataSetCreator;
                        if (kind  === InsightDatasetKind.Courses) {
                            dataSetCreator = new CoursesDataSetCreator();
                        } else {
                            dataSetCreator = new RoomsDataSetCreator();
                        }
                        return dataSetCreator.addDataset(result);
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
                    }).catch((e) => {
                        return reject(new InsightError(e));
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
                    return resolve(id);
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
