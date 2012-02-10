#!/usr/bin/env node

var perfectapi = require('perfectapi');  
//var perfectapi = require('../../perfectapi/api.js')
var path = require('path');
var main = require('../lib/main.js');
var load = require('../lib/load.js');

var configPath = path.resolve(__dirname, '..', 'perfectapi.json');
var parser = new perfectapi.Parser();
var pollInterval = 60 * 1000;

//handle the commands
parser.on("getLoad", function(config, callback) {
  load.getLoad(config, function(err, result) {
    callback(err, result);
  });
});

parser.on("getCulprit", function(config, callback) {
  load.getCulprit(config, function(err, result) {
    callback(err, result);
  });
});

parser.on("server", function(config, callback) {
  var endpoint = config.environment.SERVICE_REGISTRY_URL;
  
  perfectapi.proxy(endpoint, function(err, registry) {
    //now we have a reference to the registry running on the same machine
    
    var poller = function() {
      var config = {}
      registry.listServices(config, function(err, result) {
        if (err) return console.log(err);
        
        main.poll(registry, result, function(err) {
          if (err) return console.log(err);
        });
      })
    }
    
    poller();
    
    setInterval(poller, pollInterval);
  });
})

module.exports = parser.parse(configPath);