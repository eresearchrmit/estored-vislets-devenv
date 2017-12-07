/*
 * CSV Visualiser
 */
var dataElementVisualiser = {

	"meta": {
		"id": "csv-as-html-table",
		"version": "1.0",
		"handled-data-types": ["text/csv"],
		"name": "CSV as HTML table",
		"description": "Displays Coma-separated-values (CSV) data as an HTML table.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": ["https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js"], // http://papaparse.com - LICENCE: The MIT License (MIT). Copyright (c) 2015 Matthew Holt.
		"css": []
	},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("CSV Visualiser initialisation");
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("CSV Visualiser Post-Connection initialisation");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("CSV Visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			// Parse the received CSV content
			var results = Papa.parse(data.body, {
				delimiter: ",",
				newline: "\n",
				header: true,
				skipEmptyLines: true
			});

			// Generates HTML table based on CSV
			var html = '<table class="table table-bordered">';
			html += "<thead>";
			html += "<tr>";
			results.meta.fields.forEach(function getvalues(field) {
				html += "<th>" + field + "</th>";
			});
			html += "</tr>";
			html += "</thead>";

			results.data.forEach(function getvalues(row) {
			html += "<tbody>";
			html += "<tr>";
			results.meta.fields.forEach(function getvalues(field) {
				html += "<td>" + row[field] + "</td>";
			});
			html += "</tr>";
			html += "</tbody>";
			})

			html += "</table>";

			// Appends the generated HTML table to the data element
			$(contentId).append(html);
		}
}
