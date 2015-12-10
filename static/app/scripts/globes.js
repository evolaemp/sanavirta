/**
 * Globes handle (re-)drawing the planet layer of the map comprising the
 * non-linguistic information, such as land and oceans.
 * 
 * Globes also handle the orthographic projection (cartographical sense).
 * 
 * @module
 * 
 * @requires d3
 */
app.globes = (function() {
	
	"use strict";
	
	
	/**
	 * Class definition for globes.
	 * 
	 * @class
	 * @param The app.maps.Map instance that contains the globe.
	 */
	var Globe = function(map) {
		var self = this;
		self.map = map;
		
		/**
		 * The <canvas> element and its context.
		 */
		self.canvas = null;
		self.context = null;
		
		/**
		 * The d3.geo object instances.
		 */
		self.path = null;
		self.projection = null;
		
		/**
		 * The latitude and longitude of the point of tangency.
		 */
		self.φ0 = 0;
		self.λ0 = 0;
		
		/**
		 * The GeoJSON/TopoJSON data source.
		 */
		self.data = null;
	};
	
	/**
	 * Sets the canvas the globe is to be drawn on.
	 * 
	 * @param The <canvas> element.
	 */
	Globe.prototype.initCanvas = function(canvas) {
		var self = this;
		
		self.canvas = canvas;
		self.context = self.canvas.getContext('2d');
		self.context.fillStyle = 'white';
		
		self.projection = d3.geo.orthographic().clipAngle(90);
		self.projection.translate([self.canvas.width / 2, self.canvas.height / 2]);
		
		self.path = d3.geo.path();
		self.path.projection(self.projection);
	};
	
	/**
	 * Redraws the globe <canvas>.
	 * 
	 * @todo Debug the +/- signs of self.φ0/self.λ0.
	 * @param The x offset in pixels.
	 * @param The y offset in pixels.
	 * @param The zoom coefficient.
	 */
	Globe.prototype.redraw = function(deltaX, deltaY, zoom) {
		var self = this;
		if(!self.data) {
			return;
		}
		
		// 50px of delta equal 5 degrees
		self.λ0 = -deltaX / zoom / 50 * 5;
		self.φ0 = deltaY / zoom / 50 * 5;
		self.projection.rotate([self.λ0, self.φ0]);
		
		// d3.geo's default scale factor is 150
		self.projection.scale(zoom * 500);
		
		// clear and redraw
		self.context.clearRect(0, 0, self.canvas.width, self.canvas.height);
		self.context.beginPath();
		for(var i = 0; i < self.data.features.length; i++) {
			self.path.context(self.context)(self.data.features[i]);
		}
		self.context.fill();
	};
	
	/**
	 * Changes the GeoJSON/TopoJSON data source and triggers a redraw.
	 * 
	 * @param The new GeoJSON or TopoJSON object.
	 */
	Globe.prototype.setData = function(data) {
		var self = this;
		self.data = data;
		self.map.redraw();
	};
	
	/**
	 * Returns the canvas [x, y] coordinates of the given geographical point.
	 * Or returns null if the coordinates are not visible.
	 * 
	 * @param The latitude of the geo point.
	 * @param The longitude of the geo point.
	 * @return [x, y] or null.
	 */
	Globe.prototype.getCanvasCoords = function(latitude, longitude) {
		var self = this;
		if(d3.geo.distance([-self.λ0, -self.φ0], [longitude, latitude]) > Math.PI / 2) {
			return null;
		}
		return self.projection([longitude, latitude]);
	};
	
	
	/**
	 * Module exports.
	 */
	return {
		Globe: Globe
	};
	
}());
