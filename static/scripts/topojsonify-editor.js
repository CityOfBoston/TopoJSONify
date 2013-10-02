// Leaflet map
var mygeojson = {
  type: "FeatureCollection",
  features: [ ]
};
var map = L.map('map').setView([ 0, 0 ], 5);
map.attributionControl.setPrefix('');

// basemap
var terrain = 'http://{s}.tiles.mapbox.com/v3/mapmeld.map-ofpv1ci4/{z}/{x}/{y}.png';
var terrainAttrib = 'Map data &copy; 2013 OpenStreetMap contributors, Tiles &copy; 2013 MapBox';
L.tileLayer(terrain, {maxZoom: 15, attribution: terrainAttrib}).addTo(map);

// draw control
var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);
var drawControl = new L.Control.Draw({
  draw: {
    rectangle: false,
    circle: false
  },
  edit: {
    featureGroup: editableLayers
  }
});
map.addControl(drawControl);
map.on('draw:created', function(e){
  // assign ID
  e.layer.id = (new Date()) * 1 - 1200000000000;
    
  // update JSON
  var feature = { type: "Feature", id: e.layer.id };
  if(e.layerType == "marker"){
    feature.geometry = {
      type: "Point",
      coordinates: [ e.layer.getLatLng().lng.toFixed(6) * 1, e.layer.getLatLng().lat.toFixed(6) * 1 ]
    };
  }
  else if(typeof e.layer.getLatLngs == "function"){
    // presuming polyline, polygon, rectangle
    var pts = e.layer.getLatLngs();
    feature.geometry = {
      coordinates: [ ]
    };
    if(e.layerType == "polygon" || e.layerType == "rectangle"){
      feature.geometry.type = "Polygon";
      feature.geometry.coordinates.push( [ ] );
    }
    else{
      feature.geometry.type = "LineString";
    }
    for(var p=0;p<pts.length;p++){
      if(feature.geometry.type == "Polygon"){
        feature.geometry.coordinates[0].push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
      }
      else{
        feature.geometry.coordinates.push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
      }
    }
    if(feature.geometry.type == "Polygon"){
      feature.geometry.coordinates[0].push( feature.geometry.coordinates[0][0] );
    }
  }
  else{
    // circle might go here
    //console.log( e.layer );
    //console.log( e.layerType );
  }
  mygeojson.features.push( feature );
  $("#geojson").val('{ "type": "FeatureCollection", "features": ' + JSON.stringify( mygeojson.features ) + ' }');
  
  // add to map
  editableLayers.addLayer( e.layer );
});

map.on('draw:edited', function(e){
  // update any edited layers from the GeoJSON
  e.layers.eachLayer(updateLayer);
  $("#geojson").val('{ "type": "FeatureCollection", "features": ' + JSON.stringify( mygeojson.features ) + ' }');
});
function updateLayer(layer){
  if(typeof layer.id == "undefined" && typeof layer.feature.id != "undefined"){
    layer.id = layer.feature.id;
  }
  if(typeof layer.id != "undefined"){
    for(var f=0;f<mygeojson.features.length;f++){
      var layerid = layer.id;
      var multi = null;
      if(layerid.indexOf("multi_") == 0){
        layerid = layerid.substring(6);
        multi = 1 * layerid.substring(layerid.lastIndexOf("_") + 1);
        layerid = layerid.substring(0, layerid.lastIndexOf("_"));
      }
      if(mygeojson.features[f].id == layerid){
        var feature;
        if(multi === null){
          feature = mygeojson.features[f];
        }
        else{
          feature = mygeojson.features[f].geometry.coordinates[multi];
        }
        if(feature.geometry.type == "Point"){
          var pt = layer.getLatLng();
          feature.geometry.coordinates = [ pt.lng.toFixed(6) * 1, pt.lat.toFixed(6) * 1 ];
        }
        else if(typeof layer.getLatLngs == "function"){
          var pts = layer.getLatLngs();
          if(feature.geometry.type == "Polygon"){
            feature.geometry.coordinates = [ [ ] ];
            for(var p=0;p<pts.length;p++){
              feature.geometry.coordinates[0].push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
            }
          }
          else{
            feature.geometry.coordinates = [ ];
            for(var p=0;p<pts.length;p++){
              feature.geometry.coordinates.push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
            }
          }
        }
        break;
      }
    }
  }
}

map.on('draw:deleted', function(e){
  // remove any deleted layers from the GeoJSON
  e.layers.eachLayer(function(layer){
    if(typeof layer.id != "undefined"){
      var layerid = layer.id;
      var multi = null;
      if(layerid.indexOf("multi_") == 0){
        layerid = layerid.substring(6);
        multi = 1 * layerid.substring(layerid.lastIndexOf("_") + 1);
        layerid = layerid.substring(0, layerid.lastIndexOf("_"));
      }
      for(var f=0;f<mygeojson.features.length;f++){
        if(mygeojson.features[f].id == layerid){
          if(multi === null){
            mygeojson.features.splice(f, 1);
          }
          else{
            mygeojson.features[f].geometry.coordinates.splice(multi, 1);
          }
          break;
        }
      }
    }
  });
  $("#geojson").val('{ "type": "FeatureCollection", "features": ' + JSON.stringify( mygeojson.features ) + ' }');
});

var blockHandler = function(e){
  e.stopPropagation();
  e.preventDefault();
};

var files, fileindex;
var dropFile = function(e){
  e.stopPropagation();
  e.preventDefault();

  files = e.dataTransfer.files;
  if(files && files.length){
    reader = new FileReader();
    reader.onload = processFile;
    fileindex = 0;
    reader.readAsText(files[0]);
  }
};

function processFile(e){
  var injson = null;
  try{
    injson = $.parseJSON( e.target.result );
  }
  catch(err){
  
  }
  if(injson){
    if(injson.type == "Topology"){
      injson = topojson.feature( injson, injson.objects.collection )
    }
    var gj = L.geoJson(injson, {
      onEachFeature: function(feature, layer){
        mygeojson.features.push( feature );
        if(typeof layer.getLayers == "function"){
          for(var i=0;i<layer.getLayers().length;i++){
            var partlayer = layer.getLayers()[i];
            partlayer.id = "multi_" + layer.id + "_" + i;
            partlayer.setStyle({ editable: true });
            partlayer.addTo(editableLayers);
          }
        }
        else{
          layer.setStyle({ editable: true });
          layer.addTo(editableLayers);
        }
      }
    });
    map.fitBounds( gj.getBounds() );
  }
  $("#geojson").val( JSON.stringify( mygeojson ) );
}

// set up file dropping
L.DomEvent.disableClickPropagation($("#overlay")[0]);
document.body.addEventListener('dragenter', blockHandler, false);
document.body.addEventListener('dragexit', blockHandler, false);
document.body.addEventListener('dragover', blockHandler, false);
document.body.addEventListener('drop', dropFile, false);