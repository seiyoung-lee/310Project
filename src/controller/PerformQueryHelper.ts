import { InsightError, QueryValues, ResultTooLargeError } from "./IInsightFacade";
import ValidateDataset from "./ValidateDataset";
import DatasetTypeController from "./DatasetTypeController";
import Log from "../Util";
export default class PerformQueryHelper {
    private kind: string;
    private dtc: DatasetTypeController;
    constructor() {
        this.dtc = new DatasetTypeController();
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
            return query["OPTIONS"].hasOwnProperty("ORDER");
        }
    }

    public getKeyNums() {
        return this.kind === "courses" ? this.dtc.getCourseKeysNum() : this.dtc.getRoomKeysNum();
    }

    public getKeyStrs() {
        return this.kind === "courses" ? this.dtc.getCourseKeysStr() : this.dtc.getRoomKeysStr();
    }
}
