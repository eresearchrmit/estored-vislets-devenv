/*
 * JSON Twitter Map Visualiser
 */
var twitterMaps = new Array();
var bson;

var dataElementVisualiser = {

	"meta": {
		"id": "json-twitter-as-map",
		"version": "1.0",
		"handled-data-types": ["application/json"],
		"name": "Twitter data as map",
		"description": "Interactive map of a collection of Tweets from Twitter API, in JSON format. \
		Visually shows the geographic distribution of tweets.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": ["https://unpkg.com/leaflet@1.0.2/dist/leaflet.js",
		       "https://cdnjs.cloudflare.com/ajax/libs/chroma-js/1.2.1/chroma.min.js",
		       "https://cdnjs.cloudflare.com/ajax/libs/js-bson/1.0.4/bson.min.js"],
		"css": ["https://unpkg.com/leaflet@1.0.2/dist/leaflet.css"]
	},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("JSON Twitter Visualiser initialisation");

			// Add canvas where the line chart will be drawn
			var mapDiv = document.createElement("div");
			mapDiv.id = "leaflet-map-" + elementId;
			mapDiv.style = "width: 100%; height: 300px";
		    $(contentId)[0].appendChild(mapDiv);
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("JSON Twitter Visualiser Post-Connection initialisation");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("JSON Twitter Visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			var tweets = JSON.parse(data.body);
			//console.log(tweets);

			// Set up Leaflet map
			if(typeof twitterMaps[elementId] === 'undefined') {
				twitterMaps[elementId] = L.map('leaflet-map-' + elementId, {
				    center: [0, 0], // Default: viewing London
				    zoom: 1,
				    scrollWheelZoom: false
				});

		    // Providers List: https://leaflet-extras.github.io/leaflet-providers/preview/
				var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
					attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
				}).addTo(twitterMaps[elementId]);
			}

			// http://gka.github.io/chroma.js/
			var palette = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'];
			var colorScale = chroma.scale(palette).domain([1, 100]).mode('lab');

			tweets.forEach(function(tweet) {

				var createdAt = new Date(tweet.created_at);
				var formattedDate = createdAt.getDate() + "/" + createdAt.getMonth() + "/" + createdAt.getFullYear() + " " + createdAt.getHours() + ":" + createdAt.getMinutes() + ":" + createdAt.getSeconds();

				console.log(tweet);
				var popupContent = "<b>" + tweet.user.name + "</b> - <i>" + formattedDate + "</i><br />" + tweet.text;

				marker = new L.marker([tweet.geo.coordinates[0], tweet.geo.coordinates[1]]).bindPopup(popupContent).addTo(twitterMaps[elementId]);
			});
		}
}
