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
		 * List of nodes.
		 */
		self.nodes = [];
		
		/**
		 * List of edges.
		 */
		self.edges = [];
	};
	
	/**
	 * 
	 */
	Graph.prototype.initCanvas = function(canvas) {
		var self = this;
		self.canvas = canvas;
	};
	
	/**
	 * 
	 */
	Graph.prototype.redraw = function() {
		var self = this;
	};
	
	/**
	 * 
	 */
	Graph.prototype.setData = function() {
		var self = this;
	};
	
	
	/**
	 * Module exports.
	 */
	return {
		Graph: Graph
	};
	
}());
