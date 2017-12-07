/*
 * JSON 2D chart Visualiser
 */
var dataElementVisualiser = {

	"meta": {
		"id": "json-as-2d-chart",
		"version": "1.0",
		"handled-data-types": ["application/json"],
		"name": "Visualiser",
		"description": "Picture visualiser, displaying the picture data into an \
		HTML img tag.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": ["https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.4.0/Chart.min.js"],
		"css": []
	},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("2D chart visualiser initialisation");

			// Add canvas where the line chart will be drawn
			this.lineChartCanvas = document.createElement("canvas");
			this.lineChartCanvas.style = "width: 100%; height: " + $(contentId).height() + "px";
			this.lineChartCanvas.id = "lineChart-" + elementId;
			$(contentId)[0].appendChild(this.lineChartCanvas);
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("2D chart visualiser post-connection initialisation");

			Chart.defaults.global.legend = { enabled: false };
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("2D chart visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			var d = JSON.parse(data.body);
			console.log(d);
			//this.dataElementData = this.dataElementData.concat(data.body);

			//var colorNames = Object.keys(this.chartColors);
			//console.log(colorNames);

			// If the parsed data has several arrays of values
			if (Array.isArray(d)) {
				var chartDataset = this.turquoiseTheme;
				chartDataset.data = d;
				this.drawChart(chartDataset);
			}
			else {
				$(contentId).html("The received data structure can not be handled.");
			}
		},

		lineChartCanvas: null,

		/*
		 * Draws a
		 */
		drawChart: function(chartDataset) {
			var chart = new Chart(this.lineChartCanvas, {
					type: 'line',
					data: {
						labels: chartDataset.data,
						datasets: [chartDataset]
					},
				})
			return chart;
		},

		turquoiseTheme: {
			backgroundColor: 'rgba(38, 185, 154, 0.31)',
			borderColor: "rgba(38, 185, 154, 0.7)",
			pointBorderColor: "rgba(38, 185, 154, 0.7)",
			pointBackgroundColor: "rgba(38, 185, 154, 0.7)",
			pointHoverBackgroundColor: "#fff",
			pointHoverBorderColor: "rgba(220,220,220,1)",
		},

		/*chartColors: {
			red: 'rgb(255, 99, 132)',
			orange: 'rgb(255, 159, 64)',
			yellow: 'rgb(255, 205, 86)',
			green: 'rgb(75, 192, 192)',
			blue: 'rgb(54, 162, 235)',
			purple: 'rgb(153, 102, 255)',
			grey: 'rgb(201, 203, 207)'
		}*/
}
