/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        // TODO: implement!
        console.log(query);
        const url = "http://localhost:4321/query";
        let request = new XMLHttpRequest();
        request.open("POST", url);
        request.setRequestHeader('Content-Type', 'application/json');
        console.log("yo")
        let json = JSON.stringify(query);
        request.send(json);
        request.onload = function() {
            // Check if the request is compete and was successful
            // if(this.readyState === 4 && this.status === 200) {
            //     const resp = JSON.parse(this.responseText);
            //     console.log(resp);
            //     return resolve(resp);
            // } else if (this.readyState === 4 && this.status === 400) {
            //     return reject({error :"error"});
            // }
            resolve(JSON.parse(request.response));
        };
    });
};
