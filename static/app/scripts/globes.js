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
		 * 
		 */
		self.context = self.map.dom.getContext('2d');
		
		/**
		 * Earth's radius in metres.
		 * https://en.wikipedia.org/wiki/Earth_radius#Mean_radius
		 */
		self.radius = 6378137;
		self.radius = 300;
		
		/**
		 * The latitude and longitude of the point of tangency.
		 */
		self.φ0 = 0;
		self.λ0 = 0;
		
		/**
		 * Used to convert degrees to radians.
		 */
		self.radians = Math.PI / 180;
	};
	
	/**
	 * 
	 */
	Globe.prototype.redraw = function() {
		var self = this;
		console.time('globe');
		
		var path = d3.geo.path().projection(d3.geo.orthographic().clipAngle(90));
		
		self.context.beginPath();
		for(var i = 0; i < EARTH.features.length; i++) {
			path.context(self.context)(EARTH.features[i]);
		}
		self.context.fill();
		
		console.timeEnd('globe');
	};
	
	
	/**
	 * Module exports.
	 */
	return {
		Globe: Globe
	};
	
}());
