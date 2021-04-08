/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = () => {
    let query = {};
    // TODO: implement!
    const activePanel = document.getElementsByClassName("tab-panel active");
    let isCourses = "courses";
    let NotOrAnd = "all";
    let numKeys = [];
    try {
        for (let element of activePanel) {
            isCourses = element.id === "tab-courses" ? "courses" : "rooms";
            if (isCourses === "courses") {
                numKeys = ["fail", "pass", "avg", "year", "audit"];
            } else {
                numKeys = ["lat", "lon", "seats"];
            }
            for (let conditions of element.getElementsByClassName("form-group conditions")) {
                for (let findSelected of conditions.getElementsByClassName("control-group condition-type")) {
                    NotOrAnd = findSelected.querySelector('input[name="conditionType"]:checked').value;
                }
                const theConditions = conditions.getElementsByClassName("control-group condition");
                if (theConditions.length <= 0) {
                    query["WHERE"] = {};
                } else {
                    let queryArray = [];
                    for (let theCondition of theConditions) {
                        let soloQuery = {};
                        const not = theCondition.getElementsByClassName("control not")[0];
                        const checkNot = not.querySelector('input:checked');
                        const selectors = theCondition.getElementsByClassName("control fields")[0];
                        const selectedValue = selectors.querySelector("select option:checked").value;
                        const theOperators = theCondition.getElementsByClassName("control operators")[0];
                        const selectedOperator = theOperators.querySelector("select option:checked").value;
                        const theTerm = theCondition.getElementsByClassName("control term")[0];
                        let writtenTerm = theTerm.getElementsByTagName('input')[0].value.trim();
                        if (/^\d+$/.test(writtenTerm) && numKeys.includes(selectedValue)) {
                            writtenTerm = Number(writtenTerm);
                        }
                        let OperatorObject = {}
                        let simpleObject = {};
                        simpleObject[`${isCourses}_${selectedValue}`] = writtenTerm;
                        OperatorObject[selectedOperator] = simpleObject;
                        if (checkNot) {
                            soloQuery["NOT"] = OperatorObject;
                        } else {
                            soloQuery = OperatorObject
                        }
                        queryArray.push(soloQuery);
                    }
                    if (queryArray.length === 1) {
                        if (NotOrAnd === "none") {
                            const temp = {};
                            temp["NOT"] = queryArray[0];
                            query["WHERE"] = temp;
                        } else {
                            query["WHERE"] = queryArray[0];
                        }
                    } else {
                        const multi = {};
                        if (NotOrAnd === "all") {
                            multi["AND"] =  queryArray;
                        } else if (NotOrAnd === "any") {
                            multi["OR"] =  queryArray;
                        } else {
                            const temp = {};
                            temp["OR"] = queryArray;
                            multi["NOT"] = temp;
                        }
                        query["WHERE"] = multi;
                    }
                }
            }
            const optionsObject = {};
            for (let columns of element.getElementsByClassName("form-group columns")) {
                const selectedColumns = [];
                for (let c of columns.getElementsByClassName("control field")) {
                    const selected = c.querySelector('input:checked');
                    if (selected) {
                        selectedColumns.push(`${isCourses}_${selected.value}`);
                    }
                }
                optionsObject["COLUMNS"] = selectedColumns;
            }
            for (let orderDOM of element.getElementsByClassName("form-group order")) {
                const orders = [];
                const orderObject = {};
                for (let orderOuter of orderDOM.getElementsByClassName("control order fields")) {
                    for (let order of orderOuter.getElementsByTagName("option"))  {
                        if (order.selected) {
                            orders.push(`${isCourses}_${order.value}`);
                        }
                    }
                }
                for (let orderOuter of orderDOM.getElementsByClassName("control descending")) {
                    const hasOrder = orderOuter.querySelector('input:checked');
                    if (hasOrder) {
                        orderObject["dir"] = "DOWN";
                    } else {
                        orderObject["dir"] = "UP";
                    }
                }
                if (orders.length !== 0) {
                    orderObject["keys"] = orders;
                    optionsObject["ORDER"] = orderObject;
                }
            }
            const transformationObject = {};
            const groupsList = [];
            const transformations = [];
            for (let columns of element.getElementsByClassName("form-group groups")) {
                for (let c of columns.getElementsByClassName("control field")) {
                    const selected = c.querySelector('input:checked');
                    if (selected) {
                        groupsList.push(`${isCourses}_${selected.value}`);
                    }
                }
            }
            transformationObject["GROUP"] = groupsList;
            for (let columns of element.getElementsByClassName("form-group transformations")) {
                for (let c of columns.getElementsByClassName("control-group transformation")) {
                    const theOperators = c.getElementsByClassName("control operators")[0];
                    const selectedOperator = theOperators.querySelector("select option:checked").value;
                    const theTerm = c.getElementsByClassName("control term")[0];
                    let writtenTerm = theTerm.getElementsByTagName('input')[0].value;
                    const selectors = c.getElementsByClassName("control fields")[0];
                    const selectedValue = selectors.querySelector("select option:checked").value;
                    const outerTransform = {};
                    const innerTransform = {};
                    innerTransform[selectedOperator] = `${isCourses}_${selectedValue}`;
                    outerTransform[writtenTerm] = innerTransform;
                    transformations.push(outerTransform);
                    const queryColumns = optionsObject["COLUMNS"];
                    queryColumns.push(writtenTerm);
                    optionsObject["COLUMNS"] = queryColumns;
                }
            }
            transformationObject["APPLY"] = transformations;
            if (transformationObject["APPLY"].length > 0 || transformationObject["GROUP"].length > 0) {
                query["TRANSFORMATIONS"] = transformationObject;
            }
            query["OPTIONS"] = optionsObject;

        }
        return query;
    } catch (e) {
        return false;
    }
};
