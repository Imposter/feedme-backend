/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

// Imports
import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as os from "os";

export default class HttpListener {
    private port: number;
    private secure: boolean;

    private key: Buffer;
    private cert: Buffer;

    private server: any;
    protected app: any;

    constructor(port: number, secure?: boolean, keyPath?: string,
        certPath?: string) {
        this.port = port;
        this.secure = secure || false;
        this.key = (!secure || keyPath == null) ? new Buffer("") : fs.readFileSync(keyPath);
        this.cert = (!secure || certPath == null) ? new Buffer("") : fs.readFileSync(certPath);

        this.app = express();

        if (!secure) {
            this.server = http.createServer(this.app);
        } else {
            this.server = https.createServer({
                key: this.key,
                cert: this.cert,
                requestCert: true
            }, this.app);
        }
    }

    public Start() {
        this.server.listen(this.port);
    }

    public Stop() {
        this.server.close();
    }

    public AddOnRequestReceived(route: string, callback: Function) {
        this.app.all(route, callback)
    }

    public SendResponse(response: express.Response, data: string | Buffer, headers?: { [field: string]: string }, code?: number) {
        if (headers != null) {
            response.set(headers);
        }
        response.status(code == null ? 200 : code).send(data);
    }

    public GetApp() {
        return this.app;
    }
}