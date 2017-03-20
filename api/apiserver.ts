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
const GoogleMaps = require("@google/maps");

export default class ApiServer extends HttpListener {
    private images: any;
    private maps: any;

    constructor(options: any) {
        super(options.port, options.secure, options.keyPath, options.certPath);

        // Body parsing
        this.app.use((request: any, response: any, next: any) => {
            request.rawBody = "";
            request.setEncoding("utf8");

            request.on("data", (chunk: any) => {
                request.rawBody += chunk;
            });

            request.on("end", () => {
                next();
            })
        });

        // Create Google Images instance
        this.images = new GoogleImages(options.google.cseId, options.google.csApiKey);

        // Create Google Maps instance
        this.maps = new GoogleMaps.createClient({ key: options.google.mapsApiKey });

        // Add handlers
        this.AddOnRequestReceived("*", (request: any, response: any) => {
            Logger.Info("ApiServer", "Received request from " + request.connection.remoteAddress + " for resource " + request.path);

            // Parse POST parameters
            var parameters: any = null;
            try {
                parameters = JSON.parse(request.rawBody);
            } catch (error) {
                parameters = request.query;
            }

            if (request.path == "/search/foodImage") {
                Logger.Info("ApiServer", "Search::FoodImage request from " + request.connection.remoteAddress + " " + JSON.stringify(parameters));

                var food = parameters.food;
                if (food == null) {
                    this.send(response, new ApiResponse(ApiResponseCode.SEARCH_INVALID_PARAMETERS));
                } else {
                    this.images.search(food, { size: "large" }).then((images: any) => {
                        if (images.length == 0) {
                            this.send(response, new ApiResponse(ApiResponseCode.SEARCH_FOOD_IMAGE_NOT_FOUND));
                        } else {
                            var image = images[Math.floor(images.length * Math.random())];
                            this.send(response, new ApiResponse(ApiResponseCode.SUCCESS, {
                                link: image.url
                            }));
                        }
                    });
                }
            } else if (request.path == "/search/nearbyFoodPlaces") {
                Logger.Info("ApiServer", "Search::NearbyFoodPlaces request from " + request.connection.remoteAddress + " " + JSON.stringify(parameters));

                var food = parameters.food;
                var latitude = parseFloat(parameters.latitude);
                var longitude = parseFloat(parameters.longitude);
                var radius = parseInt(parameters.radius);
                var token = parameters.token;
                if (food == null || latitude == null || longitude == null || radius == null) {
                    this.send(response, new ApiResponse(ApiResponseCode.SEARCH_INVALID_PARAMETERS));
                } else {
                    this.maps.placesNearby({
                        language: "en",
                        location: [ latitude, longitude ],
                        radius: radius,
                        minprice: 1,
                        maxprice: 4,
                        opennow: true,
                        type: "restaurant",
                        keyword: food,
                        pagetoken: token
                    }, (error: any, data: any) => {
                        if (error == null) {
                            this.send(response, new ApiResponse(ApiResponseCode.SUCCESS, {
                                nearby: data.json.results,
                                next: data.json.next_page_token
                            }));
                        } else {
                            Logger.Error("ApiServer", "ERROR: " + error);
                        }
                    });
                }
            }
        });
    }

    private send(response: express.Response, apiResponse: ApiResponse) {
        super.SendResponse(response, JSON.stringify(apiResponse), {
            "Content-Type": "application/json"
        });
    }
}