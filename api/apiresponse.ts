/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

export default class ApiResponse {
    public code: number;
    public data: any;

    constructor(code: number, data?: any) {
        this.code = code;
        this.data = data;
    }
}