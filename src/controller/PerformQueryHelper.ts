import { InsightError, QueryValues, ResultTooLargeError } from "./IInsightFacade";
import ValidateDataset from "./ValidateDataset";
import DatasetTypeController from "./DatasetTypeController";
import Log from "../Util";
export default class PerformQueryHelper {
    private kind: string;
    private dtc: DatasetTypeController;
    private dict: any;
    constructor(dict: any) {
        this.dtc = new DatasetTypeController();
        this.dict = dict;
    }

    /*
    within PerformQueryClass:
    private checkOuterQuery = (query: any) => {
        const validate = new ValidateDataset();
        const helper = new Helper();
        const valid: boolean = validate.checkQuery(query, this.dict);
        if (!valid) {
            throw new InsightError("not valid");
        } else {
            this.allowedKeys = helper.setKeys(validate.getKind());
            return query["OPTIONS"].hasOwnProperty("ORDER");
        }
    }
    */

    public checkOuterQuery = (query: any, dict: any) => {
        const validate = new ValidateDataset();
        const valid: boolean = validate.checkQuery(query, dict);
        this.kind = validate.getKind();
        if (!valid) {
            throw new InsightError("not valid");
        } else {
            return [query["OPTIONS"].hasOwnProperty("ORDER"), query.hasOwnProperty("TRANSFORMATIONS")];
        }
    }

    public getColumnsAndDataSet = (columns: string[]) => {
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

    public getKeyNums() {
        return this.kind === "courses" ? this.dtc.getCourseKeysNum() : this.dtc.getRoomKeysNum();
    }

    public getKeyStrs() {
        return this.kind === "courses" ? this.dtc.getCourseKeysStr() : this.dtc.getRoomKeysStr();
    }
}
