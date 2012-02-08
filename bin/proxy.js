#!/usr/bin/env node

var perfectapi = require('perfectapi');  
//var perfectapi = require('../../perfectapi/api.js')
var path = require('path');
var main = require('../lib/main.js');

var configPath = path.resolve(__dirname, '..', 'perfectapi.json');
var parser = new perfectapi.Parser();
var pollInterval = 60 * 1000;

//handle the commands
parser.on("getLoad", function(config, callback) {
  main.getLoad(config, function(err, result) {
    callback(err, result);
  });
});

parser.on("getCulprit", function(config, callback) {
  main.getCulprit(db, config, function(err, result) {
    callback(err, result);
  });
});

module.exports = parser.parse(configPath);

perfectapi.proxy('http://localhost/paas/registry', function(err, registry) {
  //now we have a reference to the registry running on the same machine
  
  setInterval(function() {
    var config = {}
    registry.listServices(config, function(err, result) {
      //todo: stuff
    })
  }, pollInterval);
});