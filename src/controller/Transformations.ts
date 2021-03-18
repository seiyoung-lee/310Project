import Decimal from "decimal.js";
import {InsightDatasetKind} from "./IInsightFacade";
import DatasetTypeController from "./DatasetTypeController";

export default class Transformations {
    private readonly sections: any[];
    private readonly columns: string[];
    private readonly transform: {GROUP: string[], APPLY: any[]};
    private readonly GroupSections: any;

    constructor(sections: any[], transform: {GROUP: string[], APPLY: any[]}, columns: string[]) {
        this.sections = sections;
        this.transform  =  transform;
        this.columns = columns;
        this.GroupSections = {};
    }

    private max(key: string): any {
        const ret: any = {};
        const groupSections = Object.keys(this.GroupSections);
        for (let groupSection of groupSections) {
            let max = 0;
            for (let section of this.GroupSections[groupSection].sections) {
                if (max < section[key]) {
                    max = section[key];
                }
            }
            ret[groupSection] = max;
        }
        return ret;
    }

    private min(key: string): any {
        const ret: any = {};
        const groupSections = Object.keys(this.GroupSections);
        for (let groupSection of groupSections) {
            let min = 0;
            for (let section of this.GroupSections[groupSection].sections) {
                if (min > section[key]) {
                    min = section[key];
                }
            }
            ret[groupSection] = min;
        }
        return ret;
    }

    private avg(key: string): any {
        const ret: any = {};
        const groupSections = Object.keys(this.GroupSections);
        for (let groupSection of groupSections) {
            let sum = new Decimal(0);
            for (let section of this.GroupSections[groupSection].sections) {
                const deci = new Decimal(section[key]);
                sum = Decimal.add(deci, sum);
            }
            let avg = sum.toNumber() / this.GroupSections[groupSection]["sections"].length;
            ret[groupSection] = Number(avg.toFixed(2));
        }
        return ret;
    }

    private count(key: string): any {
        const ret: any = {};
        const groupSections = Object.keys(this.GroupSections);
        for (let groupSection of groupSections) {
            let count = 0;
            let alreadyExisting: any[] = [];
            for (let section of this.GroupSections[groupSection].sections) {
                if (!alreadyExisting.includes(section[key])) {
                    alreadyExisting.push(section[key]);
                    count  = count + 1;
                }
            }
            ret[groupSection] = count;
        }
        return ret;
    }

    private sum(key: string): any {
        const ret: any = {};
        const groupSections = Object.keys(this.GroupSections);
        for (let groupSection of groupSections) {
            let sum = new Decimal(0);
            for (let section of this.GroupSections[groupSection].sections) {
                const deci = new Decimal(section[key]);
                sum = Decimal.add(deci, sum);
            }
            ret[groupSection] = Number(sum.toNumber().toFixed(2));
        }
        return ret;
    }

    private which(key: string, passedKey: string): any {
        let keys;
        switch (key) {
            case "MAX":
                keys = this.max(passedKey);
                break;
            case "MIN":
                keys = this.min(passedKey);
                break;
            case "AVG":
                keys = this.avg(passedKey);
                break;
            case "COUNT":
                keys = this.count(passedKey);
                break;
            case "SUM":
                keys = this.sum(passedKey);
                break;
            default:
                throw new Error();
        }
        return keys;
    }

    private apply(): any[] {
        const trans: any[] = this.transform["APPLY"];
        let ret: any[] = [];
        const group: string[] = this.transform["GROUP"];
        for (let tran of trans) {
            const keyOuter = Object.keys(tran);
            const key = Object.keys(tran[keyOuter[0]]);
            const passedKey = tran[keyOuter[0]][key[0]].split("_")[1];
            let keys = this.which(key[0], passedKey);
            for (let k in keys) {
                if (this.GroupSections.hasOwnProperty(k) && keys.hasOwnProperty(k)) {
                    this.GroupSections[k][keyOuter[0]] = keys[k];
                }
            }
        }
        for (let groups in this.GroupSections) {
            const overallSection: any =  {};
            if (this.GroupSections.hasOwnProperty(groups)) {
                for (let allKeys in this.GroupSections[groups]) {
                    if (allKeys === "sections") {
                        const section = this.GroupSections[groups]["sections"][0];
                        for (let element of group) {
                            const rawKey = element.split("_")[1];
                            overallSection[element] = section[rawKey];
                        }
                    } else {
                        overallSection[allKeys] = this.GroupSections[groups][allKeys];
                    }
                }
                ret.push(overallSection);
            }
        }
        return ret;
    }

    public applyTransformation(): any[] {
        const group: string[] = this.transform["GROUP"];
        for (let section of this.sections) {
            let key: string = "";
            for (let element of group) {
                const rawKey = element.split("_")[1];
                key = key + section[rawKey];
            }
            if (this.GroupSections.hasOwnProperty(key)) {
                let sectionGroup: any[] = this.GroupSections[key]["sections"];
                sectionGroup.push(section);
                this.GroupSections[key]["sections"] = sectionGroup;
            } else {
                this.GroupSections[key] = {
                    sections: [section]
                };
            }
        }
        return this.apply();
    }
}
