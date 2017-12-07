/*
 * JSON data from FESTO mini-factory visualiser as a graph
 */

var dataElementVisualiser = {

		sensorData: [],

		graphTimeSlider : null,
		minTimestamp: null,
		maxTimestamp: null,

		/**************** REQUIRED FOR VISUALISER ******************/

		"meta": {
			"id": "json-festo-sensors-as-timeline-graph",
			"version": "1.0",
			"handled-data-types": ["application/json"],
			"name": "JSON FESTO sensors as graph",
			"description": "Displays wether sensors on a FESTO mini-factory are ON \
			or OFF by changing the color of nodes on an existing directed graph with \
			D3.js.",
			"author": {
				"name": "Guillaume Prevost",
				"email": "guillaume.prevost@rmit.edu.au"
			}
		},

		"dependencies": {
			"js": ["https://d3js.org/d3.v3.min.js",
			       "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/js/ion.rangeSlider.min.js"], // Ion Range Slider JS library
			"css": ["https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/css/ion.rangeSlider.min.css", // Ion Range Slider CSS
			        "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/css/ion.rangeSlider.skinHTML5.min.css"] // Ion Range Slider HTML5 Skin CSS
		},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("FESTO mini-factory sensors data visualiser initialisation");
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("FESTO mini-factory sensors data visualiser post-connection initialisation");

			var vizObj = this;

			// Add input where the timeline slider will be drawn
			var sliderInput = document.createElement("input");
			sliderInput.id = "graphTimeSlider-" + elementId;
			sliderInput.name = "range";
			sliderInput.type = "text";
			sliderInput.className = "range_time24";
		    $(contentId)[0].appendChild(sliderInput);


			// Set up time slider
			$("#graphTimeSlider-" + elementId).ionRangeSlider({
	          min: +moment().subtract(12, "hours").format("X"),
	          max: +moment().format("X"),
	          from: +moment().format("X"),
	          grid: true,
	          force_edges: true,
	          prettify: function(num) {
	            var m = moment(num, "X");
	            return m.format("Do MMMM, HH:mm:ss");
	          },
	          onFinish: function (data) {
	              //console.log(data.from); // data.from gets the selected timestamp
	        	  vizObj.updateSensorsDisplay(this, elementId, contentId, graphs[elementId].nodes, vizObj.sensorData, $("#graphTimeSlider-" + elementId).prop("value") * 1000);
	          }
	        });
			// Saves the time slider in a variable to be able to call public methods on it
			this.graphTimeSlider = $("#graphTimeSlider-" + elementId).data("ionRangeSlider");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("FESTO mini-factory sensors data visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			var vizObj = this;

			var res = JSON.parse(data.body);
			//console.log(res.terms);

			// Append new sensor data to previously received sensor data, sorted by IDs
			if (res.terms != null) {
				res.terms.forEach(function(sensorEvent) {
	      			vizObj.updateSensorsData(this, sensorEvent);
	      		});
			}
			else {
				this.updateSensorsData(res);
			}
			//console.log(this.sensorData);


			// Updates the fill color of the nodes based using the new data received
			if (graphs[elementId] != null && graphs[elementId].nodes != null & graphs[elementId].nodes.length > 0) {
				//console.log(graph[elementId]);
				this.updateSensorsDisplay(this, elementId, contentId, graphs[elementId].nodes, this.sensorData, $("#graphTimeSlider-" + elementId).prop("value") * 1000);
			}

			// Updates the slider boundaries based on the boundaries of all the data received
			//console.log(this.minTimestamp);
			//console.log(this.maxTimestamp);
			this.updateSliderRange(this.graphTimeSlider, this.minTimestamp / 1000, this.maxTimestamp / 1000);
		},
		/************** END OF METHODS REQUIRED FOR VISUALISER ****************/

		updateSensorsData: function(source, sensorEvent) {
			//sensorData.push(sensorEvent);
			if (this.sensorData[sensorEvent.owner] == null)
				this.sensorData[sensorEvent.owner] = new Array();
			this.sensorData[sensorEvent.owner].push(sensorEvent);

			if (sensorEvent.timepoint.timepoint < this.minTimestamp || this.minTimestamp == null)
				this.minTimestamp = sensorEvent.timepoint.timepoint;
			if (sensorEvent.timepoint.timepoint > this.maxTimestamp || this.maxTimestamp == null)
				this.maxTimestamp = sensorEvent.timepoint.timepoint;
		},

		updateSliderRange: function(timeSlider, minTimestamp, maxTimestamp) {
			var diff = maxTimestamp - minTimestamp;
			//console.log("min = " +minTimestamp);
			//console.log("max = " +maxTimestamp);
			//console.log("diff = " +diff);

			timeSlider.update({
				min: minTimestamp - diff,
				max: maxTimestamp + diff
			});
		},

		updateSensorsDisplay: function(source, elementId, contentId, nodeList, sensorEventData, timestamp) {
			//console.log("UPDATTESENSORSDISPLAY");
			//console.log(nodeList);
			//console.log(sensorEventData);
			//console.log(timestamp);

			// Iterate through each node of the graph
			nodeList.forEach(function (node) {
				// Retrieve in sensorData the latest data BEFORE required timestamp for that node
				var latestSensorEvent = null;
				var sensorsEventList = sensorEventData[node.id];
				if (sensorsEventList != null) {
					sensorsEventList.forEach(function (sensorEvent) {
						//console.log("SENSOR EVENT: " + sensorEvent.owner + " " + sensorEvent.timepoint.timepoint + " " + sensorEvent.value);
						if ((sensorEvent.timepoint.timepoint < timestamp) && ((latestSensorEvent == null) || (latestSensorEvent.timepoint.timepoint < sensorEvent.timepoint.timepoint))) {
							latestSensorEvent = sensorEvent;
						}
					});
					//console.log("LATEST SENSOR DATA AFTER " + timestamp);
					//console.log(latestSensorEvent);

					// Set D3 graph node color according to latest status (GREEN=ON, RED=OFF, GREY=NODATA)
					d3.select(contentId).select("#graph-" + elementId + "-node" + node.index)
					.style("fill",  function (n) {
						var color = "lightgrey";
						if (latestSensorEvent != null && latestSensorEvent.value == "High")
							color = "#27AE60";
						else if (latestSensorEvent != null && latestSensorEvent.value == "Low")
							color = "#C0392B";

						//console.log(color);
						return color;
					});
				}
			});
		}
}
