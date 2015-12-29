/**
 * A Map is made out of a Globe and a Graph.
 * 
 * @module
 * 
 * @requires jQuery
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
		self.globe = new app.globes.Globe(self);
		
		/**
		 * The app.graphs.Graph instance.
		 */
		self.graph = new app.graphs.Graph(self);
		
		/**
		 * The parent node of the <canvas> elements.
		 */
		self.dom = null;
		
		/**
		 * The <canvas> elements and their parent.
		 */
		self.globeCanvas = null;
		self.graphCanvas = null;
		
		/**
		 * The Viewport instance.
		 */
		self.viewport = new Viewport(self);
	};
	
	/**
	 * Creates the <canvas> elements, inits paper.js and the viewport instance.
	 * 
	 * The globe canvas should be below, i.e. first child, the graph canvas,
	 * not only because the globe should be below the graph, but aslo because
	 * the viewport uses paper.js which is inited on the graph canvas.
	 * 
	 * @param The dom element that will be the map.
	 */
	Map.prototype.initDom = function(dom) {
		var self = this;
		self.dom = dom;
		
		/* create the globe <canvas> */
		self.globeCanvas = document.createElement('canvas');
		self.dom.appendChild(self.globeCanvas);
		
		self.globeCanvas.width = self.dom.offsetWidth;
		self.globeCanvas.height = self.dom.offsetHeight;
		self.globeCanvas.classList.add('globe');
		
		/* create the graph <canvas> */
		self.graphCanvas = document.createElement('canvas');
		self.dom.appendChild(self.graphCanvas);
		
		self.graphCanvas.width = self.dom.offsetWidth;
		self.graphCanvas.height = self.dom.offsetHeight;
		self.graphCanvas.classList.add('graph');
		
		/* init paper.js */
		paper.setup(self.graphCanvas);
		paper.settings.handleSize = 10;
		paper.settings.hitTolerance = 5;
		
		/* init the viewport controller */
		self.viewport.attachEvents();
		
		/* init globe and graph instances */
		self.globe.initCanvas(self.globeCanvas);
		if(EARTH) {
			self.globe.setData(EARTH);
		}
		
		self.graph.initCanvas(self.graphCanvas);
	};
	
	/**
	 * Redraws everything.
	 * Only the Viewport instance should call this method.
	 */
	Map.prototype.redraw = function() {
		var self = this;
		
		self.globe.redraw(
			self.viewport.deltaX,
			self.viewport.deltaY,
			self.viewport.zoom
		);
		
		self.graph.redraw();
	};
	
	/**
	 * Makes AJAX request to the API for globe data and sets it.
	 * 
	 * @param The ID of the globe requested.
	 */
	Map.prototype.loadGlobeData = function(globeId) {
		var self = this;
		
		$.get('/api/globe/'+ globeId +'/')
		.done(function(data) {
			app.messages.success('Globe loaded.');
			self.globe.setData(data);
			self.redraw();  // the globe will not redraw itself
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
			// self.graph.beautify();
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
	 * Loads a sample graph and centres it on the screen.
	 * Used for development and showcasing.
	 */
	Map.prototype.loadSampleGraph = function() {
		var self = this;
		
		$.get('/api/file/').done(function(data) {
			self.graph.setData(data);
			// self.graph.beautify();
			
			self.viewport.deltaX = 975.3125;
			self.viewport.deltaY = -1100;
			self.viewport.zoom = 1.953125;
			
			self.redraw();
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
		self.deltaX = 0;
		self.deltaY = 0;
		
		/**
		 * The zoom coefficient.
		 */
		self.zoom = 1;
		
		/**
		 * The paper.js tool that the viewport handlers will be attached to.
		 */
		self.tool = null;
		
		/**
		 * References to event handlers.
		 */
		self.keyDownHandler = null;
	};
	
	/**
	 * Attaches the events listeners needed for operating the viewport.
	 * 
	 * The key event handler is not attached to the tool so that the user can
	 * move the curve handles in edit mode to outside the screen if necessary.
	 */
	Viewport.prototype.attachEvents = function() {
		var self = this;
		
		self.tool = new paper.Tool();
		self.tool.minDistance = 20;
		self.tool.activate();
		
		/* moving with the keys */
		self.keyDownHandler = self._handleKeyDown.bind(self);
		document.addEventListener('keydown', self.keyDownHandler);
		
		/* moving by dragging */
		self.mouseDragHandler = self._handleMouseDrag.bind(self);
		self.tool.on('mousedrag', self.mouseDragHandler);
		
		/* zooming with the mouse scroll */
		self.wheelHandler = self._handleWheel.bind(self);
		self.map.dom.addEventListener('wheel', self.wheelHandler);
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
			self.zoom *= 9/10;
		}
		else if(e.which == 187 || e.which == 107) {  // plus
			self.zoom *= 10/9;
		}
		else return;
		
		self.map.redraw();
	};
	
	/**
	 * Handles the mousedrag paper js event.
	 * 
	 * @param The paper.ToolEvent instance.
	 */
	Viewport.prototype._handleMouseDrag = function(e) {
		var self = this;
		
		self.deltaX -= e.point.x - e.lastPoint.x;
		self.deltaY -= e.point.y - e.lastPoint.y;
		
		self.map.redraw();
	};
	
	/**
	 * Handles the wheel event.
	 * 
	 * @todo Research whether e.deltaMode should be heeded
	 * (see the source of L.DomEvent.getWheelData()).
	 * 
	 * @param The wheel event instance.
	 */
	Viewport.prototype._handleWheel = function(e) {
		var self = this;
		
		if(e.deltaY > 0) {
			self.zoom *= 9/10;
		}
		else {
			self.zoom *= 10/9;
		}
		
		self.map.redraw();
	};
	
	/**
	 * Removes the event listeners attached by this Viewport instance.
	 */
	Viewport.prototype.detachEvents = function() {
		var self = this;
		
		document.removeEventListener('keydown', self.keyDownHandler);
		
		self.tool.off('mousedrag', self.mouseDragHandler);
		
		self.map.dom.removeEventListener('wheel', self.wheelHandler);
	};
	
	/**
	 * Returns reference to self.tool.
	 * 
	 * The viewport tool is the default paper.js tool and other classes might
	 * want to attach their own event handlers or to give back control to the
	 * viewport tool after temporarily activating another paper.js tool.
	 * 
	 * @see app.graphs.Graph.initCanvas().
	 * @see app.graphs.EditOperation.end().
	 * 
	 * @return The paper.js tool instance used for moving the viewport.
	 */
	Viewport.prototype.getPaperTool = function() {
		return this.tool;
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
		
		self.dom.find('select#node-shape').change(function(e) {
			var value, shape, stroke;
			
			value = $(this).val().split('-');
			shape = value[0];
			stroke = (value.length == 2) ? true : false;
			
			self.map.graph.changeNodeShape(shape, stroke);
			self.map.graph.redraw();
			
			$(this).blur();
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
