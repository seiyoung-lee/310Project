import { InsightError, QueryValues, ResultTooLargeError, InsightDatasetKind } from "./IInsightFacade";
import Geolocation from "./Geolocation";
import Log from "../Util";

export default class DatasetTypeController {
    // except for those specified, all functions can be used for both rooms and courses
    private courseKeysStr: string[];
    private courseKeysNum: string[];
    private courseDatasetAllKeys: string[];
    private courseQueryAllKeys: string[];

    private roomKeysStr: string[];
    private roomKeysNum: string[];
    private roomDatasetAllKeys: string[];
    private roomQueryAllKeys: string[];


    constructor() {
        this.setCourseKeys();
        this.setRoomKeys();
    }

    public setCourseKeys(): void {
        this.courseDatasetAllKeys = ["Course", "Avg", "Professor", "Title", "Pass", "Fail",
            "Audit", "id", "Year", "Subject"];
        this.courseQueryAllKeys = ["fail", "pass", "avg", "year", "audit",
            "course", "uuid", "instructor", "title", "id", "dept"];
        this.courseKeysStr = ["course", "uuid", "instructor", "title", "id", "dept"];
        this.courseKeysNum = ["fail", "pass", "avg", "year", "audit"];
    }

    public setRoomKeys(): void {
        // wrong, use it for translating
        // seats<>capacity I think the only difference from the website
        // also, fullname, shortname, name (rooms_shortname+"_"+rooms_number.), should be parsed in html
        this.roomDatasetAllKeys = ["fullname", "shortname", "number", "name", "address", "type",
            "furniture", "href", "lat", "lon", "seats"];
        this.roomQueryAllKeys = ["fullname", "shortname", "number", "name", "address", "type",
            "furniture", "href", "lat", "lon", "seats"];
        this.roomKeysStr = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
        this.roomKeysNum = ["lat", "lon", "seats"];
    }

    public getCourseDatasetAllKeys(): string[] {
        return this.courseDatasetAllKeys;
    }

    public getCourseQueryAllKeys(): string[] {
        return this.courseQueryAllKeys;
    }

    public getCourseKeysStr(): string[] {
        return this.courseKeysStr;
    }

    public getCourseKeysNum(): string[] {
        return this.courseKeysNum;
    }

    public getRoomDatasetAllKeys(): string[] {
        return this.roomDatasetAllKeys;
    }

    public getRoomQueryAllKeys(): string[] {
        return this.roomQueryAllKeys;
    }

    public getRoomKeysStr(): string[] {
        return this.roomKeysStr;
    }

    public getRoomKeysNum(): string[] {
        return this.roomKeysNum;
    }


    // room lat/long needs direct call to geolocation


    private isNumber = (val: any) => {
        return(typeof (val) === "number");
    }

    private isString = (val: any) => {
        return(typeof (val) === "string");
    }

    private stringNumeric = (val: string) => {
        return /^\d+$/.test(val);
    }

    private setCourseDict = (key: string, translatedValues: any, value: number | string) => {
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
            default:
                throw new Error();
        }
    }

    private setRoomDict = (key: string, translatedValues: any, value: number | string) => {
        // WARNING!!! DO NOT MERGE incorrect translatedValues keys
        switch (key) {
            case "fullname":
                translatedValues["id"] = value;
                return this.isString(value) ? translatedValues : false;
            case "shortname":
                translatedValues["uuid"] = `${value}`;
                return this.isString(value) ? translatedValues : false;
            case "number":
                translatedValues["dept"] = value;
                return this.isString(value) ? translatedValues : false;
            case "Name":
                translatedValues["instructor"] = value;
                return this.isString(value) ? translatedValues : false;
            case "address":
                translatedValues["avg"] = value;
                return this.isString(value) ? translatedValues : false;
            case "type":
                translatedValues["title"] = value;
                return this.isString(value) ? translatedValues : false;
            case "furniture":
                translatedValues["fail"] = value;
                return this.isString(value) ? translatedValues : false;
            case "href":
                translatedValues["pass"] = value;
                return this.isString(value) ? translatedValues : false;
            case "lat":
                // needs call to geolocator.lat
                translatedValues["audit"] = value;
                return this.isNumber(value) ? translatedValues : false;
            case "lon":
                // needs call to geolocator.lon
                translatedValues["audit"] = value;
                return this.isNumber(value) ? translatedValues : false;
            case "seats":
                translatedValues["audit"] = value;
                return this.isNumber(value) ? translatedValues : false;
            default:
                throw new Error();
        }
    }

    public datasetOrganizer(kind: InsightDatasetKind, key: string, translatedValues: any, value: number | string) {
        if (kind === "courses") {
            translatedValues = this.setCourseDict(key, translatedValues, value);
            return translatedValues;
        } else if (kind === "rooms") {
            // WARNING!!! DO NOT MERGE incorrect translatedValues keys
            return this.setRoomDict(key, translatedValues, value);
        } else {
            throw new Error();
        }
    }
}
