var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');
var Logger = require('fh-logger-helper');
var pkg = require('./package.json');

process.env.BUILD_VERSION = pkg.version;

// list the endpoints which you want to make securable here
var securableEndpoints = [];
// list the endpoints which you want to make securable here
// add securable endpoints only if environment variable `FH_ENV` is set
if (process.env.FH_ENV === "prod") {
    securableEndpoints = ['hello'];
}

var app = express();

// Enable CORS for all requests
app.use(cors());

// Add versioning header `API-Version` to every response
app.use(function(req, res, next) {
    res.header('API-Version', process.env.BUILD_VERSION);
    next();
});

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

/* uncomment this code if you want to use $fh.auth in the app preview
 * localAuth is only used for local development. 
 * If the app is deployed on the platform, 
 * this function will be ignored and the request will be forwarded 
 * to the platform to perform authentication.

app.use('/box', mbaasExpress.auth({localAuth: function(req, cb){
  return cb(null, {status:401, body: {"message": "bad request"}});
}}));

or

app.use('/box', mbaasExpress.core({localAuth: {status:401, body: {"message": "not authorised”}}}));
*/

// allow serving of static files from the public directory
app.use(express.static(__dirname + '/public'));

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

// add in Health endpoint
app.use('/health', require('./lib/healthChecks.js')());

app.use('/hello', require('./lib/hello.js')());

// add a `version` endpoint
app.use('/version', function(req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    res.json({
        endpoint: fullUrl,
        name: pkg.name,
        version: process.env.BUILD_VERSION
    });
});

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
app.listen(port, host, function() {
    Logger.log("info", "Service API Version:", process.env.BUILD_VERSION);
    Logger.log("info", "Service started on port:", port);
});