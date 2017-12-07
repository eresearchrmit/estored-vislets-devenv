/*
 * GeoJSON features visualiser as Leaflet map
 */
var maps = new Array();

var dataElementVisualiser = {

	"meta": {
		"id": "geojson-features-as-lealet-map",
		"version": "1.0",
		"handled-data-types": ["application/vnd.geo+json"],
		"name": "GeoJSON features as Leaflet Map",
		"description": "Displays GeoJSON features onto an interactive Leaflet map.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": ["https://unpkg.com/leaflet@1.0.2/dist/leaflet.js"],
		"css": ["https://unpkg.com/leaflet@1.0.2/dist/leaflet.css"]
	},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("GeoJSON features visualiser initialisation");

			var height = $(contentId).height();
			var minHeight = 300;
			
			// Add canvas where the line chart will be drawn
			var mapDiv = document.createElement("div");
			mapDiv.id = "leaflet-map-" + elementId;
			mapDiv.style = "width: 100%; height: " + ((height > minHeight) ? height : minHeight) + "px";
		  $(contentId)[0].appendChild(mapDiv);
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("GeoJSON features visualiser post-connection initialisation");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("GeoJSON features visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			if(typeof maps[elementId] === 'undefined') {
				maps[elementId] = L.map('leaflet-map-' + elementId, {
				    center: [-25.274398, 133.775136], // Default: viewing all Australia
				    zoom: 3,
				    scrollWheelZoom: false
				});
				console.log(maps[elementId]);

		    	// Providers List: https://leaflet-extras.github.io/leaflet-providers/preview/
				var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
					attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
				}).addTo(maps[elementId]);
			}

			var features = JSON.parse(data.body);

			// Reads and load GeoJSON onto the map
			var featuresLayer = L.geoJson(features, {
				style: {
					"color": "#ff7800",
					"weight": 1
				},
				onEachFeature: function(feature, layer) {

					var popupContent = "<strong>Attributes:</strong><br />";
					for (var key in feature.properties) {
				        if (feature.properties.hasOwnProperty(key)) {
				           popupContent += key + "=" + feature.properties[key] + "<br />";
				        }
				    }
				    layer.bindPopup(popupContent, { maxHeight: 200, minWidth: 100, className : 'leafletMapPopup'});
				}
			}).addTo(maps[elementId]);

			// Adapts Center & Zoom of the map to the data
			(maps[elementId]).fitBounds(featuresLayer.getBounds());
		}
}
