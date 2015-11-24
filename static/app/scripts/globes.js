/**
 * Globes handle (re-)drawing the planet layer of the map comprising the
 * non-linguistic information, such as land and oceans.
 * 
 * Globes also handle the orthographic projection (cartographical sense).
 * 
 * @module
 * 
 * @requires paper.js
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
		
		self.context.fillStyle = 'black';
		
		var i, j, coordsList, projection, pathStarted;
		
		for(i = 0; i < EARTH.features.length; i++) {
			coordsList = EARTH.features[i].geometry.coordinates[0];
			pathStarted = false;
			for(j = 0; j < coordsList.length; j++) {
				projection = self.project(coordsList[j][1], coordsList[j][0]);
				if(projection == null) {
					continue;
				}
				if(!pathStarted) {
					self.context.beginPath();
					self.context.moveTo(projection[0], projection[1]);
					pathStarted = true;
				}
				else {
					self.context.lineTo(projection[0], projection[1]);
				}
			}
			self.context.closePath();
			self.context.stroke();
		}
		console.timeEnd('globe');
	};
	
	/**
	 * Calculates the orthographic projection coordinates of the geographical
	 * point given.
	 * 
	 * https://en.wikipedia.org/wiki/Orthographic_projection_in_cartography
	 * 
	 * @param The latitude of the geographical point.
	 * @param The longitude of the geographical point.
	 * @return If the point is visible: [x, y].
	 * @return If the point is not visible: null.
	 */
	Globe.prototype.project = function(φ, λ) {
		var self = this;
		var c, φ0, λ0, x, y;
		
		// convert to radians
		φ0 = self.φ0 * self.radians;
		λ0 = self.λ0 * self.radians;
		
		φ = φ * self.radians;
		λ = λ * self.radians;
		
		// check whether the point would be visible on the projection
		c = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ - λ0);
		if(c < 0) {
			return null;
		}
		
		// calculate the projection coords
		x = Math.cos(φ) * Math.sin(λ - λ0);
		x = x * self.radius;
		
		y = Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ - λ0);
		y = y * self.radius;
		
		return [x+300, -y+300];
	};
	
	
	/**
	 * Module exports.
	 */
	return {
		Globe: Globe
	};
	
}());
