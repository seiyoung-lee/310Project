import {IDataSetCreator} from "./IDataSetCreator";
import * as JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import Log from "../Util";
import Lib from "./Lib";
import IndexHTMRow from "./indexHTMRow";

export default class RoomsDataSetCreator implements IDataSetCreator {

    private correctTDIndexHtml(element: any): boolean {
        if (element.childNodes && element.childNodes.length > 0) {
            for (let child of element.childNodes) {
                if (child.nodeName === "td" && child.attrs[0].value.includes("views-field-field-building")) {
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

    private parseTable(element: any, rooms: JSZip): Promise<{changed: boolean, values: any[]}> {
        return new Promise(((resolve, reject) => {
            let dataSet: any[] = [];
            let promiseArray: Array<Promise<any>> = [];
            for (let c of element.childNodes) {
                if (c.nodeName === "tr") {
                    const roomParser = new IndexHTMRow(c, rooms);
                    promiseArray.push(roomParser.parser());
                }
            }
            return Promise.all(promiseArray).then((allRooms: any[]) => {
                dataSet = dataSet.concat.apply([], allRooms);
                return resolve({changed: true, values: dataSet});
            }).catch((e) => {
                return reject(new InsightError());
            });
        }));
    }

    public addDataset(result: JSZip): Promise<{changed: boolean, values: any[]}> {
        return new Promise<{changed: boolean; values: any[]}>((resolve, reject) => {
            const rooms = result.folder("rooms");
            try {
                const htmlFile = rooms.file("index.htm");
                return htmlFile.async("string").then(Lib.parseHTML).then((parsed: any) => {
                    const table = this.findIndexHTMTable(parsed);
                    if (table) {
                        return resolve(this.parseTable(table, rooms));
                    } else {
                        return reject(new InsightError());
                    }
                });
            } catch (e) {
                return reject(new InsightError());
            }
        });
    }
}
