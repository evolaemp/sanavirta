/**
 * A Map is made out of a Globe and a Graph.
 * 
 * @module
 * 
 * @requires jQuery
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
	 * Inits the map's Globe instance.
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
		
		if(EARTH) {
			self.globe.setData(EARTH);
		}
	};
	
	/**
	 * Inits the map's Graph instance.
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
			self.graph.beautify();
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
	 * Makes AJAX request to the API for globe data and sets it.
	 * 
	 * @param The ID of the globe requested.
	 */
	Map.prototype.loadGlobeData = function(globeId) {
		var self = this;
		
		if(!self.globe) {
			return;
		}
		
		$.get('/api/globe/'+ globeId +'/')
		.done(function(data) {
			app.messages.success('Globe loaded.');
			self.globe.setData(data);
		})
		.fail(function() {
			app.messages.error('Globe not found.');
		});
	};
	
	/**
	 * Uploads the given File instance to the API for processing and sets the
	 * graph correspondingly.
	 * 
	 * @param File instance.
	 */
	Map.prototype.loadGraphFile = function(file) {
		var self = this;
		var formData = new FormData();
		formData.append('file', file);
		
		$.ajax({
			url: '/api/file/',
			method: 'POST',
			data: formData,
			processData: false,
			contentType: false
		})
		.done(function(data) {
			app.messages.success('Graph loaded.');
			self.graph.setData(data);
			self.graph.beautify();
		})
		.fail(function(xhr) {
			var error = 'File could not be loaded.';
			try {
				error = xhr.responseJSON.error;
			} catch(e) {};
			app.messages.error(error);
		});
	};
	
	/**
	 * Exports the map to a data URL using a temporary canvas to merge the
	 * globe and graph canvases.
	 * 
	 * @param The image format.
	 * @return The data URL.
	 */
	Map.prototype.exportToDataURL = function(format) {
		var self = this;
		
		var canvas = document.createElement('canvas');
		canvas.width = self.dom.offsetWidth;
		canvas.height = self.dom.offsetHeight;
		
		var context = canvas.getContext('2d');
		context.fillStyle = self.globe.oceanColor;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(self.globe.canvas, 0, 0);
		context.drawImage(self.graph.canvas, 0, 0);
		
		return canvas.toDataURL('image/' + format);
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
		self.deltaX = 975.3125;
		self.deltaY = -1100;
		
		/**
		 * The zoom coefficient.
		 */
		self.zoom = 1.953125;
		
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
	 * Class definition for map settings.
	 * 
	 * @class
	 * @param An app.maps.Map instance.
	 */
	var MapSettings = function(map) {
		var self = this;
		
		/**
		 * The Map instance that the settings will set.
		 */
		self.map = map;
		
		/**
		 * The dom container containing the settings.
		 */
		self.dom = null;
	};
	
	/**
	 * Attaches the relevant event listeners.
	 * 
	 * @param A jQuery element.
	 */
	MapSettings.prototype.initDom = function(dom) {
		var self = this;
		self.dom = dom;
		
		/**
		 * Globe settings.
		 */
		self.dom.find('select#select-globe').change(function(e) {
			app.messages.info('Loading&hellip;');
			self.map.loadGlobeData($(this).val());
			/**
			 * Prevent the field from interfering with the arrow keys used for
			 * moving around the globe.
			 */
			$(this).blur();
		});
		
		self.dom.find('input#ocean-color').change(function(e) {
			self.map.globe.oceanColor = $(this).val();
			self.map.dom.style.backgroundColor = $(this).val();
		});
		
		self.dom.find('input#earth-color').change(function(e) {
			self.map.globe.earthColor = $(this).val();
			self.map.redraw();
		});
		
		/**
		 * Graph settings.
		 */
		self.dom.find('input#graph-file').change(function(e) {
			var fileList = this.files;
			if(fileList.length != 1) {
				app.messages.error('No file selected.');
				return;
			}
			app.messages.info('Loading&hellip;');
			self.map.loadGraphFile(fileList[0]);
			$(this).blur();
		});
		
		self.dom.find('input#edge-color').change(function(e) {
			self.map.graph.edgeColor = $(this).val();
			self.map.graph.redraw();
		});
		
		self.dom.find('input#node-color').change(function(e) {
			self.map.graph.nodeColor = $(this).val();
			self.map.graph.redraw();
		});
		
		/**
		 * Exports.
		 */
		self.dom.find('select#select-format').change(function(e) {
			$(this).blur();
		});
		
		self.dom.find('a#download-button').click(function(e) {
			var format = $('select#select-format').val();
			this.href = self.map.exportToDataURL(format);
			this.download = 'map.' + format;
		});
	};
	
	
	
	/**
	 * Module exports.
	 */
	return {
		Map: Map,
		Viewport: Viewport,
		MapSettings: MapSettings
	};
	
}());
