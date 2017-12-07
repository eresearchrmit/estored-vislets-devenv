/*
 * TSV eCourrier Visualiser
 */
var eCourrierMaps = new Array();
var layerVisibility = {};

var dataElementVisualiser = {

	"meta": {
		"id": "tsv-courier-movement-as-leaflet-map",
		"version": "1.0",
		"handled-data-types": ["text/tab-separated-values"],
		"name": "TSV of Courier Trajectories as Lealet map",
		"description": "Displays Tab-separated-values (TSV) representing eCourier \
		data onto an interactive Leaflet map.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	dependencies: {
		"js": ["https://unpkg.com/leaflet@1.0.2/dist/leaflet.js",
		       "https://cdnjs.cloudflare.com/ajax/libs/chroma-js/1.2.1/chroma.min.js",
		       "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js"],
		"css": ["https://unpkg.com/leaflet@1.0.2/dist/leaflet.css"]
	},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("TSV eCourrier Visualiser initialisation");

			// Add canvas where the line chart will be drawn
			var mapDiv = document.createElement("div");
			mapDiv.id = "leaflet-map-" + elementId;
			mapDiv.style = "width: 1920px; height: 1080px";
		    $(contentId)[0].appendChild(mapDiv);
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("TSV eCourrier Visualiser Post-Connection initialisation");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("TSV eCourrier Visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			// Set up Leaflet map
			if(typeof eCourrierMaps[elementId] === 'undefined') {
				eCourrierMaps[elementId] = L.map('leaflet-map-' + elementId, {
				    center: [51.512452, -0.092955], // Default: viewing all Australia
				    zoom: 14,
				    scrollWheelZoom: false
				});
		    	// Providers List: https://leaflet-extras.github.io/leaflet-providers/preview/
				var Esri_WorldTopoMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
					attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
				}).addTo(eCourrierMaps[elementId]);
			}

			// http://gka.github.io/chroma.js/
			var palette = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'];
			var colorScale = chroma.scale(palette).domain([1, 100]).mode('lab');

			var routes = {};
			var routesColors = {};
			var index = 0;
			var previousDate = new Date(1970, 01, 01);
			var previousLocation = new L.LatLng(180, 90);

			var routesTableHtml = '<div id="dataElement' + elementId + 'RouteTableContainer">';
			routesTableHtml += '<h3>Trajectories</h3>';
			routesTableHtml += '<table id="routes-table-' + elementId + '" class="table table-bordered">';
			routesTableHtml += '<thead><th><input id="' + elementId + 'checkAllRoutes" type="checkbox" checked="checked" /></th><th>Couriers</th><th>Vehicles</th></thead>';


			// Parse the received CSV content
			var results = Papa.parse(data.body, {
				delimiter: "\t",
				newline: "\n",
				header: true,
				skipEmptyLines: true,
				step: function(row) {
					//console.log("Row:", row.data[0]);
					row = row.data[0];

					// Split trajectories if more than 1h between 2 data points
					// Splits trajectories if there is too much distance between 2 datapoints
					var rowDate = new Date(row['timestamp']);
					var differenceDates = rowDate - previousDate;
					var location = new L.LatLng(row['latitude'], row['longitude']);
					if (differenceDates > 3600000 || location.distanceTo(previousLocation) > 2000) {
						console.log(differenceDates / 1000, location.distanceTo(previousLocation))

						index++;
					}
					var uniqueID = row['type'] + " " + row['vehicleid'] + " " + index;

					var rowColor = colorScale((index * 10) % 100).hex();
					/*marker = new L.circleMarker([row['latitude'], row['longitude']], {color: rowColor, opacity: 1, radius: 1})
					.bindPopup("<strong>" + index + "</strong><br />" + rowDate + ": [" + row['latitude'] + "," + row['longitude'] + "]");
					marker.addTo(eCourrierMaps[elementId]);*/

					if (typeof routes[uniqueID] == 'undefined') {
						routes[uniqueID] = new Array();

						routesTableHtml += '<tr style="color: ' + rowColor + '"><td><input id="' + uniqueID + '" class="cbVehicle" type="checkbox" checked="checked" /></td>';
						routesTableHtml += '<td>';
						routesTableHtml += "Courier " + row['courierid'];
						routesTableHtml += '</td><td>';
						routesTableHtml += row['type'] + " " + row['vehicleid'];
						routesTableHtml += "</td></tr>";
					}
					var locationPoint = new L.LatLng(row['latitude'], row['longitude']);
					routes[uniqueID].push(locationPoint);
					routesColors[uniqueID] = rowColor;

					previousLocation = location;
					previousDate = rowDate;
				},
				complete: function(results) {
					_.each(routes, function(route, key) {
						var polyline = new L.Polyline(route, {
						    color: routesColors[key],
						    weight: 3,
						    opacity: 0.5,
						    smoothFactor: 1
						});
						polyline.addTo(eCourrierMaps[elementId]);
					});

					routesTableHtml +="</table></div><br/>";
					$(contentId).append(routesTableHtml);

					// Make table data points collapsed
					$("#dataElement" + elementId + "RouteTableContainer").accordion({
						 active: false,
						 collapsible: true
					});
					// CHANGE event handler of trajectories checkboxes
					$("#routes-table-" + elementId + " .cbVehicle").change(function() {
						if($(this).attr("checked") == 'checked') {
							this.checked = true;
							eCourrierMaps[elementId].addLayer(routes[$(this).attr("id")]);
				        }
				        else {
				        	this.checked = false;
				        	eCourrierMaps[elementId].removeLayer(routes[$(this).attr("id")]);
				        }
				    });
					// CLICK event handler of trajectories checkboxes
					$("#routes-table-" + elementId + " .cbVehicle").click(function() {
						$(this).attr("checked", !$(this).attr("checked"));
					});
					// CHANGE event handler on the top checkbox (check/uncheck all)
					$("#" + elementId + "checkAllRoutes").change(function() {
						console.log("checkAllRoutes changed. checked: " + $(this).is(":checked"));
						$("#routes-table-" + elementId + " .cbVehicle").attr('checked', $(this).is(":checked")).change();
					});
				}
			});
		}
}
