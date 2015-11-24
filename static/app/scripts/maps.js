/**
 * Maps are the controllers of the drawing canvas.
 * 
 * @module
 * 
 * @requires paper.js
 * @requires app.globes.Globe
 * @requires app.graphs.Graph
 */
app.maps = (function() {
	
	"use strict";
	
	
	/**
	 * Class definition for maps.
	 * 
	 * @class
	 */
	var Map = function() {
		var self = this;
		
		/**
		 * The app.globes.Globe instance.
		 */
		self.globe = null;
		
		/**
		 * The app.graphs.Graph instance.
		 */
		self.graph = null;
		
		/**
		 * The <canvas> element.
		 */
		self.dom = null;
	};
	
	/**
	 * Inits the paper.js canvas.
	 * 
	 * @param The <canvas> element.
	 */
	Map.prototype.initCanvas = function(dom) {
		var self = this;
		self.dom = dom;
		
		self.dom.width = self.dom.parentNode.offsetWidth;
		self.dom.height = self.dom.parentNode.offsetHeight;
		
		/*paper.setup(self.dom);
		paper.project.currentStyle = {
			fontFamily: 'Fira Sans',
			fontSize: 12,
			strokeColor: 'black',
			strokeWidth: 1.5
		};*/
	};
	
	/**
	 * 
	 */
	Map.prototype.initGlobe = function() {
		var self = this;
		self.globe = new app.globes.Globe(self);
	};
	
	/**
	 * 
	 */
	Map.prototype.initGraph = function() {
		var self = this;
		self.graph = new app.graphs.Graph();
	};
	
	/**
	 * Redraws everything on the canvas.
	 */
	Map.prototype.redraw = function() {
		var self = this;
		
		if(self.globe) {
			self.globe.redraw();
		}
		
		// paper.view.draw();
	};
	
	
	/**
	 * Module exports.
	 */
	return {
		Map: Map
	};
	
}());
