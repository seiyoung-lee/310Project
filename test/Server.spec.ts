import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs-extra";
import Log from "../src/Util";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    const SERVER_URL = "http://localhost:4321";
    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start();
    });

    after(function () {
        // TODO: stop server here once!
        const cacheDir = __dirname + "/../data";
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
        } catch (err) {
            Log.error(err);
        }
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // Sample on how to format PUT requests
    it("PUT test for courses dataset", function () {
        try {
            const ENDPOINT_URL = "/dataset/courses007/courses";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    // Log.trace(res);
                    // return expect.fail();
                    return expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    return expect.fail();
                    // return expect.fail();
                    // return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
                    return expect.fail();
        }
    });

    // Sample on how to format PUT requests
    it("PUT fail test for courses dataset", function () {
        try {
            const ENDPOINT_URL = "/dataset/courses/courses";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    // Log.trace(res);
                    // return expect.fail();
                    return expect(res.status).to.be.equal(200);
                })
            .then ( () => {
                return chai.request(SERVER_URL)
                    .put(ENDPOINT_URL)
                    .send(ZIP_FILE_DATA)
                    .set("Content-Type", "application/x-zip-compressed")
                    .then(function (res: Response) {
                        // some logging here please!
                        return expect.fail();
                        // expect(res.status).to.be.equal(200);
                    });
            })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            return expect.fail();
        }
    });

    it("PUT test for rooms dataset", function () {
        try {
            const ENDPOINT_URL = "/dataset/rooms/rooms";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    return expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            // and some more logging here!
            return expect.fail();
        }
    });

    it("PUT then PUT fail test for rooms dataset", function () {
        try {
            const ENDPOINT_URL = "/dataset/rooms3/rooms";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    return expect(res.status).to.be.equal(200);
                })
                .then(() => {
                    return chai.request(SERVER_URL)
                    .put(ENDPOINT_URL)
                    .send(ZIP_FILE_DATA)
                    .set("Content-Type", "application/x-zip-compressed")
                    .then(function (res: Response) {
                        // some logging here please!
                        Log.trace("PUT passed Shouldn't get here");
                        return expect.fail();
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
            return expect.fail();
        }
    });

    it("POST test for rooms dataset", function () {
        try {
            const ENDPOINT_URL = "/query";
            const query = JSON.stringify(
                {
                    WHERE: {
                        GT: {
                            rooms3_seats: 300
                        }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "rooms3_seats"
                        ],
                        ORDER: "rooms3_seats"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    // some logging here please!
                    return expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("POST fail test for rooms dataset", function () {
        try {
            const ENDPOINT_URL = "/query";
            const query = JSON.stringify(
                {
                    WHERE: {
                        GT: {
                            rooms_seats: 300
                        }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "rooms_seats"
                        ],
                        ORDER: 600
                    }
                }
            );
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    // some logging here please!
                    // return expect(res.status).to.be.equal(200);
                    Log.trace("Shouldn't get here");
                    return expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("POST test for courses dataset", function () {
        try {
            const ENDPOINT_URL = "/query";
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses_avg: 50
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses_avg"
                        ],
                        ORDER: "courses_avg"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    // some logging here please!
                    return expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("POST fail test for courses dataset", function () {
        try {
            const ENDPOINT_URL = "/query";
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses_avg: "50"
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses_avg"
                        ],
                        ORDER: "courses_avg"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("Shouldn't get here");
                    return expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("POST then POST again test for courses dataset", function () {
        try {
            const ENDPOINT_URL = "/query";
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses_avg: 50
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses_avg"
                        ],
                        ORDER: "courses_avg"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .post(ENDPOINT_URL)
                .send(query)
                .set("Content-Type", "application/json")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(1);
                    return expect(res.status).to.be.equal(200);
                })
                .then (() => {
                    return chai.request(SERVER_URL)
                    .post(ENDPOINT_URL)
                    .send(query)
                    .set("Content-Type", "application/json")
                    .then(function (res2: Response) {
                        // some logging here please!
                        Log.trace(2);
                        return expect(res2.status).to.be.equal(200);
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("x2 PUT then POST test for courses dataset", function () {
        try {
            const ENDPOINT_URL_PUT = "/dataset/courses123/courses";
            const ENDPOINT_URL_POST = "/query";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses123_avg: 50
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses123_avg"
                        ],
                        ORDER: "courses123_avg"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL_PUT)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    return expect(res.status).to.be.equal(200);
                })
                .then((result: any) => {
                    return chai.request(SERVER_URL)
                    .post(ENDPOINT_URL_POST)
                    .send(query)
                    .set("Content-Type", "application/json")
                    .then(function (result2: Response) {
                        // some logging here please!
                        return expect(result2.status).to.be.equal(200);
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    Log.trace("PUT POST failed, Shouldn't get here");
                    // Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            return expect.fail();
        }
    });


    it("x3 PUT then POST test for courses dataset", function () {
        try {
            const ENDPOINT_URL_PUT = "/dataset/courses07/courses";
            const ENDPOINT_URL_POST = "/query";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses07_avg: 50
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses07_avg"
                        ],
                        ORDER: "courses07_avg"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL_PUT)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace("reached 1");
                    return expect(res.status).to.be.equal(200);
                })
                .then((result: any) => {
                    return chai.request(SERVER_URL)
                    .post(ENDPOINT_URL_POST)
                    .send(query)
                    .set("Content-Type", "application/json")
                    .then(function (result2: Response) {
                        Log.trace("reached 2");
                        // some logging here please!
                        return expect(result2.status).to.be.equal(200);
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    Log.trace("PUT POST failed, Shouldn't get here");
                    // Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("x1 PUT then POST test for courses dataset", function () {
        try {
            const ENDPOINT_URL_PUT = "/dataset/courses17/courses";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {courses17_avg: 50}
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses17_avg"
                        ],
                        ORDER: "courses17_avg"
                    }
                }
            );
            return chai.request(SERVER_URL).put(ENDPOINT_URL_PUT).send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed").then(function (res: Response) {
                    return expect(res.status).to.be.equal(200);
                })
                .then( () => {
                    return chai.request(SERVER_URL).get("/datasets").then( function (resp: any) {
                        return expect(resp.status).to.be.equal(200);
                    });
                })
                .then( () => {
                    return chai.request(SERVER_URL).post("/query").send(query)
                    .set("Content-Type", "application/json")
                    .then(function (res: Response) {
                        return expect(res.status).to.be.equal(200);
                    });
                })
                .catch(function (err) {
                    Log.trace(err);
                    return expect.fail();
                });

        } catch (err) {
            return expect.fail();
        }
    });

    it("PUT then POST test for rooms dataset", function () {
        try {
            const ENDPOINT_URL_PUT = "/dataset/rooms123/rooms";
            const ENDPOINT_URL_POST = "/query";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/rooms.zip");
            const query = JSON.stringify(
                {
                    WHERE: {
                        GT: {
                            rooms123_seats: 300
                        }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "rooms123_seats"
                        ],
                        ORDER: "rooms123_seats"
                    }
                }
            );
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL_PUT)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    return expect(res.status).to.be.equal(200);
                })
                .then((result: any) => {
                    return chai.request(SERVER_URL)
                    .post(ENDPOINT_URL_POST)
                    .send(query)
                    .set("Content-Type", "application/json")
                    .then(function (result2: Response) {
                        // some logging here please!
                        return expect(result2.status).to.be.equal(200);
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    Log.trace("PUT POST failed, Shouldn't get here");
                    // Log.trace(err);
                    return expect.fail();
                });
        } catch (err) {
            return expect.fail();
        }
    });

    it("PUT fail then POST fail test for courses dataset", function () {
        try {
            const ENDPOINT_URL_PUT = "/dataset/courses4/courses";
            const ENDPOINT_URL_POST = "/query";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/TwoInvalid.zip");
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses_avg: 50
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses_avg"
                        ],
                        ORDER: "courses_avg"
                    }
                }
            );

            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL_PUT)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(1);
                    Log.trace("PUT passed Shouldn't get here");
                })
                .then((result: any) => {
                    return chai.request(SERVER_URL)
                    .post(ENDPOINT_URL_POST)
                    .send(query)
                    .set("Content-Type", "application/json")
                    .then(function (result2: Response) {
                        Log.trace(2);
                        // some logging here please!
                        return expect.fail();
                        // return expect(result2.status).to.be.equal(200);
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    Log.trace(3);
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(4);
            return expect.fail();
        }
    });

    it("PUT then POST fail test for courses dataset", function () {
        try {
            const ENDPOINT_URL_PUT = "/dataset/courses5/courses";
            const ENDPOINT_URL_POST = "/query";
            const ZIP_FILE_DATA = fs.readFileSync("./test/data/courses.zip");
            const query = JSON.stringify(
                {
                    WHERE: {
                            LT: {
                                courses_avg: "50"
                            }
                    },
                    OPTIONS: {
                        COLUMNS: [
                            "courses_avg"
                        ],
                        ORDER: "courses_avg"
                    }
                }
            );

            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL_PUT)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    Log.trace(5);
                    return expect(res.status).to.be.equal(200);
                })
                .then((result: any) => {
                    return chai.request(SERVER_URL)
                    .post(ENDPOINT_URL_POST)
                    .send(query)
                    .set("Content-Type", "application/json")
                    .then(function (result2: Response) {
                        // some logging here please!
                        Log.trace(6);
                        Log.trace("PUT POST passed Shouldn't get here");
                        return expect.fail();
                    });
                })
                .catch(function (err) {
                    // some logging here please!
                    // Log.trace(err);
                    Log.trace(7);
                    return expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(8);
            return expect.fail();
        }
    });
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
