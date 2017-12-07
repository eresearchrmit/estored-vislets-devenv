/*
* Neo4J Graph under JSON format visualiser as an interactive Graph
*/
var dataElementVisualiser = {

	"meta": {
		"id": "json-neo4j-as-interactive-graph",
		"version": "1.0",
		"handled-data-types": ["application/json"],
		"name": "Neo4J Interactive Graph",
		"description": "Interactive visualisation of a Neo4J graph in JSON format. \
		Allows zooming , panning, showing nodes and edges details, etc. Useful to \
		view results of queries to a Neo4J database.",
		"author": {
			"name": "Guillaume Prevost",
			"email": "guillaume.prevost@rmit.edu.au"
		}
	},

	"dependencies": {
		"js": ["https://d3js.org/d3.v3.min.js"],
		"css": []
	},

	inlineCss: " \
	circle.fixed { \
		stroke: red; \
		stroke-width: 4px; \
	} \
	circle.highlighted { \
		stroke: #000; \
		stroke-width: 3px; \
	} \
	circle.faded { \
		opacity: 0.2; \
	} \
	line.link { \
		opacity: 1; \
		fill: none; \
		stroke: #000; \
		stroke-width: 2px; \
		cursor: default; \
	} \
	line.highlighted { \
	} \
	line.faded { \
		opacity: 0.05; \
	} \
	div.graphTooltip, div.instructionsTooltip { \
		position: absolute; \
		width: 40%; \
		padding: 5px; \
		color: rgb(115, 135, 156); \
		background-color: #fff; \
		border: 1px solid rgb(42, 63, 84); \
		border-radius: 10px 10px 10px 10px; \
		-moz-border-radius: 10px 10px 10px 10px; \
		-webkit-border-radius: 10px 10px 10px 10px; \
		-webkit-box-shadow: 2px 2px 18px 0px rgba(0,0,0,0.75); \
		-moz-box-shadow: 2px 2px 18px 0px rgba(0,0,0,0.75); \
		box-shadow: 2px 2px 18px 0px rgba(0,0,0,0.75); \
		overflow: scroll; \
		max-height: 300px; \
	}",

	instructionsInfos: "<p>COMMANDS:</p><ul> \
	<li><strong>Scroll</strong>: zoom in/out</li> \
	<li><strong>Drag background</strong>: pan the view</li> \
	<li><strong>Hover node</strong>: highlight and show node name</li> \
	<li><strong>Hover link</strong>: highlight and show link name</li> \
	<li><strong>Click node</strong>: release anchored node (marked with red circles)</li> \
	<li><strong>Drag node</strong>: move node and anchors it</li> \
	<li><strong>Right-click node</strong>: show node details</li> \
	<li><strong>Double-click anywhere</strong>: reset zoom & pan </li> \
	</ul> <p class='text-center'>- Click to close -</p>",

	initialiseVisualiser: function (elementId, contentId) {
		console.log("JSON Graph visualiser initialisation");

		$("style#inlineStyle-" + elementId).remove();
		var inlineStyle = document.createElement("style");
		inlineStyle.id += "inlineStyle-" + elementId;
		inlineStyle.innerHTML += this.inlineCss;
		$("head")[0].appendChild(inlineStyle);

		// Add canvas where the graph will be drawn
		var graphDiv = document.createElement("div");
		graphDiv.id = "graphTooltip-" + elementId;
		graphDiv.className = "graphTooltip";
		graphDiv.width = "100%";
		$(contentId)[0].appendChild(graphDiv);
		$("#graphTooltip-" + elementId).hide();

		var instructionsDiv = document.createElement("div");
		instructionsDiv.id = "instructionsTooltip-" + elementId;
		instructionsDiv.className = "instructionsTooltip pull-right";
		$(contentId)[0].appendChild(instructionsDiv);
		$("#instructionsTooltip-" + elementId).hide();
		$("#instructionsTooltip-" + elementId).html(this.instructionsInfos);

		var infoIcon = document.createElement("i");
		infoIcon.id = "infoIcon-" + elementId;
		infoIcon.className = "fa fa-info-circle pull-right";
		$(contentId)[0].appendChild(infoIcon);
		$("#infoIcon-" + elementId).click(function () {
			$("#instructionsTooltip-" + elementId).show() }
		);
		$("#instructionsTooltip-" + elementId).click(function () {
			$("#instructionsTooltip-" + elementId).hide() }
		);

		var statsDiv = document.createElement("div");
		statsDiv.id = "stats-" + elementId;
		$(contentId)[0].appendChild(statsDiv);
	},

	initialiseVisualiserPostConnection: function (elementId, contentId) {
		console.log("JSON Graph visualiser Post-Connection initialisation");
	},

	visualiseData: function (elementId, contentId, data) {
		console.log("JSON Graph visualiser code executed");
		data.body = atob(data.body);
		//console.log(data);

		// CONSTRUCT D3 GRAPH WITH 'NODES' AND 'RELATIONSHIPS' FROM NEO4J GRAPH FORMAT
		var res = JSON.parse(data.body);
		//console.log(res);
		var nodes = [], links = [];

		function addRowToGraph(row) {
			row.nodes.forEach(function (n) {

				function graphIdToIndex(nodes, id) {
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].id == id)
						return i;
					}
					return null;
				}

				if (graphIdToIndex(nodes, n.id) == null) {
					var nodeTitles = new Array();
					// Properties keys to look for to fill in node title
					var propertyKeys = ["title", "name", "fullname", "full_name"]
					for (var i = 0; i < propertyKeys.length; i++) {
						if (propertyKeys[i] in n.properties)
						nodeTitles.push(n.properties[propertyKeys[i]]);
					}
					if (nodeTitles.length == 0) // Pushes the ID as a default title if none other found
					nodeTitles.push(n.id);
					if (n.type != undefined)
					nodeTitles.push(n.type); // Pushes type if it exists
					nodes.push({id: n.id, type: n.type, title: nodeTitles.join(" - "), labels: n.labels, properties: n.properties});
				}
			});

			links = links.concat(row.relationships.map(function(r) {
				function graphIdToIndex(nodes, id) {
					for (var i = 0; i < nodes.length; i++) {
						if (nodes[i].id == id)
						return i;
					}
					return null;
				}

				if (r.from != undefined && r.to != undefined) {
					return {source: graphIdToIndex(nodes, r.from), target: graphIdToIndex(nodes, r.to), type: r.type};
				}
				else if (r.startNode != undefined && r.endNode != undefined) {
					return {source: graphIdToIndex(nodes, r.startNode), target: graphIdToIndex(nodes, r.endNode), type: r.type};
				}
			}));
		}

		if (Array.isArray(res)) {
			res.forEach(function (row) {
				addRowToGraph(row)
			});
		}
		else {
			addRowToGraph(res);
		}

		var graph = { nodes:nodes, links:links };	//console.log(graph);
		// Displays the total numner of noes and links in the parsed graph
		$("#stats-" + elementId).html("<p><strong>Total: </strong>" + graph.nodes.length + " nodes, " + graph.links.length + " edges</p>");

		// Clears SVG if there was one already
		unsetFocus();
		d3.select(contentId).selectAll("svg").remove();

		var width = 800, height = 400;
		var color = d3.scale.category20();
		var nodeFocus = false;

		var zoomHandler = function () {
			svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
		};
		var zoom = d3.behavior.zoom();
		var zoomListener = zoom.on("zoom", zoomHandler);

		// Setup SVG div
		var svg = d3.select(contentId)
		.append("svg")
		.attr("id", "dataElementGraph-" + elementId)
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", "0 0 " + width + " " + height)
		.attr("preserveAspectRatio", "xMidYMid meet")
		.attr("pointer-events", "all")
		.on("click", unsetFocus)
		.on("dblclick", resetScaleAndZoom)
		.call(zoomListener).on("dblclick.zoom", null)
		.append("g");

		// Re-size D3 graph when window is re-sized
		var graphElement = $("#dataElementGraph-" + elementId);
		var aspect = graphElement.width() / graphElement.height();
		var graphContainer = graphElement.parent();
		$(window).on("resize", function() {
			var targetWidth = graphContainer.width();
			graphElement.attr("width", targetWidth);
			graphElement.attr("height", Math.round(targetWidth / aspect));
		}).trigger("resize"); // Initial trigger to fit current window size

		// Force-directed graph layout setup
		var force = d3.layout.force()
			.nodes(graph.nodes)
			.links(graph.links)
			.charge(-200)
			.linkDistance(200)
			.size([width, height])
			.start();

		// Defines the handlers for dragging interactions with the force graph
		var drag = force.drag()
		.on("dragstart", nodeDragstart)
		.on("drag", nodeDrag)
		.on("dragend", nodeDragEnd);

		// Define arrow markers for graph links
		svg.append('svg:defs').append('svg:marker')
		    .attr('id', 'end-arrow')
		    .attr('viewBox', '0 -5 10 10')
		    .attr('refX', 9)
		    .attr('markerWidth', 15)
		    .attr('markerHeight', 15)
		    .attr('orient', 'auto')
		  .append('svg:path')
		    .attr('d', 'M0,-1.5L3,0L0,1.5')
		    .attr('fill', '#000');

		// Render links as lines
		var link = svg.selectAll(".link")
		.data(graph.links).enter()
		.append("line")
		.on("mouseover", linkOver)
		.on("mouseout", linkOut)
		.attr("class", "link")
		.style('marker-end', 'url(#end-arrow)'); // Uses arrow markers defined above

		// Render nodes as circles, css-class & fill color from labels
		var node = svg.selectAll(".node")
		.data(graph.nodes).enter()
		.append("circle")
		.on("mouseover", nodeOver)
		.on("mouseout", nodeOut)
		.on("contextmenu", nodeRightClick)
		.on("click", nodeClick)
		.attr("class", function (node) {
			if (node.labels) {
				return "node " + node.labels.join(" ");
			}
			return "node";
		})
		.attr("r", 20)
		.style("fill", function(d) {
			if (d.type)
				return color(d.type);
			else if (d.labels)
				return color(d.labels[0]);
			else
				return "grey";
		})
		.call(drag);

		// Re-calculation of coordinates on each tick
		force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });
			node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
		});

		/*
		 * Handler for a click on a node. Toggles whether the node is anchored or
		 * not and remove the highlight of the node.
 		 */
		function nodeClick(d) {
			if (d3.event.defaultPrevented) return;
			// Toggles whether the node is anchored or not
			d.fixed = !(d3.select(this).classed("fixed"));
			d3.select(this).classed("fixed", d.fixed);
			nodeOut();
			$("#graphTooltip-" + elementId).hide(200);
		}

		/*
		 * Handler for the start of the dragging of a node. Stops the propagation
		 * of the "start drag" event so that the view isn't panned when dragging a
		 * node.
 		 */
		function nodeDragstart(d) {
			d3.event.sourceEvent.stopPropagation();
		}

		/*
		 * Handler for the drag of a node. Moves the node and the label next to it
		 * to follow the movement of the mouse.
 		 */
		function nodeDrag(d) {
			d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
			d3.selectAll(".hoverLabel").attr("x", d.x = d3.event.x + 30).attr("y", d.y = d3.event.y);
		}

		/*
		 * Handler for the end of the dragging of a node. Fixes the node so that it
		 * is anchored (not dependent on the force-directed graph)
 		 */
		function nodeDragEnd(d) {
			if (d3.event.sourceEvent.defaultPrevented) return;
			d3.event.sourceEvent.preventDefault();
			// Anchors the dragged node
			d.fixed = true;
			d3.select(this).classed("fixed", d.fixed);
		}

		/*
		 * Handler for hovering on a node. Highlights it and its neighbours, fade
		 * all other nodes and links, and adds a Title label near it
 		 */
		function nodeOver(d) {
			if (nodeFocus) return;  // No hover action if a node is in focus

			// Highlights node and its neighbours, fade all other nodes
			highlightNeighbours(d);

			// Add a "Title" label near the node
			d3.select(this.parentNode).append("text")
			.attr({
				"x": d.x + 30,
				"y": d.y,
				"class": "hoverLabel",
				"stroke": "black"
			})
			.style("opacity", .9)
			.style("pointer-events", "none")
			.html(d.title);

		}

		/*
		 * Handler for stopping hovering on a node.
 		 */
		function nodeOut() {
			if (nodeFocus) return; // No hover action if a node is in focus
			removeHighlight();
		}

		/*
		 * Handler for hovering on a link. Highlights it and its neighbours, fade
		 * all other nodes and links, and adds a Title label near it
 		 */
		function linkOver(d) {
			if (nodeFocus) return; // No hover action if a node is in focus

			// Highlight the neighbours nodes, fade the others
			d3.select("#dataElementGraph-" + elementId).selectAll("circle.node").each(function(n) {
				var isNodeNeighbour = (n.id == d.source.id || n.id == d.target.id);
				d3.select(this).classed("highlighted", isNodeNeighbour);
				d3.select(this).classed("faded", !isNodeNeighbour);
			});

			// Highlight the link
			d3.select(this).classed("highlighted", true);
			// Fade other links
			d3.select("#dataElementGraph-" + elementId).selectAll("line.link").each(function(l) {
				d3.select(this).classed("faded", (l.source.id != d.source.id || l.target.id != d.target.id));
			});

			// Add "Title" label near the link
			d3.select(this.parentNode).append("text")
			.attr({
				"x": ((d.source.x + d.target.x) / 2) + 30,
				"y": (d.source.y + d.target.y) / 2,
				"class": "hoverLabel",
				"stroke": "black",
				"stroke-width": "1"
			})
			.style("opacity", .9)
			.style("pointer-events", "none")
			.html(d.type);
		}

		/*
		 * Handler for stopping hovering on a link.
 		 */
		function linkOut() {
			if (nodeFocus) return; // No hover action if a node is in focus
			removeHighlight();
		}

		/*
		 * Handler for right-clicking on a node.
 		 */
		function nodeRightClick(d, i) {
			d3.event.preventDefault(); // Prevents standard contextual menu to show

			// Sets the focus to the node right-clicked
			nodeOver(d, i, this);
			nodeFocus = true;

			// Adds title and attribute of selected node in Tooltip
			var newContent = "<p><strong>" + d.title;
			if (d.labels !== undefined && d.labels.length > 0)
				newContent += " (" + d.labels[0] + ")";
			newContent += "</strong></p><p>ID: " + d.id + "</p>";
			newContent += "<p><strong>Attributes:</strong></p><p><ul>";
			for (x in d.properties)
				newContent += "<li>" + x + ": " + d.properties[x]+ "</li>";
			newContent += "</ul></p><p><strong>Connections:</strong></p><ul>";

			// Adds infos from links between this node and its neighbours in Tooltip
			var neighbours = findNeighbours(d);
			var uniqueLinks = _.uniq(neighbours.links, false, function(link) {
				return (link.source.id + "" + link.target.id);
			});
			_.each(uniqueLinks, function(l) {
				newContent += "<li>" + l.source.title + " ";
				if (l.source.labels !== undefined && l.source.labels.length > 0)
					newContent += "(" + l.source.labels[0] + ")";
				newContent += "-> <strong>" + l.type + "</strong> -> " + l.target.title;
				if (l.target.labels !== undefined && l.target.labels.length > 0)
					newContent += " (" + l.target.labels[0] + ")";
				newContent += "</li>";
			});
			newContent += "</ul></p>";

			// Updates content and shows the Tooltip
			$("#graphTooltip-" + elementId).html(newContent);
			$("#graphTooltip-" + elementId).show(200);
		}

		/*
		 * Return a subset of the D3js graph from a given node. The subset contains
		 * all links involving this node and all neighbour nodes.
		 */
		function findNeighbours(node) {
			neighbourArray = [node];
			var linksArray = [];

			d3.select("#dataElementGraph-" + elementId)
				.selectAll("line.link")
				.filter(function(link) {
					return link.source == node || link.target == node
				})
				.each(function(link) {
					neighbourArray.indexOf(link.source) == -1 ? neighbourArray.push(link.source) : null;
					neighbourArray.indexOf(link.target) == -1 ? neighbourArray.push(link.target) : null;
					linksArray.push(link);
				});
			return { nodes: neighbourArray, links: linksArray };
		}

		/*
		 * Highlights the given node and is direct neighbour nodes and links.
		 * Fades all the other nodes in the graph
		 */
		function highlightNeighbours(d) {
			var nodeNeighbours = findNeighbours(d);

			d3.select("#dataElementGraph-" + elementId)
				.selectAll("circle.node").each(function(n) {
					var isNodeNeighbour = nodeNeighbours.nodes.indexOf(n) > -1;
					d3.select(this).classed("highlighted", isNodeNeighbour);
					d3.select(this).classed("faded", !isNodeNeighbour);
				});

			d3.select("#dataElementGraph-" + elementId)
				.selectAll("line.link").each(function(l) {
					var isLinkNeighbour = nodeNeighbours.links.indexOf(l) > -1;
					d3.select(this).classed("highlighted", isLinkNeighbour);
					d3.select(this).classed("faded", !isLinkNeighbour);
			});
		}

		/*
		 * Removes all highlights and fade effects from all nodes and all links.
		 * Removes the Title label for nodes and links (class .hoverLabel)
		 */
		function removeHighlight() {
			// Remove hover label
			d3.select("#dataElementGraph-" + elementId)
				.selectAll(".hoverLabel")
				.remove();

			// Remove highlight and fade classes for all nodes
			d3.select("#dataElementGraph-" + elementId)
				.selectAll("circle.node")
				.classed("highlighted", false)
				.classed("faded", false);

			// Remove highlight and fade classes for all links
			d3.select("#dataElementGraph-" + elementId)
				.selectAll("line.link")
				.classed("highlighted", false)
				.classed("faded", false);
		}

		/*
		 * Resets the SVG viewport zoom and pan to initial values
		 */
		function resetScaleAndZoom() {
			zoom.scale(1);
			zoom.translate([0, 0]);
			svg.attr("transform", "translate(0,0)" + " scale(1)");
		}

		/*
		 * Removes focus, remove highlights and fade, and closes the info tooltip
		 */
		function unsetFocus() {
			nodeFocus = false; // Remove focus from any node
			removeHighlight(); // Removes highlights from all nodes and links
			$("#graphTooltip-" + elementId).hide(200); // Hides the info tooltip
		}

	}
};
