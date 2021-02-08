export default class ValidateDataset {
    private globalID: string = "";
    private allKeys: string[] = ["fail", "pass", "avg", "year", "audit", "course",
                                "uuid", "instructor", "title", "id", "dept"];

    public checkWhere(query: any, dict: any): boolean {
        let keyNumbers: string[] = ["fail", "pass", "avg", "year", "audit"];
        let keyStrings: string[] = ["course", "uuid", "instructor", "title", "id", "dept"];
        for (let key in query) {
            let cleanKey = key.split("_");
            if (this.globalID === "") {
                this.globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== this.globalID) {
                    return false;
                }
            }
            if (cleanKey.length !== 2) {
                return false;
            }
            if (!(cleanKey[1] in this.allKeys)) {
                return false;
            }
            if (cleanKey[1] in keyNumbers && typeof query[key] !== "number") {
                return false;
            }
            if (cleanKey[1] in keyStrings && typeof query[key] !== "string") {
                return false;
            }
        }
        return true;
    }

    public checkAndOr(query: any, dict: any): boolean {
        if (!(Array.isArray(query))) { return false; }
        for (let index in query) {
            if (index === "AND") {
                return this.checkAndOr(query[index], dict);
            } else if (index === "OR") {
                return this.checkAndOr(query[index], dict);
            } else if (index in ["GT", "EQ", "LT", "IS"]) {
                if (!(this.checkWhere(query[index], dict))) {
                    return false;
                }
            } else if (index === "NOT") {
                if (!(this.checkNot(query[index], dict))) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    public checkOrder(query: any, orderKeys: string, dict: any): string {
        if (typeof query !== "string") {return orderKeys; }
        let cleanKey = query.split("_");
        if (this.globalID === "") {
            this.globalID = cleanKey[0];
        } else {
            if (cleanKey[0] !== this.globalID) {
                return orderKeys;
            }
        }
        if (cleanKey.length !== 2 || !(cleanKey[1] in this.allKeys)) {
            return orderKeys;
        } else {
            orderKeys = query;
            return orderKeys;
        }
    }

    public checkColumns(query: any, orderKeys: string, dict: any): boolean {
        for (let key in query) {
            let cleanKey = key.split("_");
            if (this.globalID === "") {
                this.globalID = cleanKey[0];
            } else {
                if (cleanKey[0] !== this.globalID) {
                    return false;
                }
            }
            if (cleanKey.length !== 2) {
                return false;
            }
            if (!(cleanKey[1] in this.allKeys)) {
                return false;
            } else {
                if (orderKeys.length !== 0 && !(cleanKey[1] === orderKeys)) {
                        return false;
                }
            }
        }
        return true;
    }

    public checkNot(query: any, dict: any): boolean {
        let and: boolean = query.hasOwnProperty("AND");
        let or: boolean = query.hasOwnProperty("OR");
        if (and && or) {return false; }
        if (and) {
            if (!this.checkAndOr(query["AND"], dict)) {return false; }
        } else if (or) {
            if (!this.checkAndOr(query["OR"], dict)) { return false; }
        } else {
            let moreThanOne: boolean = false;
            for (let key in query) {
                if (moreThanOne) {return false; }
                moreThanOne = true;
                if (key in ["GT", "EQ", "LT", "IS"]) {
                    if (!(this.checkWhere(query[key], dict))) {
                        return false;
                    }
                } else if (key === "NOT") {
                    if (!(this.checkNot(query[key], dict))) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    public checkQuery(query: any, dict: any): boolean {
        if (typeof query === "undefined" || typeof query === "number" ||
            query == null || query.length <= 1) {return false; }
        let inputQuery = query;
        if (!inputQuery.hasOwnProperty("WHERE")) {return false; }
        let not: boolean = inputQuery["WHERE"].hasOwnProperty("NOT");
        if (not) {
            if (!(this.checkNot(inputQuery["WHERE"]["NOT"], dict))) {
                return false;
            }
        } else {
            let and: boolean = inputQuery["WHERE"].hasOwnProperty("AND");
            let or: boolean = inputQuery["WHERE"].hasOwnProperty("OR");
            if (and && or) {return false; }
            if (and) {
                if (!this.checkAndOr(inputQuery["WHERE"]["AND"], dict)) {return false; }
            } else if (or) {
                if (!this.checkAndOr(inputQuery["WHERE"]["OR"], dict)) { return false; }
            } else {
                let moreThanOne: boolean = false;
                for (let key in inputQuery["WHERE"]) {
                    if (moreThanOne) {return false; }
                    moreThanOne = true;
                    if (key in ["GT", "EQ", "LT", "IS"]) {
                        if (!(this.checkWhere(inputQuery["WHERE"][key], dict))) {
                            return false;
                        }
                    } else if (key === "NOT") {
                        if (!(this.checkNot(inputQuery["WHERE"][key], dict))) {
                            return false;
                        }
                    } else {return false; }
                }
            }
        }

        // options
        if (!inputQuery.hasOwnProperty("OPTIONS")) {return false; }
        for (let key in inputQuery["OPTIONS"]) {
            if (!(key in ["COLUMNS", "ORDER"])) {return false; }
        }
        let orderKeys: string = "";
        if ((inputQuery["OPTIONS"].hasOwnProperty["ORDER"])) {
            orderKeys = this.checkOrder(inputQuery["OPTIONS"]["ORDER"], orderKeys, dict);
            if (orderKeys.length === 0) {return false; }
        }
        if (!inputQuery["OPTIONS"].hasOwnProperty("COLUMNS")) {return false; }
        if (!(Array.isArray(inputQuery["OPTIONS"]["COLUMNS"]))) { return false; }
        if (!(this.checkColumns(inputQuery["OPTIONS"]["COLUMNS"], orderKeys, dict))) {return false; }
        return true;
    }
}
