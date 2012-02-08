var async = require('async');
var os = require('os');
var haproxy = require('./haproxy.js');

exports.poll = function(registry, serviceNames, callback) {

  var matchedServices = [];
  var hostName = os.hostname().toLowerCase();
  
  async.forEach(serviceNames, function(serviceName, cb) {
    var config = {name: serviceName};
    console.log(serviceName)
    registry.getServiceInfo(config, function(err, result) {
      console.log(result);
      async.filter(result, function(instance, cb2) {
        cb2(instance.host && instance.host.toLowerCase() == hostName);
      }, function(filteredInstances) {
        if (filteredInstances.length > 0) {
          var validName = serviceName
            .replace(/\\/g, '\\\\')
            .replace(/ /g, '\\ ');
            
          var matchedService = {name: validName, path: filteredInstances[0].path, instances: filteredInstances};
          matchedServices.push(matchedService);
        } else {
          console.log('no matched services found for this host')
        }
        cb(err);
      });
    })
  }, function(err) {
    if (err) return callback(err);
    
    //we now have matchedServices array to work with.
    var existingFileContent = haproxy.getConfig();
    
    var newContent = '';
    newContent += 'global\n';
    newContent += '  maxconn 4096\n';
    newContent += '  user haproxy\n';
    newContent += '  group haproxy\n';
    newContent += '  daemon\n';
    newContent += '\n';
    newContent += 'defaults\n';
    newContent += '  log     global\n';
    newContent += '  mode    http\n';
    newContent += '  option  httplog\n';
    newContent += '  option  dontlognull\n';
    newContent += '  retries 3\n';
    newContent += '  option redispatch\n';
    newContent += '  maxconn 2000\n';
    newContent += '  contimeout      5000\n';
    newContent += '  clitimeout      50000\n';
    newContent += '  srvtimeout      50000\n';
    newContent += '\n';
    newContent += 'frontend all 0.0.0.0:8080\n';
    newContent += '  acl is_websocket hdr(Upgrade) -i WebSocket\n';
    newContent += '  acl is_websocket hdr_beg(Host) -i ws\n';
    
    //service matching acls
    matchedServices.forEach(function(service) {
      newContent += '  acl is_' + service.name + ' path_beg ' + service.path + '\n';
    });
    
    //service backend routing
    matchedServices.forEach(function(service) {
      newContent += '  use_backend ' + service.name + ' if is_' + service.name + '\n';
    });
    
    //backends
    matchedServices.forEach(function(service) {
      newContent += 'backend ' + service.name + '\n';
      newContent += '  balance roundrobin\n';
      newContent += '  option forwardfor\n';
      newContent += '  timeout server 30000\n';
      newContent += '\n';
      
      service.instances.forEach(function(instance) {
        newContent += '  server ' + service.name + instance.id + ' 127.0.0.1:' + instance.port + ' weight 1 maxconn 1024 check\n'
      })
      newContent += '\n';
    });
    
    

    if (existingFileContent != newContent) {
      haproxy.saveConfig(newContent, function(err, result) {
      
        callback(err, result);
      })
    }
  })
}