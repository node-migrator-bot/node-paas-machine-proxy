
var async = require('async');
var os = require('os');

exports.getLoad = function(config, callback) {
  var cpuCount = os.cpus().length;
  var totalLoad = os.loadavg()[1];
  
  callback(null, {load: totalLoad / cpuCount })
}

exports.getCulprit = function(config, callback) {
  var culpritCommand = '';
  var culpritPID = 0;
  var culpritUser = '';
  var maxCpu = 0.0;
  
  var command = 'ps';
  var args = ['-A','u'];
  var child = require('child_process').spawn(command, args);
  child.on('exit', function(code) {
    if (code === 0) {
      callback(null, {cpu: maxCpu, PID: culpritPID, command: culpritCommand, user: culpritUser})
    } else {
      callback('Error running ps, exit code was ' + code);
    }
  });
  
  child.stderr.on('data', function(data) {
    console.log('ps: ' + data);
  })
  
  child.stdout.on('data', function(data) {
    var rows = data.toString('utf8').split('\n');
    
    for (var i=0;i<rows.length;i++) {
      //USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
      //root         1  0.0  0.2  24052  1252 ?        Ss   Jan06   0:04 /sbin/init

      var row = rows[i];
      if (i > 0 && row.length > 66) {
        var cpu = Number(row.substr(15, 4));
        var pid = Number(row.substr(8, 6));
        if (cpu > maxCpu && pid != process.pid) {
          maxCpu = cpu;
          culpritCommand = row.substr(65);        //might be truncated?
          culpritPID = pid;
          culpritUser = row.substr(0, 8).trim();         //could be a name or a UID depends on whether it fits
        }
      }    
    }
    
    
    
  })
}