## TopoJSONify

The TopoJSON spec requires us to make TopoJSON with Node.js and NPM

Cool, right? Unless you don't have Node and NPM installed, or you're running a script in another programming language.

Now you can get your GeoJSON converted to TopoJSON, programatically, over the web.

## API

Get your GeoJSON FeatureCollection and do one of the following:

* Go to http://topojsonify.heroku.com/ and upload your GeoJSON file

* Go to http://topojsonify.heroku.com/map and drop in GeoJSON, TopoJSON, and Shapefiles to edit and extend with Leaflet.draw. Press TopoJSON button.

* POST http://topojsonify.herokuapp.com/ with your GeoJSON file in the body

* POST http://topojsonify.herokuapp.com/ with your GeoJSON in the body

* POST http://topojsonify.herokuapp.com/ with your GeoJSON as a variable in the body

## License

BSD License compatible with TopoJSON's license
