/*
 * Image visualiser
 */
var dataElementVisualiser = {

	"meta": {
		"id": "image-as-simple-picture",
		"version": "1.0",
		"handled-data-types": ["image/*"],
		"name": "Image Visualiser",
		"description": "Picture visualiser, displaying the picture data into an \
		HTML img tag.",
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
		console.log("Image visualiser initialisation");
	},

	initialiseVisualiserPostConnection: function (elementId, contentId) {
		console.log("Image visualiser Post-Connection initialisation");
	},

	visualiseData: function (elementId, contentId, data) {
		console.log("Image visualiser code executed");
		console.log(data);

		// Removes previous image if it exists
		$(contentId + " img#img-" + elementId).remove();

		var imgContent = "data:" + data.headers['content-type'] + ";charset=utf-8;base64," + data.body;

		// Add canvas where the line chart will be drawn
		var image = document.createElement("img");
		image.style = "max-width: 100%; max-height: 100%";
		image.id = "img-" + elementId;
		image.title = data.headers['File Name'];
		image.src = imgContent;
		$(contentId)[0].appendChild(image);
	}
};
