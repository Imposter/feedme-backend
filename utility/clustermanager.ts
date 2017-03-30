/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

// Imports
import * as cluster from "cluster";
import * as os from "os";
import Logger from "./logger";

export default class ClusterManager {
    private static workers: cluster.Worker[];
    private static initialized: boolean;

    public static Initialize(): boolean {
        if (this.initialized) {
            return false;
        }

        this.workers = [];
        this.initialized = true;

        var self = this;
        cluster.on("fork", (worker: cluster.Worker) => {
            var index = self.workers.indexOf(worker);
            if (index != -1) {
                Logger.Info("ClusterManager", "Worker " + worker.id + " has been forked");
            } else {
                Logger.Warn("ClusterManager", "Unknown worker " + worker.id + " has been forked, terminating...");
                worker.kill();
            }
        });
        cluster.on("online", (worker: cluster.Worker) => {
            Logger.Info("ClusterManager", "Worker " + worker.id + " is now online");
        });
        cluster.on("listening", (worker: cluster.Worker) => {
            Logger.Info("ClusterManager", "Worker " + worker.id + " is now listening");
        });
        cluster.on("disconnect", (worker: cluster.Worker) => {
            Logger.Warn("ClusterManager", "Worker " + worker.id + " has disconnected");
        });
        cluster.on("exit", (worker: cluster.Worker, code: number, signal: string) => {
            var index = self.workers.indexOf(worker);
            if (signal != "end" && index != -1) {
                var newWorker = cluster.fork();
                this.workers[index] = newWorker;
                Logger.Warn("ClusterManager", "Worker " + worker.id + " stopped unexpectedly, created new worker " + newWorker.id);
            }
        });

        return true;
    }

    public static Shutdown(): boolean {
        if (!this.initialized) {
            return false;
        }

        // Stop nodes
        for (var i = 0; i < this.workers.length; i++) {
            var worker = this.workers[i];
            worker.kill("end");
        }
        Logger.Info("ClusterManager", "Killed all workers");

        this.initialized = false;

        return true;
    }

    public static CreateWorker(): cluster.Worker {
        // Fork a process and store the newly created process
        var worker = cluster.fork();
        this.workers.push(worker);
        Logger.Info("ClusterManager", "Created worker " + worker.id);
        return worker;
    }

    public static DestroyWorker(worker?: cluster.Worker): boolean {
        if (worker != null) {
            var index = this.workers.indexOf(worker);
            if (index == -1) {
                return false;
            }
        } else {
            worker = cluster.worker;
        }
        this.workers.splice(index, 1);
        worker.kill("end");
        Logger.Info("ClusterManager", "Killed worker " + worker.id);
        return true;
    }

    public static GetCurrentWorker(): cluster.Worker {
        return cluster.worker;
    }

    public static GetCPUThreads(): number {
        return os.cpus().length;
    }

    public static IsMasterWorker(): boolean {
        return cluster.isMaster;
    }
}
