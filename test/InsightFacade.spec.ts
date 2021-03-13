import { expect } from "chai";
import * as chai from "chai";
import * as fs from "fs-extra";
import * as chaiAsPromised from "chai-as-promised";
import {InsightDatasetKind, InsightError, NotFoundError, InsightDataset} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This extends chai with assertions that natively support Promises
chai.use(chaiAsPromised);

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any; // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string; // This is injected when reading the file
}

describe("InsightFacade Add/Remove/List Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        noFile: "./test/data/a_a.zip",
        _: "./test/data/_.zip",
        empty: "./test/data/empty.zip",
        AllAs: "./test/data/allAs.zip",
        TwoInvalid1Valid: "./test/data/2Invalid1Valid.zip",
        TwoInvalid: "./test/data/TwoInvalid.zip",
        validButInvalid: "./test/data/validButInvalid.zip",
        room: "./test/data/room.zip",
        rooms: "./test/data/rooms.zip",
        invalid: "./test/data/invalid.zip",
        invalidText: "./test/data/invalidText",
        notCourses: "./test/data/notCourses.zip",
        invalidJson: "./test/data/invalidJson.zip",
        missingInfo: "./test/data/missingInfo.zip",
        validInsideDirectory: "./test/data/validInsideDirectory.zip",
        avgIsString: "./test/data/avgIsString.zip"
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir);
        }
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs
                .readFileSync(datasetsToLoad[id])
                .toString("base64");
        }
        try {
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs after each test, which should make each test independent from the previous one
        Log.test(`AfterTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });
    // it("Failed attempt to remove a dataset", () => {
    //     const id: string = "courses";
    //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     return expect(futureResult).to.eventually.be.rejectedWith(
    //         NotFoundError,
    //     );
    // });
    // it("Failed attempt to remove a dataset 1", () => {
    //     const id: string = "";
    //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     return expect(futureResult).to.eventually.be.rejectedWith(
    //         InsightError,
    //     );
    // });
    // it("listDatasets test size 1", () => {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             const futureNextResult: Promise<
    //                 InsightDataset[]
    //             > = insightFacade.listDatasets();
    //             return expect(futureNextResult).to.eventually.have.length(1);
    //         });
    // });
    // it("listDatasets test that the list should be the same", () => {
    //     const id: string = "courses";
    //     return insightFacade
    //         .addDataset(id, datasets[id], InsightDatasetKind.Courses)
    //         .then((list) => {
    //             const newFacade: InsightFacade = new InsightFacade();
    //             return insightFacade.listDatasets().then((futureNextResult) => {
    //                 return expect(newFacade.listDatasets()).to.eventually.deep.equal(
    //                     futureNextResult,
    //                 );
    //             });
    //         });
    // });
    // it("listDatasets test size 0", () => {
    //     const futureResult: Promise<
    //         InsightDataset[]
    //     > = insightFacade.listDatasets();
    //     return expect(futureResult).to.eventually.deep.equal([]);
    // });
    // it("Should not add an invalid dataset 1", function () {
    //     const id: string = " ";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset super space", function () {
    //     const id: string = "          ";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an empty dataset 1", function () {
    //     const id: string = "empty";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 3", function () {
    //     const id: string = "_";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 4", function () {
    //     const id: string = "a_a";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 5", function () {
    //     const id: string = "validButInvalid";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 6", function () {
    //     const id: string = "validButInvalid";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         "",
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 7", function () {
    //     const id: string = "invalid";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset and fail removing it too", function () {
    //     const id: string = "room";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Rooms,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.be.rejectedWith(InsightError)
    //         .then(() => {
    //             const futureRemove: Promise<
    //                 string
    //             > = insightFacade.removeDataset(id);
    //             return expect(futureRemove).to.eventually.be.rejectedWith(
    //                 NotFoundError,
    //             );
    //         });
    // });
    // it("Should not add an invalid dataset 8", function () {
    //     const id: string = "validButInvalid";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         "123",
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 9", function () {
    //     const id: string = "invalidText";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 10", function () {
    //     const id: string = "notCourses";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 11", function () {
    //     const id: string = "invalidJson";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 12", function () {
    //     const id: string = "missingInfo";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 13", function () {
    //     const id: string = "";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets["courses"],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 14", function () {
    //     const id: string = "courses";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets["nothing"],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset 15", function () {
    //     const id: string = "avgIsString";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not add an invalid dataset due to datasetType", function () {
    //     const id: string = "courses";
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Rooms,
    //     );
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not remove an invalid dataset 1", function () {
    //     const id: string = " ";
    //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not remove an invalid dataset 3", function () {
    //     const id: string = "_";
    //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // it("Should not remove an invalid dataset 4", function () {
    //     const id: string = "a_a";
    //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    // });
    // // This is a unit test. You should create more like this!
    // it("Should add a valid dataset once", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     let futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             futureResult = insightFacade.addDataset(
    //                 id,
    //                 datasets[id],
    //                 InsightDatasetKind.Courses,
    //             );
    //             return expect(futureResult).to.eventually.be.rejectedWith(
    //                 InsightError,
    //             );
    //         });
    // });
    // it("Should not remove any dataset give error", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             const id2: string = "AllAs";
    //             const futureResult2: Promise<
    //                 string
    //             > = insightFacade.removeDataset(id2);
    //             return expect(futureResult2).to.eventually.be.rejectedWith(
    //                 NotFoundError,
    //             );
    //         });
    // });
    // it("Should only add the valid dataset", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     let futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             const id2: string = "TwoInvalid";
    //             futureResult = insightFacade.addDataset(
    //                 id2,
    //                 datasets[id2],
    //                 InsightDatasetKind.Courses,
    //             );
    //             return expect(futureResult).to.eventually.be.rejectedWith(
    //                 InsightError,
    //             );
    //         });
    // });
    // it("Should add and remove a valid dataset", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(futureResult)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             const nextFutureResult: Promise<
    //                 string
    //             > = insightFacade.removeDataset(id);
    //             return expect(nextFutureResult)
    //                 .to.eventually.deep.equal(id)
    //                 .then(() => {
    //                     return expect(
    //                         insightFacade.listDatasets(),
    //                     ).to.eventually.deep.equal([]);
    //                 });
    //         });
    // });
    // it("Tries to remove: fails, then adds and finds it and deletes it then again", function () {
    //     const id: string = "courses";
    //     const expectation: string[] = [id];
    //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     return expect(futureResult)
    //         .to.eventually.be.rejectedWith(NotFoundError)
    //         .then(() => {
    //             const next: Promise<string[]> = insightFacade.addDataset(
    //                 id,
    //                 datasets[id],
    //                 InsightDatasetKind.Courses,
    //             );
    //             return expect(next)
    //                 .to.eventually.deep.equal(expectation)
    //                 .then(() => {
    //                     const again: Promise<
    //                         string
    //                     > = insightFacade.removeDataset(id);
    //                     return expect(again)
    //                         .to.eventually.deep.equal(id)
    //                         .then(() => {
    //                             return expect(
    //                                 insightFacade.removeDataset(id),
    //                             ).to.eventually.be.rejectedWith(NotFoundError);
    //                         });
    //                 });
    //         });
    // });
    // it("Add two valid datasets", function () {
    //     const id: string = "courses";
    //     const id2: string = "AllAs";
    //     const expected: string[] = [id];
    //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(dummy)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             const expected1: string[] = [id, id2];
    //             const Result: Promise<string[]> = insightFacade.addDataset(
    //                 id2,
    //                 datasets[id2],
    //                 InsightDatasetKind.Courses,
    //             );
    //             return expect(Result).to.eventually.deep.equal(expected1);
    //         });
    // });
    // it("Add 2 valid dataset that are the same", function () {
    //     const id: string = "courses";
    //     const id2: string = "AllAs";
    //     const expected: string[] = [id];
    //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     ).then(() => {
    //         const result: Promise<string[]> = insightFacade.addDataset(
    //             id,
    //             datasets[id],
    //             InsightDatasetKind.Courses,
    //         );
    //         return expect(result).to.eventually.be.rejectedWith(InsightError);
    //     });
    // });
    // it("Add 1 that fails and then succeeds", function () {
    //     const id: string = " ";
    //     const expected: string[] = [id];
    //     const dummy = insightFacade.addDataset(
    //         id,
    //         datasets["courses"],
    //         InsightDatasetKind.Courses,
    //     );
    //     expect(dummy).to.eventually.be.rejectedWith(InsightError).then(() => {
    //         const result: Promise<string[]> = insightFacade.addDataset(
    //             "courses",
    //             datasets["courses"],
    //             InsightDatasetKind.Courses,
    //         );
    //         return expect(result).to.eventually.deep.equal(["courses"]);
    //     });
    // });
    // it("Add valid dataset with subdirectory", function () {
    //     const id: string = "validInsideDirectory";
    //     const expected: string[] = [id];
    //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(dummy).to.eventually.deep.equal(expected);
    // });
    // it("Add valid dataset", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(dummy).to.eventually.deep.equal(expected);
    // });it("Failed attempt to remove a dataset", () => {
    //     //     const id: string = "courses";
    //     //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(
    //     //         NotFoundError,
    //     //     );
    //     // });
    //     // it("Failed attempt to remove a dataset 1", () => {
    //     //     const id: string = "";
    //     //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(
    //     //         InsightError,
    //     //     );
    //     // });
    //     // it("listDatasets test size 1", () => {
    //     //     const id: string = "courses";
    //     //     const expected: string[] = [id];
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             const futureNextResult: Promise<
    //     //                 InsightDataset[]
    //     //             > = insightFacade.listDatasets();
    //     //             return expect(futureNextResult).to.eventually.have.length(1);
    //     //         });
    //     // });
    //     // it("listDatasets test that the list should be the same", () => {
    //     //     const id: string = "courses";
    //     //     return insightFacade
    //     //         .addDataset(id, datasets[id], InsightDatasetKind.Courses)
    //     //         .then((list) => {
    //     //             const newFacade: InsightFacade = new InsightFacade();
    //     //             return insightFacade.listDatasets().then((futureNextResult) => {
    //     //                 return expect(newFacade.listDatasets()).to.eventually.deep.equal(
    //     //                     futureNextResult,
    //     //                 );
    //     //             });
    //     //         });
    //     // });
    //     // it("listDatasets test size 0", () => {
    //     //     const futureResult: Promise<
    //     //         InsightDataset[]
    //     //     > = insightFacade.listDatasets();
    //     //     return expect(futureResult).to.eventually.deep.equal([]);
    //     // });
    //     // it("Should not add an invalid dataset 1", function () {
    //     //     const id: string = " ";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset super space", function () {
    //     //     const id: string = "          ";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an empty dataset 1", function () {
    //     //     const id: string = "empty";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 3", function () {
    //     //     const id: string = "_";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 4", function () {
    //     //     const id: string = "a_a";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 5", function () {
    //     //     const id: string = "validButInvalid";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 6", function () {
    //     //     const id: string = "validButInvalid";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         "",
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 7", function () {
    //     //     const id: string = "invalid";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset and fail removing it too", function () {
    //     //     const id: string = "room";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Rooms,
    //     //     );
    //     //     return expect(futureResult)
    //     //         .to.eventually.be.rejectedWith(InsightError)
    //     //         .then(() => {
    //     //             const futureRemove: Promise<
    //     //                 string
    //     //             > = insightFacade.removeDataset(id);
    //     //             return expect(futureRemove).to.eventually.be.rejectedWith(
    //     //                 NotFoundError,
    //     //             );
    //     //         });
    //     // });
    //     // it("Should not add an invalid dataset 8", function () {
    //     //     const id: string = "validButInvalid";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         "123",
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 9", function () {
    //     //     const id: string = "invalidText";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 10", function () {
    //     //     const id: string = "notCourses";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 11", function () {
    //     //     const id: string = "invalidJson";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 12", function () {
    //     //     const id: string = "missingInfo";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 13", function () {
    //     //     const id: string = "";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets["courses"],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 14", function () {
    //     //     const id: string = "courses";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets["nothing"],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset 15", function () {
    //     //     const id: string = "avgIsString";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not add an invalid dataset due to datasetType", function () {
    //     //     const id: string = "courses";
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Rooms,
    //     //     );
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not remove an invalid dataset 1", function () {
    //     //     const id: string = " ";
    //     //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not remove an invalid dataset 3", function () {
    //     //     const id: string = "_";
    //     //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // it("Should not remove an invalid dataset 4", function () {
    //     //     const id: string = "a_a";
    //     //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     //     return expect(futureResult).to.eventually.be.rejectedWith(InsightError);
    //     // });
    //     // // This is a unit test. You should create more like this!
    //     // it("Should add a valid dataset once", function () {
    //     //     const id: string = "courses";
    //     //     const expected: string[] = [id];
    //     //     let futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             futureResult = insightFacade.addDataset(
    //     //                 id,
    //     //                 datasets[id],
    //     //                 InsightDatasetKind.Courses,
    //     //             );
    //     //             return expect(futureResult).to.eventually.be.rejectedWith(
    //     //                 InsightError,
    //     //             );
    //     //         });
    //     // });
    //     // it("Should not remove any dataset give error", function () {
    //     //     const id: string = "courses";
    //     //     const expected: string[] = [id];
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             const id2: string = "AllAs";
    //     //             const futureResult2: Promise<
    //     //                 string
    //     //             > = insightFacade.removeDataset(id2);
    //     //             return expect(futureResult2).to.eventually.be.rejectedWith(
    //     //                 NotFoundError,
    //     //             );
    //     //         });
    //     // });
    //     // it("Should only add the valid dataset", function () {
    //     //     const id: string = "courses";
    //     //     const expected: string[] = [id];
    //     //     let futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             const id2: string = "TwoInvalid";
    //     //             futureResult = insightFacade.addDataset(
    //     //                 id2,
    //     //                 datasets[id2],
    //     //                 InsightDatasetKind.Courses,
    //     //             );
    //     //             return expect(futureResult).to.eventually.be.rejectedWith(
    //     //                 InsightError,
    //     //             );
    //     //         });
    //     // });
    //     // it("Should add and remove a valid dataset", function () {
    //     //     const id: string = "courses";
    //     //     const expected: string[] = [id];
    //     //     const futureResult: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(futureResult)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             const nextFutureResult: Promise<
    //     //                 string
    //     //             > = insightFacade.removeDataset(id);
    //     //             return expect(nextFutureResult)
    //     //                 .to.eventually.deep.equal(id)
    //     //                 .then(() => {
    //     //                     return expect(
    //     //                         insightFacade.listDatasets(),
    //     //                     ).to.eventually.deep.equal([]);
    //     //                 });
    //     //         });
    //     // });
    //     // it("Tries to remove: fails, then adds and finds it and deletes it then again", function () {
    //     //     const id: string = "courses";
    //     //     const expectation: string[] = [id];
    //     //     const futureResult: Promise<string> = insightFacade.removeDataset(id);
    //     //     return expect(futureResult)
    //     //         .to.eventually.be.rejectedWith(NotFoundError)
    //     //         .then(() => {
    //     //             const next: Promise<string[]> = insightFacade.addDataset(
    //     //                 id,
    //     //                 datasets[id],
    //     //                 InsightDatasetKind.Courses,
    //     //             );
    //     //             return expect(next)
    //     //                 .to.eventually.deep.equal(expectation)
    //     //                 .then(() => {
    //     //                     const again: Promise<
    //     //                         string
    //     //                     > = insightFacade.removeDataset(id);
    //     //                     return expect(again)
    //     //                         .to.eventually.deep.equal(id)
    //     //                         .then(() => {
    //     //                             return expect(
    //     //                                 insightFacade.removeDataset(id),
    //     //                             ).to.eventually.be.rejectedWith(NotFoundError);
    //     //                         });
    //     //                 });
    //     //         });
    //     // });
    //     // it("Add two valid datasets", function () {
    //     //     const id: string = "courses";
    //     //     const id2: string = "AllAs";
    //     //     const expected: string[] = [id];
    //     //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(dummy)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             const expected1: string[] = [id, id2];
    //     //             const Result: Promise<string[]> = insightFacade.addDataset(
    //     //                 id2,
    //     //                 datasets[id2],
    //     //                 InsightDatasetKind.Courses,
    //     //             );
    //     //             return expect(Result).to.eventually.deep.equal(expected1);
    //     //         });
    //     // });
    //     // it("Add 2 valid dataset that are the same", function () {
    //     //     const id: string = "courses";
    //     //     const id2: string = "AllAs";
    //     //     const expected: string[] = [id];
    //     //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     ).then(() => {
    //     //         const result: Promise<string[]> = insightFacade.addDataset(
    //     //             id,
    //     //             datasets[id],
    //     //             InsightDatasetKind.Courses,
    //     //         );
    //     //         return expect(result).to.eventually.be.rejectedWith(InsightError);
    //     //     });
    //     // });
    //     // it("Add 1 that fails and then succeeds", function () {
    //     //     const id: string = " ";
    //     //     const expected: string[] = [id];
    //     //     const dummy = insightFacade.addDataset(
    //     //         id,
    //     //         datasets["courses"],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     expect(dummy).to.eventually.be.rejectedWith(InsightError).then(() => {
    //     //         const result: Promise<string[]> = insightFacade.addDataset(
    //     //             "courses",
    //     //             datasets["courses"],
    //     //             InsightDatasetKind.Courses,
    //     //         );
    //     //         return expect(result).to.eventually.deep.equal(["courses"]);
    //     //     });
    //     // });
    //     // it("Add valid dataset with subdirectory", function () {
    //     //     const id: string = "validInsideDirectory";
    //     //     const expected: string[] = [id];
    //     //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(dummy).to.eventually.deep.equal(expected);
    //     // });
    //     // it("Add valid dataset", function () {
    //     //     const id: string = "courses";
    //     //     const expected: string[] = [id];
    //     //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(dummy).to.eventually.deep.equal(expected);
    //     // });
    //     // it("Add two valid datasets that are almost invalid", function () {
    //     //     const id1: string = " courses";
    //     //     const id2: string = " AllAs";
    //     //     const id3: string = "courses";
    //     //     const id4: string = "AllAs";
    //     //     const expectation: string[] = [id1];
    //     //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //     //         id1,
    //     //         datasets[id3],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(dummy)
    //     //         .to.eventually.deep.equal(expectation)
    //     //         .then(() => {
    //     //             const expected1: string[] = [id1, id2];
    //     //             const Result: Promise<string[]> = insightFacade.addDataset(
    //     //                 id2,
    //     //                 datasets[id4],
    //     //                 InsightDatasetKind.Courses,
    //     //             );
    //     //             return expect(Result).to.eventually.deep.equal(expected1);
    //     //         });
    //     // });
    //     // it("Add two Datasets where one only has 1 valid file", function () {
    //     //     const id: string = "courses";
    //     //     const id2: string = "TwoInvalid1Valid";
    //     //     let expected: string[] = [id];
    //     //     let Result: Promise<string[]> = insightFacade.addDataset(
    //     //         id,
    //     //         datasets[id],
    //     //         InsightDatasetKind.Courses,
    //     //     );
    //     //     return expect(Result)
    //     //         .to.eventually.deep.equal(expected)
    //     //         .then(() => {
    //     //             expected = [id, id2];
    //     //             Result = insightFacade.addDataset(
    //     //                 id2,
    //     //                 datasets[id2],
    //     //                 InsightDatasetKind.Courses,
    //     //             );
    //     //             return expect(Result).to.eventually.deep.equal(expected);
    //     //         });
    //     // });
    // it("Add two valid datasets that are almost invalid", function () {
    //     const id1: string = " courses";
    //     const id2: string = " AllAs";
    //     const id3: string = "courses";
    //     const id4: string = "AllAs";
    //     const expectation: string[] = [id1];
    //     const dummy: Promise<string[]> = insightFacade.addDataset(
    //         id1,
    //         datasets[id3],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(dummy)
    //         .to.eventually.deep.equal(expectation)
    //         .then(() => {
    //             const expected1: string[] = [id1, id2];
    //             const Result: Promise<string[]> = insightFacade.addDataset(
    //                 id2,
    //                 datasets[id4],
    //                 InsightDatasetKind.Courses,
    //             );
    //             return expect(Result).to.eventually.deep.equal(expected1);
    //         });
    // });
    // it("Add two Datasets where one only has 1 valid file", function () {
    //     const id: string = "courses";
    //     const id2: string = "TwoInvalid1Valid";
    //     let expected: string[] = [id];
    //     let Result: Promise<string[]> = insightFacade.addDataset(
    //         id,
    //         datasets[id],
    //         InsightDatasetKind.Courses,
    //     );
    //     return expect(Result)
    //         .to.eventually.deep.equal(expected)
    //         .then(() => {
    //             expected = [id, id2];
    //             Result = insightFacade.addDataset(
    //                 id2,
    //                 datasets[id2],
    //                 InsightDatasetKind.Courses,
    //             );
    //             return expect(Result).to.eventually.deep.equal(expected);
    //         });
    // });
    it("Add valid room dataset", function () {
        const id: string = "rooms";
        const expected: string[] = [id];
        const dummy: Promise<string[]> = insightFacade.addDataset(
            id,
            datasets[id],
            InsightDatasetKind.Rooms,
        );
        return expect(dummy).to.eventually.deep.equal(expected);
    });
});

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: {
        [id: string]: { path: string; kind: InsightDatasetKind };
    } = {
        courses: {
            path: "./test/data/courses.zip",
            kind: InsightDatasetKind.Courses,
        },
        rooms: {
            path: "./test/data/rooms.zip",
            kind: InsightDatasetKind.Rooms,
        }
    };
    let insightFacade: InsightFacade;
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail(
                "",
                "",
                `Failed to read one or more test queries. ${err}`,
            );
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        insightFacade = new InsightFacade();
        for (const id of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[id];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(
                insightFacade.addDataset(id, data, ds.kind),
            );
        }
        return Promise.all(loadDatasetPromises);
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
        try {
            fs.removeSync(__dirname + "/../data");
            fs.mkdirSync(__dirname + "/../data");
        } catch (err) {
            Log.error(err);
        }
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function () {
                    const futureResult: Promise<
                        any[]
                    > = insightFacade.performQuery(test.query);
                    return TestUtil.verifyQueryResult(futureResult, test);
                });
            }
        });
    });
});
