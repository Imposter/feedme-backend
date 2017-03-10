/*
*   This file is part of the Feed Me! project.
*
*   This program is licensed under the GNU General
*   Public License. To view the full license, check
*   LICENSE in the project root.
*/

import HttpListener from "../network/httplistener";
import ApiResponse from "./apiresponse";
import ApiResponseCode from "./apiresponsecode";
import Logger from "../utility/logger";
import * as express from "express";
const GoogleImages = require("google-images");
const Yelp = require("yelp-fusion");

export default class ApiServer extends HttpListener {
    private images: any;
    private yelp: any;
    private yelpTimeout: number;

    constructor(options: any) {
        super(options.port, options.secure, options.keyPath, options.certPath);

        // Create Google Images instance
        this.images = new GoogleImages(options.google.cseId, options.google.csApiKey);

        // Create Yelp instance
        this.yelpTimeout = 0;
        var getAccessToken = () => {
            Yelp.accessToken(options.yelp, options.yelp.secret).then((response: any) => {
                this.yelp = Yelp.client(response.jsonBody.access_token);
                this.yelpTimeout = response.jsonBody.expires_in - 60;

                setTimeout(getAccessToken, this.yelpTimeout);
            });
        };

        setTimeout(getAccessToken, this.yelpTimeout);

        // Add handlers
        this.AddOnRequestReceived("*", (request: express.Request, response: express.Response) => {
            Logger.Info("ApiServer", "Received request from " + request.connection.remoteAddress + " for resource " + request.path);
            if (request.path == "/search/foodImage") {
                var food = request.query.food;
                if (food == null) {
                    this.send(response, new ApiResponse(ApiResponseCode.SEARCH_INVALID_PARAMETERS));
                } else {
                    this.images.search(food, { size: "large" }).then((images: any) => {
                        if (images.length == 0) {
                            this.send(response, new ApiResponse(ApiResponseCode.SEARCH_FOOD_IMAGE_NOT_FOUND));
                        } else {
                            var image = images[Math.floor(images.length * Math.random())];
                            this.send(response, new ApiResponse(ApiResponseCode.SUCCESS, image.url));
                        }
                    });
                }
            } else if (request.path == "/search/nearbyFoodPlaces") {
                var food = request.query.food;
                var longitude = request.query.longitude;
                var latitude = request.query.latitude;
                var radius = request.query.radius;
                var limit = request.query.limit;
                if (food == null || longitude == null || latitude == null || radius == null) {
                    this.send(response, new ApiResponse(ApiResponseCode.SEARCH_INVALID_PARAMETERS));
                } else {
                    this.yelp.search({
                        term: food,
                        longitude: longitude,
                        latitude: latitude,
                        radius: radius,
                        limit: limit,
                    }).then((response: any) => {
                        this.send(response, new ApiResponse(ApiResponseCode.SUCCESS, {
                            nearby: response
                        }));
                    }).catch((error: any) => {
                        this.send(response, new ApiResponse(ApiResponseCode.ERROR));
                    });
                }
            }
        });
    }

    private send(response: express.Response, apiResponse: ApiResponse) {
        super.SendResponse(response, JSON.stringify(apiResponse));
    }
}