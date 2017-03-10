/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

// Imports
import Logger from "./utility/logger";
import ClusterManager from "./utility/clustermanager";
import Application from "./application";
const Config = require("./config.json")

// Initialize logger
Logger.Initialize(Config.logger);

// Manage cluster
if (ClusterManager.IsMasterWorker()) {
    Logger.Info("Main", "Initializing cluster...");
    ClusterManager.Initialize();

    // Create shutdown handler
    var shutdownHandler = (error: any) => {
        // Shutdown cluster
        ClusterManager.Shutdown();

        // Print stack trace if necessary
        if (error != null && error.stack != null) {
            Logger.Error("Main", "CRITICAL ERROR: " + error.stack);
            process.exit(-1);
        }
        process.exit(0);
    };
    process.on("exit", shutdownHandler.bind(null))
        .on("uncaughtException", shutdownHandler.bind(null))
        .on("SIGINT", shutdownHandler.bind(null));

    var threadCount = ClusterManager.GetCPUThreads();
    Logger.Info("Main", "CPU Thread Count: " + threadCount);
    if (Config.maxWorkers != null && Config.maxWorkers != 0) { // TODO: ...
        threadCount = threadCount > Config.maxWorkers ? Config.maxWorkers : threadCount;
    }
    Logger.Info("Main", "Max workers: " + threadCount);

    // Create worker for each thread
    for (var i = 0; i < threadCount; i++) {
        var worker = ClusterManager.CreateWorker();
        Logger.Info("Main", "Created worker " + (i + 1) + " (id: " + worker.id + ", pid: " + worker.process.pid + ")");
    }

    Application.MasterStart();

    Logger.Info("Main", "Master idling...");
} else {
    // Get worker
    var worker = ClusterManager.GetCurrentWorker();

    // Add shutdown handler
    var shutdownHandler = (error: any) => {
        Logger.Info("Main", "Shutting down...");

        // Print stack trace if necessary
        if (error != null && error.stack != null) {
            Logger.Error("Main", "CRITICAL ERROR: " + error.stack);
        }
        ClusterManager.DestroyWorker();
    };
    worker.on("exit", shutdownHandler.bind(null))
        .on("uncaughtException", shutdownHandler.bind(null))
        .on("SIGINT", shutdownHandler.bind(null));

    Application.ChildStart();
}