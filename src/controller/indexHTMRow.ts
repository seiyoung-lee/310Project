import {InsightError, LatLongError} from "./IInsightFacade";
import * as JSZip from "jszip";
import Lib from "./Lib";
import Log from "../Util";
import Geolocation from "./Geolocation";

export default class IndexHTMRow {
    private readonly buildingCode: string;
    private readonly address: string;
    private link: string;
    private rooms: JSZip;
    private readonly buildingName: string;

    private correctTDIndexHtml(element: any): boolean {
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                if (child.nodeName === "td" && child.attrs[0].value.includes("views-field-field-room")) {
                    return true;
                }
            }
        }
        return false;
    }

    private correctTRIndexHtml(element: any): boolean {
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                if (child.nodeName === "tr") {
                    return this.correctTDIndexHtml(child);
                }
            }
        }
        return false;
    }

    private correctTableIndexHtml(element: any): boolean {
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                if (child.nodeName === "tbody") {
                    if (this.correctTRIndexHtml(child)) {
                        return child;
                    }
                }
            }
        }
        return false;
    }

    private findIndexHTMTable(element: any): any {
        if (element.nodeName === "table") {
            return this.correctTableIndexHtml(element);
        }
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                const possibleTable = this.findIndexHTMTable(child);
                if (possibleTable) {
                    return possibleTable;
                }
            }
        }
        return false;
    }

    constructor(element: any, rooms: JSZip) {
        let index: number = 0;
        if  (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                if (child.nodeName === "td") {
                    if (child.attrs[0].value.includes("building-code")) {
                        this.buildingCode  = child.childNodes[0].value.trim();
                        index += 1;
                    } else if (child.attrs[0].value.includes("building-address")) {
                        this.address = child.childNodes[0].value.trim();
                        index += 1;
                    } else if (child.attrs[0].value.includes("field-title")) {
                        this.buildingName = child.childNodes[1].childNodes[0].value.trim();
                        index += 1;
                    }  else {
                        for (let c of child.childNodes) {
                            if (c.nodeName === "a") {
                                for (let attrs of c.attrs) {
                                    if (attrs["name"] === "href") {
                                        this.link = attrs["value"];
                                        index += 1;
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
            if (index < 3) {
                throw new InsightError();
            }
            this.rooms = rooms;
        } else {
            throw new InsightError();
        }
    }

    private stringNumeric = (val: string) => {
        return /^\d+$/.test(val);
    }

    private finishAnalysis(element: any, latlon: any): any {
        let ret: any = element;
        ret["fullname"] = this.buildingName;
        ret["shortname"] = this.buildingCode;
        ret["address"] = this.address;
        ret["lat"] = latlon.lat;
        ret["lon"] = latlon.lon;
        ret["name"] = `${this.buildingCode}_${ret["number"]}`;
        return ret;
    }

    private getRawValues(element: any, latlon: any): any {
        let index: number = 0;
        let rawValues: any = {};
        if  (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                if (child.nodeName === "td") {
                    if (child.attrs[0].value.includes("room-number")) {
                        rawValues["number"] =  child.childNodes[1].childNodes[0].value.trim();
                        index += 1;
                    } else if (child.attrs[0].value.includes("room-capacity")) {
                        const capacity  = child.childNodes[0].value.trim();
                        if (this.stringNumeric(capacity)) {
                            rawValues["seats"]  = Number(capacity);
                            index += 1;
                        } else if (capacity === "") {
                            rawValues["seats"]  = 0;
                            index += 1;
                        }
                    } else if (child.attrs[0].value.includes("room-furniture")) {
                        rawValues["furniture"]  = child.childNodes[0].value.trim();
                        index += 1;
                    } else if (child.attrs[0].value.includes("room-type")) {
                        rawValues["type"]  = child.childNodes[0].value.trim();
                        index += 1;
                    } else {
                        for (let c of child.childNodes) {
                            if (c.nodeName === "a") {
                                for (let attrs of c.attrs) {
                                    if (attrs["name"] === "href") {
                                        rawValues["href"] = attrs["value"];
                                        index += 1;
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }
            if (index < 5) {
                throw new InsightError();
            }
            return this.finishAnalysis(rawValues, latlon);
        } else {
            throw new InsightError();
        }
    }

    public parser(): Promise<any> {
        return new Promise<any>(((resolve, reject) => {
            try {
                const folders: string[] = this.link.split("/");
                let currFolder: JSZip = null;
                for (let i = 1; i < folders.length - 1; i++) {
                    if (currFolder == null) {
                        currFolder = this.rooms.folder(folders[i]);
                    } else {
                        currFolder = currFolder.folder(folders[i]);
                    }
                }
                const geoLocation = new Geolocation();
                return geoLocation.getGeoLocation(this.address).then((latLon) => {
                    const file = currFolder.file(folders[folders.length - 1]);
                    return file.async("string").then(Lib.parseHTML).then((parsed) => {
                        const table = this.findIndexHTMTable(parsed);
                        if (table) {
                            let ret: any[] = [];
                            for (let child of table.childNodes) {
                                if (child.nodeName === "tr") {
                                    ret.push(this.getRawValues(child, latLon));
                                }
                            }
                            return resolve(ret);
                        } else {
                            return resolve([]);
                        }
                    });
                }).catch((e: LatLongError) => {
                    return resolve([]);
                }).catch((e) => {
                    return reject(new InsightError());
                });
            } catch (e) {
                Log.trace(e);
            }
        }));
    }
}
