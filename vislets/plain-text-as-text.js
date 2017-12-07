/*
 * Plain text visualiser
 */
var dataElementVisualiser = {

	"meta": {
		"id": "plain-text-as-text",
		"version": "1.0",
		"handled-data-types": ["text/plain"],
		"name": "Plain Text",
		"description": "Plain text visualiser, appending text when receiving it.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": [],
		"css": []
	},

	initialiseVisualiser: function (elementId, contentId) {
		console.log("Plain Text visualiser initialisation");
		$(contentId).css("word-wrap", "break-words");
	},

	initialiseVisualiserPostConnection: function (elementId, contentId) {
		console.log("Plain Text visualiser Post-Connection initialisation");
	},

	visualiseData: function (elementId, contentId, data) {
		console.log("Plain Text visualiser code executed");
		data.body = atob(data.body);
		//console.log(data);

		// Appends the message content to the data element
		var node = document.createTextNode(data.body + '\n');
		$(contentId).append(node);
	}
};
