/*
 * Plain text visualiser
 */
var dataElementVisualiser = {

	"meta": {
		"id": "plain-text-as-code",
		"version": "1.0",
		"handled-data-types": ["text/plain"],
		"name": "Source code visualiser",
		"description": "Source code visualiser, pretty-printed.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": ["https://cdnjs.cloudflare.com/ajax/libs/prettify/r298/prettify.min.js"],
		"css": ["https://jmblog.github.io/color-themes-for-google-code-prettify/themes/atelier-forest-light.min.css"]
	},

	initialiseVisualiser: function (elementId, contentId) {
		console.log("Code snippet visualiser initialisation");
		$(contentId).css("word-wrap", "break-words");
	},

	initialiseVisualiserPostConnection: function (elementId, contentId) {
		console.log("Code snippet visualiser Post-Connection initialisation");
	},

	// File extensions supported by default include:
	languages: ["bsh", "c", "cc", "cpp", "cs", "csh", "cyc", "cv", "htm", "html",
	"java",	"js", "m", "mxml", "perl", "pl", "pm", "py", "rb", "sh", "xhtml", "xml",
	"xsl"],

	visualiseData: function (elementId, contentId, data) {
		console.log("Code snippet visualiser code executed");
		data.body = atob(data.body);
		//console.log(data);

		var headers = data.headers;
		var extension = null;
		//console.log(headers);

		// If header headers['extension'] is defined
		if (headers != null && headers.extension != null) {
			extension = headers.extension;
			// Add language extension if not already in the list of languages
			if (!(_.contains(this.languages, extension))) {
				//console.log("Adding extension: " + extension);
				var script = document.createElement("script");
				script.type = "application/javascript";
				script.src = "https://cdnjs.cloudflare.com/ajax/libs/prettify/r298/lang-" + extension + ".min.js";
				script.onload = function() { $("#code-snippet-" + elementId).removeClass("prettyprinted"); prettyPrint(); }
				if (typeof script != "undefined") {
					document.getElementsByTagName("head")[0].appendChild(script);
					this.languages.push(extension);
				}
			}
		}
		//console.log(extension, this.languages);

		// Dynamically create tags:

		// Create 'pre' tag
		var snippetPre = document.createElement("pre");
		snippetPre.id = "code-snippet-" + elementId;
		snippetPre.className = "prettyprint";

		// Create 'code' tag within 'pre' tag (HTML5 convention)
		var snippetCode = document.createElement("code");
		if (extension != null)
			snippetCode.className = "language-" + extension;

		// Appends the data content to the 'code' tag'
		var text = document.createTextNode(data.body + '\n');
		$(snippetCode).append(text);

		snippetPre.appendChild(snippetCode);
		$(contentId)[0].appendChild(snippetPre);

		// Calls to prettyprint library
		$("#code-snippet-" + elementId).removeClass("prettyprinted");
		prettyPrint();
	}
};
