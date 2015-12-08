/**
 * Graphs handle the linguistic information on the map, i.e. the language nodes
 * and the edges representing word flows between nodes.
 * 
 * @module
 * 
 * @requires paper.js
 */
app.graphs = (function() {
	
	"use strict";
	
	
	/**
	 * Class definition for graphs.
	 * 
	 * @class
	 */
	var Graph = function(map) {
		var self = this;
		self.map = map;
		
		/**
		 * The <canvas> element.
		 */
		self.canvas = null;
		
		/**
		 * Dict of nodes, the keys are ISO codes, the values are [] of
		 * latitudes and longitudes.
		 */
		self.nodes = {};
		
		/**
		 * List of edges.
		 */
		self.edges = [];
		self.undirected = [];
		self.directed = [];
	};
	
	/**
	 * Prepares the canvas the graph is to be drawn on.
	 * 
	 * @param The <canvas> element.
	 */
	Graph.prototype.initCanvas = function(canvas) {
		var self = this;
		self.canvas = canvas;
		
		self.context = self.canvas.getContext('2d');
		self.context.fillStyle = 'yellowgreen';
		self.context.font = '14px Fira Sans';
		
		/*paper.setup(self.canvas);
		paper.project.currentStyle = {
			fontFamily: 'Fira Sans',
			fontSize: 12,
			strokeColor: 'yellowgreen',
			strokeWidth: 1.5
		};*/
	};
	
	/**
	 * Redraws the graph <canvas>.
	 */
	Graph.prototype.redraw = function() {
		var self = this;
		var isoCode, coords;
		
		self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
		
		for(isoCode in self.nodes) {
			coords = self.map.globe.getCanvasCoords(
				self.nodes[isoCode][0], self.nodes[isoCode][1]
			);
			if(coords) {
				self.context.fillText(isoCode, coords[0], coords[1]);
			}
		}
		
		// paper.view.draw();
	};
	
	/**
	 * 
	 */
	Graph.prototype.setData = function(data) {
		var self = this;
		self.nodes = data.nodes;
		self.undirected = data.undirected;
		self.directed = data.directed;
		self.redraw();
	};
	
	
	/**
	 * Module exports.
	 */
	return {
		Graph: Graph
	};
	
}());
