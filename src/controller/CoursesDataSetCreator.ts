import {IDataSetCreator} from "./IDataSetCreator";
import * as JSZip from "jszip";
import {InsightDatasetKind} from "./IInsightFacade";
import DatasetTypeController from "./DatasetTypeController";

export default class CoursesDataSetCreator implements IDataSetCreator {
    private jsonContentParser = (kind: InsightDatasetKind, jsonContent: any,
                                 allData: {changed: boolean; values: any[]}) => {
        let dtc = new DatasetTypeController();
        const keys = dtc.getCourseDatasetAllKeys();
        if ("result" in jsonContent) {
            if (!(jsonContent.result.length === 0)) {
                jsonContent.result.forEach((values: any) => {
                    let translatedValues: any = {};
                    for (const key of keys) {
                        if (key in values) {
                            if (key === "Year") {
                                if (values["Section"] === "overall") {
                                    translatedValues = dtc.datasetOrganizer(kind, key, translatedValues, "1900");
                                } else {
                                    translatedValues = dtc.datasetOrganizer(kind, key, translatedValues, values[key]);
                                }
                            } else {
                                translatedValues = dtc.datasetOrganizer(kind, key, translatedValues, values[key]);
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

    private checkAllKeysCourses(kind: InsightDatasetKind, results: any[]): {changed: boolean, values: any[]} {
        let allData: {changed: boolean; values: any[]} = {
            changed: false, values: []
        };
        results.forEach((r) => {
            if (r.includes("result")) {
                const jsonContent = JSON.parse(r);
                allData = this.jsonContentParser(kind, jsonContent, allData);
            }
        });
        return allData;
    }

    public addDataset(result: JSZip): Promise<{changed: boolean, values: any[]}> {
        let promises: Array<Promise<any>> = [];
        result.folder("courses").forEach((relativePath, file) => {
            promises.push(file.async("string"));
        });
        return Promise.all(promises).then((results) => {
            return this.checkAllKeysCourses(InsightDatasetKind.Courses, results);
        });
    }

}
