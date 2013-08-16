var express = require('express');
var topojson = require('topojson');
var fs = require('fs');
var child = require("child_process");

var port = process.env.PORT || 3000;
var app = express();
app.use(express.bodyParser());
app.set('json spaces',0);
app.use(express.compress());
app.use(express.methodOverride());
app.listen(port);

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

app.post('/', function(req, res){
  // check for POSTed files through web interface
  var fileCount = 0;
  for(var file in req.files){
    fileCount++;
    fs.readFile(req.files[file].path, function(error, file){
      var topology = topojson.topology({collection: JSON.parse( file ) });
      return res.json( topology );
    });
    break;
  }
  if(fileCount == 0){
    // check for POSTed GeoJSON directly in body
    if(req.body && req.body.type && (req.body.geometry || req.body.coordinates || req.body.features)){
      if(req.body.features){
        var topology = topojson.topology({collection: req.body });
        return res.json( topology );
      }
      else{
        return res.json( req.body );
      }
    }
    else{
      // check each POSTed variable for GeoJSON
      var varCount = 0;
      for(var bodyvar in req.body){
        varCount++;
        var topology = topojson.topology({collection: req.body[bodyvar] });
        return res.json( topology );
      }
      if(varCount == 0){
        res.send('no GeoJSON?');
      }
    }
  }
});