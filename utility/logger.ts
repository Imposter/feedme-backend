/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

// Imports
import * as log from "log4js";

export default class Logger {
    public static Initialize(config: any): void {
        log.configure(config);
    }

    public static Info(className: string, message: string) {
        log.getLogger(className).info(message);
    }

    public static Warn(className: string, message: string) {
        log.getLogger(className).warn(message);
    }

    public static Error(className: string, message: string) {
        log.getLogger(className).error(message);
    }
}
