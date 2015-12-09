/**
 * A Map is made out of a Globe and a Graph.
 * 
 * @module
 * 
 * @requires app.globes.Globe
 * @requires app.graphs.Graph
 */
app.maps = (function() {
	
	"use strict";
	
	
	/**
	 * Class definition for maps.
	 * 
	 * @class
	 * @param The dom element that will be the map.
	 */
	var Map = function(dom) {
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
		 * The parent node of the <canvas> elements.
		 */
		self.dom = dom;
		
		/**
		 * The Viewport instance.
		 */
		self.viewport = new Viewport(self);
		self.viewport.attachEvents();
	};
	
	/**
	 * Inits the map's globe instance.
	 */
	Map.prototype.initGlobe = function() {
		var self = this;
		self.globe = new app.globes.Globe(self);
		
		var canvas = document.createElement('canvas');
		
		// make sure it is the first child
		if(self.dom.children.length) {
			self.dom.insertBefore(canvas, self.dom.firstChild);
		}
		else {
			self.dom.appendChild(canvas);
		}
		
		canvas.width = self.dom.offsetWidth;
		canvas.height = self.dom.offsetHeight;
		canvas.classList.add('globe');
		
		self.globe.initCanvas(canvas);
		self.globe.setData(EARTH);
	};
	
	/**
	 * 
	 */
	Map.prototype.initGraph = function() {
		var self = this;
		self.graph = new app.graphs.Graph(self);
		
		var canvas = document.createElement('canvas');
		self.dom.appendChild(canvas);
		canvas.width = self.dom.offsetWidth;
		canvas.height = self.dom.offsetHeight;
		canvas.classList.add('graph');
		
		self.graph.initCanvas(canvas);
		$.get('/api/file/').done(function(data) {
			self.graph.setData(data);
		});
	};
	
	/**
	 * Redraws everything on the canvas.
	 */
	Map.prototype.redraw = function() {
		var self = this;
		
		if(self.globe) {
			self.globe.redraw(
				self.viewport.deltaX,
				self.viewport.deltaY,
				self.viewport.zoom
			);
		}
		
		if(self.graph) {
			self.graph.redraw();
		}
	};
	
	
	
	/**
	 * Class definition for the viewport helper.
	 * 
	 * (1) Holds the offset deltas and the zoom coefficients that are needed
	 * for defining the canvas coordinates.
	 * (2) Handles the events that trigger changes in those variables. 
	 * 
	 * @class
	 * @param The Map of which the instance will be the viewport.
	 */
	var Viewport = function(map) {
		var self = this;
		
		self.map = map;
		
		/**
		 * The deltas between world and viewport coordinates.
		 * Thus the negatives: worldP - viewportP = deltaP.
		 */
		self.deltaX = -700;
		self.deltaY = -900;
		
		/**
		 * The zoom coefficient.
		 */
		self.zoom = 1;
		
		/**
		 * References to event handlers.
		 */
		self.keyDownHandler = null;
	};
	
	/**
	 * Attaches the events listeners needed for operating the viewport.
	 */
	Viewport.prototype.attachEvents = function() {
		var self = this;
		
		self.keyDownHandler = self._handleKeyDown.bind(self);
		document.addEventListener('keydown', self.keyDownHandler);
	};
	
	/**
	 * Handles the keydown event.
	 * Relies on jQuery for providing the event.which property.
	 * 
	 * @param The jQuery-enhanced event instance.
	 */
	Viewport.prototype._handleKeyDown = function(e) {
		var self = this;
		
		if(e.which == 37 || e.which == 100) {  // left
			self.deltaX -= 100 * self.zoom;
		}
		else if(e.which == 38 || e.which == 104) {  // up
			self.deltaY -= 100 * self.zoom;
		}
		else if(e.which == 39 || e.which == 102) {  // right
			self.deltaX += 100 * self.zoom;
		}
		else if(e.which == 40 || e.which == 98) {  // bottom
			self.deltaY += 100 * self.zoom;
		}
		else if(e.which == 48 || e.which == 96) {  // zero
			self.deltaX = 0;
			self.deltaY = 0;
			self.zoom = 1;
		}
		else if(e.which == 189 || e.which == 109) {  // minus
			self.zoom *= 0.8;
		}
		else if(e.which == 187 || e.which == 107) {  // plus
			self.zoom *= 1.25;
		}
		else return;
		
		self.map.redraw();
	};
	
	/**
	 * Removes the event listeners attached by this Viewport instance.
	 */
	Viewport.prototype.detachEvents = function() {
		var self = this;
		
		document.removeEventListener('keydown', self.keyDownHandler);
	};
	
	
	
	/**
	 * Module exports.
	 */
	return {
		Map: Map,
		Viewport: Viewport
	};
	
}());
