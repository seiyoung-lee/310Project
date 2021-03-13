import * as JSZip from "jszip";

export interface IDataSetCreator {
    addDataset(
        result: JSZip
    ): Promise<{changed: boolean, values: any[]}>;
}
