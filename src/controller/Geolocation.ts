import {InsightError, QueryValues, ResultTooLargeError, InsightDatasetKind, LatLongError} from "./IInsightFacade";
import * as http from "http";
import Log from "../Util";


export default class Geolocation {
    private url: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team171/";
    private LatLon: {};
    private parsedData: string;

    constructor() {
        this.LatLon = {};
        this.parsedData = "";
    }

    public getLatLon() {
        return this.LatLon;
    }

    private getGeoRequest = (url: string): Promise<any> => {
        return new Promise<{}> ((resolve, reject) => {
            let rawData: string =  "";
            http.get(url, ((res) => {
                // check for response status
                const {statusCode} = res;
                if (!/2[0-9][0-9]/.test(statusCode.toString())) {
                    return reject(new LatLongError("response status not 2xx"));
                }
                res.setEncoding("utf8");
                res.on("data", (linesReturned) => {
                    rawData += linesReturned;
                });
                res.on("end", () => {
                    this.parsedData = rawData;
                    return resolve(rawData);
                });
                return resolve(rawData);
            })).on("error", (err: any) => {
                return reject(new Error(err));
            });
        });
    }

    public getGeoLocation(address: string): Promise<any> {
        // address corrected during html parsing
        return new Promise<{}>((resolve, reject) => {
            let parsedAddress = address.trim().split(" ").join("%20");
            let constructedUrl = this.url.concat(parsedAddress);
            return this.getGeoRequest(constructedUrl)
                .then((response: any) => {
                    let resObj = JSON.parse(this.parsedData);
                    this.LatLon = { lat: resObj.lat, lon: resObj.lon};
                    return resolve(this.LatLon);
                })
                .catch((e: any) => {
                    return reject(new InsightError(e));
                });
        });
    }
}
