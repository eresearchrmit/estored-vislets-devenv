/*
 * CSV MAT Grid Visualiser
 *
 * Copyright 2017, RMIT University
 * Author: Guillaume Prevost <guillaume.prevost@rmit.edu.au>
 * Since: 03/08/2017
 */
var dataElementVisualiser = {

	simData: {},
	simWidth: -1,
	simHeight: -1,
	headers: null,
	graphTimeSlider : null,
	isPlaying: false,

		/**************** REQUIRED FOR VISUALISER ******************/

		"meta": {
			"id": "csv-mat-as-cells-grid",
			"version": "1.0",
			"handled-data-types": ["text/csv"],
			"name": "CSV MAT Simulation as Cells Grid",
			"description": "Displays the results of a Open Modelica simulation from \
			MAT data. Shows a grid as the state of the simulation for a step, and \
			provides a slider to move between the simulation steps.",
			"author": {
				"name": "Guillaume Prevost",
				"email": "guillaume.prevost@rmit.edu.au"
			}
		},

		"dependencies": {
			"js": ["https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js", // http://papaparse.com - LICENCE: The MIT License (MIT). Copyright (c) 2015 Matthew Holt.
			       "https://d3js.org/d3.v2.min.js", // D3.js
			       "https://cdnjs.cloudflare.com/ajax/libs/bootstrap-slider/9.8.1/bootstrap-slider.min.js"], // https://github.com/seiyria/bootstrap-slider Bootstrap Slider JS library - LICENSE: The MIT License Copyright (c) 2017 Kyle Kemp, Rohit Kalkur, and contributors.
			"css": ["https://cdnjs.cloudflare.com/ajax/libs/bootstrap-slider/9.8.1/css/bootstrap-slider.min.css"], // https://github.com/seiyria/bootstrap-slider Bootstrap Slider CSS - LICENSE: The MIT License Copyright (c) 2017 Kyle Kemp, Rohit Kalkur, and contributors.
		},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("CSV MAT Grid Visualiser initialisation");
			simData = {};
			simWidth = -1;
			simHeight = -1;
			headers = null;
			graphTimeSlider = null;
			isPlaying = false;

		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("CSV MAT Grid Visualiser Post-Connection initialisation");
			$("#graphTimeSlider-" + elementId).hide();

			var vizObj = this;
			
			// Create the simulation time label
			var timeInfo = document.createElement("div");
			timeInfo.id = "timeInfo";
			$(contentId)[0].appendChild(timeInfo);

			// Create the input that will be used for slider
			var sliderInput = document.createElement("input");
			sliderInput.name = "range";
			sliderInput.type = "text";
			sliderInput.style = "width: 100%";
			$(contentId)[0].appendChild(sliderInput);

			// Creates the slider
			this.graphTimeSlider = $(sliderInput).bootstrapSlider({
				id: "graphTimeSlider-" + elementId,
				min: 0,
				max: 10,
				step: 1,
				value: 5
			});
			$("#graphTimeSlider-" + elementId).hide();

			// Handler of 'slide' and 'slideStop' event
			// Updates the display
			var slideChangeHandler = function(slideEvent) {
				if (slideEvent.value != this.shownValue) {
					this.shownValue = slideEvent.value;
					vizObj.updateDisplay(elementId, contentId, slideEvent.value);
				}
			};

			this.graphTimeSlider.on("slide", slideChangeHandler);
			this.graphTimeSlider.on("slideStop", slideChangeHandler);
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("CSV MAT Grid Visualiser code executed");

			var vizObj = this;
			data.body = atob(data.body);
			this.simData = data.body.split('\n');
			//console.log(data);

			// Remove all previous visualisation when new data is received
			d3.select(contentId).selectAll("svg").remove();

			// Parse the first 2 lines of received CSV content
			// 1st line: headers, 2nd line: step 0
			var results = Papa.parse(data.body, {
				delimiter: ",",
				newline: "\n",
				header: false,
				skipEmptyLines: true,
				preview: 2
			});
			//console.log("FIRST 2 LINES SPLIT", results);

			// Extracts the 1st row as headers
			this.headers = results.data[0];
			_.each(this.headers, function(header, i) {
				header.replace(",", "][");
			});
			console.log(this.headers);

			results.data.shift();

			// Gets the dimensions of the simulation grid using the coordinates present in the last header
			var lastHeader = this.headers[this.headers.length - 1]; // Get last header as string
			var numberPattern = /\d+/g; // Match any number
			var matches = lastHeader.match(numberPattern);
			this.simWidth = parseInt(matches[0]); // interpret the first number found as the grid width
			this.simHeight = parseInt(matches[1]); // interpret the second number found as the grid height
			console.log("W: ", this.simWidth, " H: ", this.simHeight);

			// Create new SVG to display the simulation grid
			var width = 800, height = 400;
			var cellsize = 15;
			var colors = d3.scale.category10();
			var svg = d3.select(contentId)
			.append("svg")
			.attr("id", "dataElementGrid-" + elementId)
			.attr("width", width)
			.attr("height", height)
			.attr("viewBox", "0 0 " + width + " " + height)
				.attr("preserveAspectRatio", "xMidYMid meet")
			.append("g");

			// Re-size D3 SVG when window is re-sized
			var gridElement = $("#dataElementGrid-" + elementId);
		    var aspect = gridElement.width() / gridElement.height();
		    var gridContainer = gridElement.parent();
			$(window).on("resize", function() {
			    var targetWidth = gridContainer.width();
			    gridElement.attr("width", targetWidth);
			    gridElement.attr("height", Math.round(targetWidth / aspect));
			}).trigger("resize");

			// Updates the Slider
			this.graphTimeSlider.bootstrapSlider('setAttribute', 'min', 0);
			this.graphTimeSlider.bootstrapSlider('setAttribute', 'max', Object.keys(this.simData).length - 2);
			this.graphTimeSlider.bootstrapSlider('setValue', 0);

			this.updateDisplay(elementId, contentId, this.graphTimeSlider.bootstrapSlider("getValue"));
			$("#graphTimeSlider-" + elementId).show();
		},

		/************** END OF METHODS REQUIRED FOR VISUALISER ****************/
		updateDisplay: function(elementId, contentId, stepNumber) {
			//console.log("UPDATE GRID", elementId, contentId, stepNumber);

			// Clear SVG rows if there was one already
			d3.select(contentId).selectAll("svg").selectAll(".row").remove();

			var cellsize = 15;
			var simStep = this.simData[stepNumber + 1];
			//console.log(simStep, stepNumber);

			var parsedStep = simStep.split(',');
			//console.log("PARSEDSTEP", parsedStep);

			var numberPattern = /\d+/g; // Match any number
			var stepTime = -1;

			var stepGrid = new Array();
			for (var i = 0; i < this.simWidth; i++) {
				stepGrid[i] = new Array();
			}

			_.each(this.headers, function(header, i) {
				if (header == 'time')
					stepTime = parsedStep[i];
				if (header.endsWith('.C')) {
					var matches = header.match(numberPattern);
					//console.log("stepGrid", matches[0], matches[1], "=", parsedStep[i]);
					stepGrid[matches[0] - 1][matches[1] - 1] = parsedStep[i];
				}
			});
			//console.log("STEPGRID ", stepGrid);
			//console.log("STEPTIME ", stepTime);

			$("#timeInfo").html("Simulation time: " + stepTime+ "s");

			var row = d3.select(contentId).selectAll("svg").selectAll(".row")
		    .data(stepGrid)
		    .enter().append("g")
		    .attr("class", "row");

			var column = row.selectAll(".square")
			.data(function(d) { return d; })
			.enter().append("rect")
			.attr("class","square")
			.attr("x", function(d, i, j) { return (i + 1) * cellsize; })
			.attr("y", function(d, i, j) { return (j + 1) * cellsize; })
			.attr("width", function(d) { return cellsize - 2; })
			.attr("height", function(d) { return cellsize - 2; })
			.attr("rx", function(d) { return cellsize / 5; })
			.attr("ry", function(d) { return cellsize / 5; })
			.style("fill", function(d) {
				if (d > 0)
					return "#2C93E8";
				else if (d < 0)
					return "orange";
				else return "#FFFFFF";
				})
			.style("stroke", "#222")
			.on("click", function(d, i, j) { console.log(d, i, j) });
		}
}
