# Wunderlist Javascript SDK

The Wunderlist JS SDK simplifies interacting with the Wunderlist API.
It can be used both in the browser and on the server side.

***Note:*** Before you can start using Wunderlist API you need to [register your app](https://developer.wunderlist.com).

## Basic Usage

### Node

```javascript
var WunderlistSDK = require('wunderlist');
var wunderlistAPI = new WunderlistSDK({
  'accessToken': 'a user access_token',
  'clientID': 'your client_id'
});

wunderlistAPI.http.lists.all()
  .done(function (lists) {
    /* do stuff */
  })
  .fail(function () {
    console.error('there was a problem');
  });
```

### Browser

Include the SDK somewhere:
```html
<head>
  <script type="text/javascript" src="/dist/wunderlist.sdk.js"></script>
</head>
```
... it can be now loaded from a global namespace ...
```
var WunderlistSDK = window.wunderlist.sdk;
```
... or as an AMD module (if an AMD loader was present before the sdk was loaded) ...

```javascript
define(['wunderlist.sdk'], function (WunderlistSDK) {
  // do stuff with wunderlist by getting an instance of the sdk through WunderlistSDK#start
});
```

Get an instance of the SDK:
```javascript
// Returns an instance of the Wunderlist SDK setup with the correct client ID and user access token
// and sets up a single WebSocket connection for REST over socket proxying
var WunderlistAPI = new WunderlistSDK({
  'accessToken': 'a user token',
  'clientID': 'your application id'
});

WunderlistAPI.initialized.done(function () {
  // Where handleListData and handleError are functions
  // 'http' here can be replaced with 'socket' to use a WebSocket connection for all requests
  WunderlistAPI.http.lists.all()
    // handleListData will be called with the object parsed from the response JSON
    .done(handleListData)
    // handleError will be called with the error/event
    .fail(handleError);
});
```

## Advanced Usage

All the available API services are exposed on the `wunderlist.sdk` constructor as `services`.
This allows creating an instance of a single service rather than all services for the entire API.

```javascript
'use strict';

var sdk = require('wunderlist');
var oauthConfig = require('../../config/oauth.json');

sdk.prototype.setupLogging({
  'logLevel': 'error',
  'logPattern': '*'
});

function getService (context, service) {

  var options = {
    'accessToken': context.session.access_token,
    'clientID': oauthConfig.clientId,
    'maxHttpRequests': 1000,
    'checkHealth': false
  };

  return new sdk.services[service]({
    'config': options
  });
}

module.exports = {
  'get': getService
};

```

# Documentation

Open /docs/index.html in your browser for the full JS documentation, or from the /docs path if you are running the development server.

# Development

The Wunderlist Javascript SDK is built with Wunderbits, lo-dash, node.js, grunt and some other stuff

## Get started

If you are on a vanilla system, you need some tools
* Install brew from http://mxcl.github.io/homebrew/
* Install node/npm from http://nodejs.org/

### Make yourself owner of /usr/local:

  $ sudo chown -R `whoami`:staff /usr/local

### One time setup:

    $ make install

### Clone the repo & start developing

    $ git clone git@github.com:wunderlist/wunderlist.js.git
    $ cd wunderlist.js
    $ make start

## Run tests

## Run development server

    $ make start

This will install all dependencies (via npm) if needed and start the server. By default the server runs on port [5020](http://localhost:5020/). You can configure this by setting the `PORT` environment variable, via the command line (i.e. `env PORT=1234 make start`).

### Run unit tests

    $ make unit

### Watch unit tests (for development)

    $ make watch

### Debug (with node-inspector)

    $ make debug

### Run benchmark tests

    $ make benchmarks

### Run specific tests in node (run mocha directly)
	$ ./node_modules/mocha/bin/_mocha --require specs/helper.js --grep "SchemaValidator" --watch --reporter spec specs/**/*.spec.js

### Run specific tests in the browser
	just click on a suite to use that as the grep pattern

### Resources
  - [Chai BDD API](http://chaijs.com/api/bdd)
  - [Sinon Chai docs](https://github.com/domenic/sinon-chai)

## Build documentation

    $ make documentation
