export default class ValidateDataset {

    public static checkWhere(query: any, globalID: string, dict: any): boolean {
        for (let key in query) {
            let cleanKey = key.split("_");
            if (globalID === "") {
                globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== globalID) {
                    return false;
                }
            }
            if (cleanKey.length !== 2) {
                return false;
            }
            if (!(cleanKey[1] in dict[globalID].values.keys)) {
                return false;
            }
            if (typeof query[key] !== "number") {
                return false;
            }
        }
        return true;
    }

    public static checkIsNot(query: any, globalID: string, dict: any): boolean {
        for (let key in query) {
            let cleanKey = key.split("_");
            if (globalID === "") {
                globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== globalID) {
                    return false;
                }
            }
            if (cleanKey.length !== 2) {
                return false;
            }
            if (!(cleanKey[1] in dict[globalID].values.keys)) {
                return false;
            }
            if (typeof query[key] !== "string" || typeof query[key] !== "number") {
                return false;
            }
        }
        return true;
    }
    public static checkAnd(query: any, globalID: string, dict: any): boolean {
        for (let index in query) {
            if (index === "AND") {
                this.checkAnd(query["AND"], globalID, dict);
            } else if (index === "OR") {
                this.checkOr(query["OR"], globalID, dict);
            } else if (index in ["GT", "EQ", "LT"]) {
                if (!(this.checkWhere(query["WHERE"]["AND"][index], globalID, dict))) {
                    return false;
                }
            } else if (index in ["IS", "NOT"]) {
                if (!(this.checkIsNot(query["WHERE"][index], globalID, dict))) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }
    public static checkOr(query: any, globalID: string, dict: any): boolean {
        for (let index in query) {
            if (index === "AND") {
                this.checkAnd(query["AND"], globalID, dict);
            } else if (index === "OR") {
                this.checkOr(query["OR"], globalID, dict);
            } else if (index in ["GT", "EQ", "LT", "IS", "NOT"]) {
                if (!(this.checkWhere(query["WHERE"]["AND"][index], globalID, dict))) {
                    return false;
                }
            } else if (index in ["IS", "NOT"]) {
                if (!(this.checkIsNot(query["WHERE"][index], globalID, dict))) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }
    public static checkOrder(query: any, optionKeys: string[], globalID: string, dict: any): void {
        for (let key in query) { // might throw an error because of var instead of let
            let cleanKey = key.split("_");
            if (globalID === "") {
                globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== globalID) {
                    optionKeys = [];
                    return;
                }
            }
            if (cleanKey.length !== 2 || !(cleanKey[1] in dict[globalID].values.keys)) {
                optionKeys = [];
                return;
            } else {
                if (!(cleanKey[1] in optionKeys)) {
                    optionKeys = [];
                    return;
                } else {
                    optionKeys.push(key);
                }
            }
        }
    }
    public static checkColumns(query: any, optionKeys: string[], globalID: string, dict: any): boolean {
        for (let key in query) {
            let cleanKey = key.split("_");
            if (globalID === "") {
                globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== globalID) {
                    return false;
                }
            }
            if (cleanKey.length !== 2) {
                return false;
            }
            if (!(cleanKey[1] in dict[globalID].values.keys)) {
                return false;
            } else {
                if (!(cleanKey[1] in optionKeys)) {
                    return false;
                }
            }
        }
        return true;
    }
    public static checkQuery(query: any, dict: any): boolean {
        if (typeof query === "undefined" || typeof query === "number" ||
            query == null || query.length <= 1) {return false; }
        let globalID: string = "";
        // let inputQuery = JSON.parse(query);
        let inputQuery = query;
        if (!inputQuery.hasOwnProperty("WHERE")) {return false; }
        let flagEquality: boolean = false;
        let and: boolean = inputQuery["WHERE"].hasOwnProperty("AND");
        let or: boolean = inputQuery["WHERE"].hasOwnProperty("OR");
        if (and && or) {return false; }
        if (and) {
            if (!this.checkAnd(inputQuery, globalID, dict)) {return false; }
        } else if (or) {
            if (!this.checkOr(inputQuery, globalID, dict)) {return false; }
        } else {
            for (let key in inputQuery["WHERE"]) {
                if (key in ["GT", "EQ", "LT"]) {
                    flagEquality = true;
                    if (!(this.checkWhere(inputQuery["WHERE"][key], globalID, dict))) {
                        return false;
                    }
                } else if (key in ["IS", "NOT"]) {
                    flagEquality = true;
                    if (!(this.checkIsNot(inputQuery["WHERE"][key], globalID, dict))) {
                        return false;
                    }
                } else {
                    if (flagEquality) {return false; }
                }
            }
        }
        if (!inputQuery.hasOwnProperty("OPTIONS")) {
            return false;
        }
        let optionKeys: string[] = [];
        for (let key in inputQuery["OPTIONS"]) {
            if (!(key in ["COLUMNS", "ORDER"])) {return false; }
        }
        if ((inputQuery["OPTIONS"].hasOwnProperty["ORDER"])) {
            this.checkOrder(inputQuery["OPTIONS"]["ORDER"], optionKeys, globalID, dict);
            if (optionKeys.length === 0) {return false; }
        }
        if (!(this.checkColumns(inputQuery["OPTIONS"]["COLUMNS"], optionKeys, globalID, dict))) {
            return false;
        }
        return true;
    }
}
