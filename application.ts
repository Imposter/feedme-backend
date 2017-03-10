/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

import ApiServer from "./api/apiserver";
import Logger from "./utility/logger";
const Config = require("./config.json");

export default class Application {
    public static MasterStart(): void {
    }

    public static ChildStart(): void {
        var server = new ApiServer(Config);
        
        // Start server
        Logger.Info("Application", "Starting server...");
        server.Start();
    }
}