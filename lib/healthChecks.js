var express = require('express'),
    health = require('fh-health'),
    request = require('request');

function healthRoute() {
    health.init();
    var healthRoutes = new express.Router();

    health.addTest('Test http', function(callback) {
        request.get('http://www.google.com', function(err, res, body) {
            if (err) {
                return callback('Error in request to google.com: ' + JSON.stringify(err));
            } else if (res && res.statusCode !== 200 && body) {
                return callback('Google responded with status code of ' + res.statusCode);
            } else {
                return callback(null, 'Successfully loaded google.com');
            }
        });
    });

    healthRoutes.get('/', function(req, res) {
        health.runTests(function(err, testResult) {
            res.end(testResult);
        });
    });
    
    return healthRoutes;
}

module.exports = healthRoute;