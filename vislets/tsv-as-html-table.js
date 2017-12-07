/*
 * TSV Visualiser
 */
var dataElementVisualiser = {

	"meta": {
		"id": "tsv-as-html-table",
		"version": "1.0",
		"handled-data-types": ["text/tab-separated-values"],
		"name": "TSV as HTML Table",
		"description": "Displays Tab-separated-values (TSV) data as an HTML table.",
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
			console.log("TSV Visualiser initialisation");
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("TSV Visualiser Post-Connection initialisation");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("TSV Visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			// Parse the received CSV content
			var results = Papa.parse(data.body, {
				delimiter: "\t",
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
