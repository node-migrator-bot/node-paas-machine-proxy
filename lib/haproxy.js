var fs = require('fs');
var os = require('os');
var path = require('path');

var configFile = '/etc/haproxy/haproxy.cfg';

exports.getConfig = function() {

  if (fs.existsSync(configFile)) {
    return fs.readFileSync(configFile, 'utf8');
  } else {
    console.log('Could not locate haproxy config at ' + configFile);
    return '';
  }
    
}

exports.saveConfig = function(content, callback) {

  console.log(content);
  
  fs.writeFile(configFile, content, 'utf8', function(err) {
    if (err) return callback(err);
  
    var command = 'sudo';
    var args = ['service','haproxy','reload'];
    var child = require('child_process').spawn(command, args);
    child.on('exit', function(code) {
      if (code === 0) {
        callback(null);
      } else {
        callback('Error reloading haproxy, exit code was ' + code);
      }
    });
    
    child.stderr.on('data', function(data) {
      console.log('haproxy: ' + data);
    })
  })
}