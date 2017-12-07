/*
 * JSON data from FESTO mini-factory visualiser as a graph
 */
var graphs = new Array();

var dataElementVisualiser = {

		//graph: null,
		elementId: null,

		width: 800,
		height: 400,
		nodeRadius: 20,
		nodeFocus: false,

		/**************** METHODS REQUIRED FOR VISUALISER ******************/

		"meta": {
			"id": "json-festo-topology-as-graph",
			"version": "1.0",
			"handled-data-types": ["application/json"],
			"name": "JSON FESTO topology as graph",
			"description": "Displays the topology of a FESTO mini-factory \
			represented as a directed graph of nodes and edges graph with D3.js.",
			"author": {
				"name": "Guillaume Prevost",
				"email": "guillaume.prevost@rmit.edu.au"
			}
		},

		"dependencies": {
			"js": ["https://d3js.org/d3.v3.min.js"], // D3.js library
			"css": []
		},

		initialiseVisualiser: function (elementId, contentId) {
			console.log("FESTO mini-factory topology visualiser initialisation");

			// Create a div element for the graph tooltip
		    var graphTooltip = document.createElement("div");
		    graphTooltip.id = "graphTooltip-" + elementId;
		    graphTooltip.className = "graphTooltip";
		    $(contentId)[0].appendChild(graphTooltip);
		    $("#graphTooltip-" + elementId).hide();
		},

		initialiseVisualiserPostConnection: function (elementId, contentId) {
			console.log("FESTO mini-factory topology visualiser post-connection initialisation");
		},

		visualiseData: function (elementId, contentId, data) {
			console.log("FESTO mini-factory topology visualiser code executed");
			data.body = atob(data.body);
			//console.log(data);

			this.elementId = elementId;
			var vizObj = this;

			var res = JSON.parse(data.body);
			//console.log(res);

			var nodes = [], links = [];
			// Extracts all the nodes referenced in all the Edges 'source' and 'target'
			res.terms.forEach(function (edge) {
				nodes.push(edge.source);
				nodes.push(edge.target);
			});
			nodes = this.uniqBy(nodes, JSON.stringify); // Removes duplicates from the list of nodes based on their ID

			// Local function that converts from Graph ID to index
			var graphIdToIndex = function(nodes, id) {
				for (var i = 0; i < nodes.length; i++) {
					if (nodes[i].id == id)
						return i;
				}
				return null;
			};

			// Convert the 'source' and 'target' objects to the index in the list of Node
			links = links.concat(res.terms.map(function(r) {
				if (r.source != undefined && r.target != undefined) {
					return {source: graphIdToIndex(nodes, r.source.id), target: graphIdToIndex(nodes, r.target.id), type: r.type, annotation: r.annotation};
				}
			}));

			//this.graph = {nodes:nodes, links:links};
			graphs[elementId] = {nodes:nodes, links:links};
			console.log(graphs[elementId]);

			// Clears SVG if there was one already
			$("#graphTooltip-" + elementId).hide(200);
			d3.select("#dataElementContent-" + elementId).selectAll("svg").remove();

			// Setup SVG div
			var svg = d3.select("#dataElementContent-" + elementId)
					.append("svg")
					.attr("id", "dataElementGraph-" + elementId)
					.attr("width", this.width)
					.attr("height", this.height)
					.attr("viewBox", "0 0 " + this.width + " " + this.height)
						.attr("preserveAspectRatio", "xMidYMid meet")
					.attr("pointer-events", "all")
					.on("click", function() { vizObj.nodeFocus = false; vizObj.nodeOut(this); $("#graphTooltip-" + elementId).hide(200); })
					.call(d3.behavior.zoom().on("zoom", function () {
					    svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
					}))
					.append("g");

			svg.append("svg:defs").selectAll("marker")
		    	.data(["end"])      // Different link/path types can be defined here
				.enter().append("svg:marker")    // This section adds in the arrows
				  .attr("id", String)
				  .attr("viewBox", "0 -5 10 10")
				  .attr("refX", this.nodeRadius + 7.5)
				  .attr("refY", 0)
				  .attr("markerWidth", 6)
				  .attr("markerHeight", 6)
				  .attr("orient", "auto")
				.append("svg:path")
				  .attr("d", "M0,-5L10,0L0,5");

			// Re-size D3 graph when window is re-sized
			var graphElement = $("#dataElementGraph-" + elementId);
		    var aspect = graphElement.width() / graphElement.height();
		    var graphContainer = graphElement.parent();
			$(window).on("resize", function() {
			    var targetWidth = graphContainer.width();
			    graphElement.attr("width", targetWidth);
			    graphElement.attr("height", Math.round(targetWidth / aspect));
			}).trigger("resize");

			// Force layout setup
			var force = d3.layout.force()
						.nodes(graphs[elementId].nodes)
						.links(graphs[elementId].links)
						.charge(-200)
						.linkDistance(200)
						.size([this.width, this.height])
						.start();

			var drag = force.drag()
	    		.on("dragstart", this.nodeDragstart)
	    		.on("drag", this.nodeDrag);

			// add the links and the arrows
			var link = svg.append("svg:g").selectAll("path")
			    .data(force.links()).enter()
			    .append("svg:path")
				//.attr("class", function(d) { return "link " + d.type; })
			    .attr("class", "link")
			    .attr("marker-end", "url(#end)")
			    .on("mouseover", function(d, i, e) {
	      			vizObj.linkOver(this, d, i, e);
	      		})
				.on("mouseout", function() {
	      			vizObj.linkOut(this);
	      		});

			// Render nodes as circles, css-class & fill color from labels
			var node = svg.selectAll(".node")
					.data(graphs[elementId].nodes).enter()
					.append("circle")
					.on("mouseover", function(d, i, e) {
						vizObj.nodeOver(this, d, i, e);
					})
		      		.on("mouseout", function() {
						vizObj.nodeOut(this);
					})
		      		.on("click", function(d, i) {
		      			vizObj.nodeClick(this, d, i);
		      		})
		      		.on("dblclick", function(d) {
		      			vizObj.nodeDblclick(this, d);
		      		})
		      		.attr("id", function (d) {
						return "graph-" + elementId + "-node" + d.index;
					})
					.attr("class", function (d) {
						if (d.labels) {
							var strLabels = " ";
							strLabels = d.labels.join(" ");
							return "node " + strLabels;
						}
						return "node";
					})
					.attr("r", this.nodeRadius)
					.style("fill", "lightgrey")
						.call(drag);

			// Re-calculation of coordinates on each tick
			force.on("tick", function() {

				link.attr("d", function(d) {
			        dr = 0;
			        "Msx,syAdr,dr 0 0,1 tx,ty";
			        return "M" +
			            d.source.x + "," +
			            d.source.y + "A" +
			            dr + "," + dr + " 0 0,1 " +
			            d.target.x + "," +
			            d.target.y;
			    });

				/*link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });*/

				node.attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y; });
			});
		},
		/************** END OF METHODS REQUIRED FOR VISUALISER ****************/

		uniqBy(a, key) {
			var seen = {};
			return a.filter(function(item) {
				var k = key(item);
				return seen.hasOwnProperty(k) ? false : (seen[k] = true);
			})
		},

		findNeighbors: function(d,i) {
			neighborArray = [d];
			var linkArray = [];
			var linksArray = d3.select("#dataElementGraph-" + this.elementId).selectAll("path.link").filter(function(p) {return p.source == d || p.target == d}).each(function(p) {
				neighborArray.indexOf(p.source) == -1 ? neighborArray.push(p.source) : null;
				neighborArray.indexOf(p.target) == -1 ? neighborArray.push(p.target) : null;
				linkArray.push(p);
			})
			return {nodes: neighborArray, links: linkArray};
		},

		highlightNeighbors: function(d,i) {
			var nodeNeighbors = this.findNeighbors(d,i);

			d3.select("#dataElementGraph-" + this.elementId).selectAll("circle.node").each(function(p) {
				var isNeighbor = nodeNeighbors.nodes.indexOf(p);
				d3.select(this)
					.style("opacity", isNeighbor > -1 ? 1 : .25)
					.style("stroke-width", isNeighbor > -1 ? 3 : 1)
					.style("stroke", isNeighbor > -1 ? "black" : "white")
			});

			/*d3.select("#dataElementGraph-[[${element.id}]]").selectAll("path.link")
				.style("stroke-width", function (d) {return nodeNeighbors.links.indexOf(d) > -1 ? 4 : 1})
				.style("opacity", function (d) {return nodeNeighbors.links.indexOf(d) > -1 ? 1 : .25});*/
		},

		nodeClick: function(eventSource, d, i) {
			d3.event.stopPropagation();
			this.nodeFocus = false;
			this.nodeOut(eventSource);
			this.nodeOver(eventSource, d, i, this);
			this.nodeFocus = true;

			$("#graphTooltip-" + this.elementId).hide(200);

			var newContent = "<p><strong>" + d.id + "</strong></p>";
			newContent += "<p><strong>Type:</strong></p><p>" + d.type + "</p>";

			newContent += "<p><strong>Connections:</strong></p><ul>";
            var neighbors = this.findNeighbors(d, i);
            for (x in neighbors.nodes) {
            	if (neighbors.nodes[x] != d) {
            		newContent += "<li>" + neighbors.nodes[x].id + " (" + neighbors.nodes[x].type + ")</li>";
            	}
            }
            newContent += "</ul></p>";

            $("#graphTooltip-" + this.elementId).html(newContent);
            $("#graphTooltip-" + this.elementId).show(200);
		},

		nodeDblclick: function(eventSource, d) {
			d3.event.stopPropagation();
			d3.select(eventSource).classed("fixed", d.fixed = false);
			this.nodeFocus = false;
			this.nodeOut(eventSource);

			$("#graphTooltip-" + this.elementId).hide(200);
		},

		nodeDragstart: function(d) {
			d3.event.sourceEvent.stopPropagation();
			d3.select(this).classed("fixed", d.fixed = true);
		},

		nodeDrag: function(d) {
			d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
			d3.selectAll(".hoverLabel").attr("x", d.x = d3.event.x + 30).attr("y", d.y = d3.event.y);
		},

		nodeOver: function(eventSource, d, i, e) {
			var el = eventSource;
			if (!d3.event.fromElement) {
				el = e;
			}
			if (this.nodeFocus) {
				return;
			}

			d3.select(el.parentNode).append("text")
				.attr({
					"x": d.x + 30,
					"y": d.y,
					"class": "hoverLabel",
					"stroke": "black"
				})
				.style("opacity", .9)
				.style("pointer-events", "none")
				.html(d.title);

			this.highlightNeighbors(d,i);
		},

		nodeOut: function(eventSource) {
			if (this.nodeFocus) {
				return;
			}

			d3.select("#dataElementGraph-" + this.elementId).selectAll(".hoverLabel").remove();

			d3.select("#dataElementGraph-" + this.elementId).selectAll("circle.node")
				.style("opacity", 1)
				.style("stroke", "#fff")
				.style("stroke-width", "1px");
		},

		linkOver: function(eventSource, d, i, e) {
			var el = eventSource;
			if (this.nodeFocus) {
				return;
			}

			// Highlight the link
			d3.select(el)
				.style("color", "black")
				.style("opacity", 1);

			// Add label for the link
			d3.select(el.parentNode).append("text")
				.attr({
					"x": ((d.source.x + d.target.x) / 2) + 30,
					"y": (d.source.y + d.target.y) / 2,
					"class": "hoverLabel",
					"stroke": "black",
					"stroke-width": "1"
				})
				.style("opacity", .9)
				.style("pointer-events", "none")
				.html(d.annotation.value);

			// Highlight the neighbours nodes
			d3.select("#dataElementGraph-" + this.elementId).selectAll("circle.node")
				.style("stroke-width", function (n) { return (n.id == d.source.id || n.id == d.target.id) ? 3 : 1; })
				.style("stroke", function (n) { return (n.id == d.source.id || n.id == d.target.id) ? "black" : "white"; })
				.style("opacity", function (n) { return (n.id == d.source.id || n.id == d.target.id) ? 1 : .25; });
		},

		linkOut: function(eventSource) {
			this.nodeOut(eventSource);
		}
}
