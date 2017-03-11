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
    private categoryFilter: string[];

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

        // Filters
        this.categoryFilter = options.categoryFilter;

        // Create Google Images instance
        this.images = new GoogleImages(options.google.cseId, options.google.csApiKey);

        // Create Yelp instance
        this.yelpTimeout = 0;
        var getAccessToken = () => {
            Yelp.accessToken(options.yelp.id, options.yelp.secret).then((response: any) => {
                this.yelp = Yelp.client(response.jsonBody.access_token);
                this.yelpTimeout = response.jsonBody.expires_in - 60;

                setTimeout(getAccessToken, this.yelpTimeout);
            });
        };

        setTimeout(getAccessToken, this.yelpTimeout);

        // Add handlers
        this.AddOnRequestReceived("*", (request: any, response: any) => {
            Logger.Info("ApiServer", "Received request from " + request.connection.remoteAddress + " for resource " + request.path);

            // Parse POST parameters
            var parameters = null;
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
                            this.send(response, new ApiResponse(ApiResponseCode.SUCCESS, image.url));
                        }
                    });
                }
            } else if (request.path == "/search/nearbyFoodPlaces") {
                Logger.Info("ApiServer", "Search::NearbyFoodPlaces request from " + request.connection.remoteAddress + " " + JSON.stringify(parameters));

                var food = parameters.food;
                var latitude = parameters.latitude;
                var longitude = parameters.longitude;
                var radius = parameters.radius;
                var limit = parameters.limit;
                if (food == null || latitude == null || longitude == null || radius == null) {
                    this.send(response, new ApiResponse(ApiResponseCode.SEARCH_INVALID_PARAMETERS));
                } else {
                    this.yelp.search({
                        term: food,
                        latitude: latitude,
                        longitude: longitude,
                        radius: radius, // Max: 40000m
                        limit: limit, // Max: 50
                        categories: "food",
                        open_now: true
                    }).then((data: any) => {
                        var restaurants: any = [];
                        data.jsonBody.businesses.forEach((business: any) => {
                            var add = true;
                            for (var i = 0; i < business.categories.length; i++) {
                                var category = business.categories[i];
                                var alias = category.alias;

                                for (var j = 0; j < this.categoryFilter.length; j++) {
                                    var filter = this.categoryFilter[j];
                                    if (alias.indexOf(filter) != -1) {
                                        add = false;
                                        break;
                                    }
                                }
                                if (!add) {
                                    break;
                                }
                            }
                            if (add) {
                                restaurants.push(business);
                            }
                        });
                        
                        this.send(response, new ApiResponse(ApiResponseCode.SUCCESS, {
                            nearby: restaurants
                        }));
                    }).catch((error: any) => {
                        Logger.Error("ApiServer", "ERROR: " + error);
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