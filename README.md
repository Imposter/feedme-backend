# Feed Me! Typescript Backend (feedme-backend)
### Introduction
Feed Me! was created to solve a simple problem that existed: deciding where to eat. We as friends, faced this question on almost a daily basis every time we went out for a meal. We set out to solve this issue by creating an Android application, integrating what we learned in the CSCI 2020U course along with previous knowledge we had of programming in Java and Android. Combining all of this, we created Feed Me! A sleek, intuitive and user friendly app where hundreds of local restaurants are only a few taps away.

### Requirements
The following are requirements to compile and run the server:
- Node.js with Node Package Manager (npm) ([How to install](https://nodejs.org/en/download/))
- Typings for Node.js ([How to install](https://www.npmjs.com/package/typings))
- Typescript v2.2 ([How to install](https://www.typescriptlang.org/index.html#download-links))
- Google Account with Console APIs, with Google Maps API key (required), and Custom Search ID and API key (not required)

### Compiling/Installing
1. Run `npm install --save` to install Node.js packages
3. Run `typings install --save` to install Typings packages
4. Run `tsc` to compile the Typescript code into runnable Javascript (You may receive compiling errors for some Node modules, but those can be ignored)
5. Copy `config.example.json` to `config.json` and substitute `GOOGLE_MAPS_API_KEY`, `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` (optional), and `GOOGLE_CUSTOM_SEARCH_ENGINE_API_KEY` (optional) with your Google API keys.
6. Run server using `node bootstrap.js`
7. To test if the server is running correctly, try connecting to the endpoint configured [http://localhost:5050/system/version](http://localhost:5050/system/version)
 
###### Note: The server you start will not be used by the application unless the source is modified to connect to the endpoint the server is running on, and will instead use the default server hosted by us.

### Authors
- Betty Kwong ([GitHub](https://github.com/bunnehbetz))
- Eyaz Rehman ([GitHub](https://github.com/Imposter))
- Rameet Sekhon ([GitHub](https://github.com/rameetss))
- Rishabh Patel ([GitHub](https://github.com/RPatel97))