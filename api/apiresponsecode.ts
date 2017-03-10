/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

export enum ApiResponseCode {
    SUCCESS = 0,
    ERROR,

    // Search
    SEARCH = 500,
    SEARCH_INVALID_PARAMETERS,
    SEARCH_FOOD_IMAGE_NOT_FOUND,
    SEARCH_FOOD_IMAGE_ERROR,
}

export default ApiResponseCode;