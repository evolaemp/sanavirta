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
	 * @param The app.maps.Map that contains the graph.
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
		self.nodes = [];
		
		/**
		 * List of edges.
		 */
		self.edges = [];
		
		/**
		 * The paper.js layers.
		 */
		self.edgesLayer = null;
		self.nodesLayer = null;
		self.textLayer = null;
		
		/**
		 * The EditOperation instance associated with the graph.
		 */
		self.editOperation = new EditOperation(self);
		
		/**
		 * The settable colours.
		 */
		self.edgeColor = '#F44A07';
		self.nodeColor = '#1D1E21';
	};
	
	/**
	 * Prepares the canvas the graph is to be drawn on.
	 * This method assumes that paper.js is already inited.
	 * 
	 * @see app.maps.Map.initDom().
	 * @param The <canvas> element.
	 */
	Graph.prototype.initCanvas = function(canvas) {
		var self = this;
		self.canvas = canvas;
		
		/* init layers */
		self.edgesLayer = new paper.Layer();
		self.nodesLayer = new paper.Layer();
		self.textLayer = new paper.Layer();
		
		/* init event handlers and modes */
		var tool = self.map.viewport.getPaperTool();
		tool.onMouseDown = self._handleMouseDown.bind(self);
		
		self.editOperation.initPaperItems();
	};
	
	/**
	 * Handles mousedown with the viewport's paper.js tool.
	 * Enables edit mode for the selected edge, if such.
	 * 
	 * @param A paper.js ToolEvent instance.
	 */
	Graph.prototype._handleMouseDown = function(e) {
		var self = this;
		
		if(e.item == null || e.item.layer != self.edgesLayer) {
			return;
		}
		
		for(var i = 0; i < self.edges.length; i++) {
			if(self.edges[i].pathItem.id == e.item.id) {
				self.editOperation.start(self.edges[i]);
				break;
			}
		}
	};
	
	/**
	 * Redraws the graph <canvas>.
	 */
	Graph.prototype.redraw = function() {
		var self = this;
		
		/* handle styles */
		self.edgesLayer.style = {
			strokeColor: self.edgeColor
		};
		self.nodesLayer.style = {
			fillColor: self.nodeColor
		};
		self.textLayer.style = {
			fillColor: 'white',
			fontFamily: 'monospace',
			fontWeight: 'bold',
			fontSize: 12
		};
		
		/* re-calculate positions of nodes and edges */
		var i;
		for(i = 0; i < self.nodes.length; i++) {
			self.nodes[i].redraw();
		}
		for(i = 0; i < self.edges.length; i++) {
			self.edges[i].redraw();
		}
		
		/* re-draw the canvas */
		paper.view.draw();
	};
	
	/**
	 * (Re-)sets the nodes and edges of the graph.
	 * 
	 * @see app.views.file_api.FileApiView.
	 * @param The data object.
	 */
	Graph.prototype.setData = function(data) {
		var self = this;
		
		if(self.nodes.length > 0 || self.edges.length > 0) {
			self.reset();
		}
		
		var isoCode, node;
		for(isoCode in data.nodes) {
			node = new Node(self);
			node.name = isoCode;
			
			node.latitude = data.nodes[isoCode].latitude;
			node.longitude = data.nodes[isoCode].longitude;
			
			if('colour' in data.nodes[isoCode]) {
				node.colour = data.nodes[isoCode].colour;
			}
			if('opacity' in data.nodes[isoCode]) {
				node.opacity = data.nodes[isoCode].opacity;
			}
			if('fontcolour' in data.nodes[isoCode]) {
				node.fontColour = data.nodes[isoCode].fontcolour;
			}
			if('strokecolour' in data.nodes[isoCode]) {
				node.strokeColour = data.nodes[isoCode].strokecolour;
			}
			
			node.initPaperItems();
			self.nodes.push(node);
		}
		
		var i, edge;
		for(i = 0; i < data.edges.length; i++) {
			edge = new Edge(self,
				self.getNode(data.edges[i].head),
				self.getNode(data.edges[i].tail)
			);
			
			edge.isDirected = data.edges[i].is_directed;
			edge.weight = data.edges[i].weight;
			
			if('colour' in data.edges[i]) {
				edge.colour = data.edges[i].colour;
			}
			if('opacity' in data.edges[i]) {
				edge.opacity = data.edges[i].opacity;
			}
			
			edge.initPaperItems();
			self.edges.push(edge);
		}
		
		self.redraw();
	};
	
	/**
	 * Returns the Node instance with the given name.
	 * 
	 * @param The name to search for.
	 * @return The named Node or null.
	 */
	Graph.prototype.getNode = function(name) {
		var self = this;
		for(var i = 0; i < self.nodes.length; i++) {
			if(self.nodes[i].name == name) {
				return self.nodes[i];
			}
		}
		return null;
	};
	
	/**
	 * Changes the shape of all nodes of the graph.
	 * 
	 * @see app.maps.MapSettings.initDom().
	 * 
	 * @param One of ('circle', 'rectangle', 'square').
	 * @param Whether to add stroke to the shape.
	 */
	Graph.prototype.changeNodeShape = function(shape, stroke) {
		var self = this;
		
		if(shape != 'circle' && shape != 'rectangle' && shape != 'square') {
			return;
		}
		
		for(var i = 0; i < self.nodes.length; i++) {
			self.nodes[i].changeShape(shape, stroke);
		}
	};
	
	/**
	 * Removes the currently loaded nodes and edges.
	 * 
	 * @see Graph.setData().
	 */
	Graph.prototype.reset = function() {
		var self = this;
		
		if(self.editOperation.edge) {
			self.editOperation.end();
		}
		
		var i;
		for(i = 0; i < self.edges.length; i++) {
			self.edges[i].remove();
		}
		for(i = 0; i < self.nodes.length; i++) {
			self.nodes[i].remove();
		}
		
		self.edges = [];
		self.nodes = [];
		
		paper.view.draw();
	};
	
	/**
	 * Makes a pitiful attempt at avoiding edges crossing nodes.
	 */
	Graph.prototype.beautify = function() {
		var self = this;
		var i;
		
		for(i = 0; i < self.edges.length; i++) {
			self.edges[i].beautify();
		}
		
		paper.view.draw();
	};
	
	/**
	 * Proxy for app.globes.Globe.getCanvasCoords().
	 * 
	 * @param Some latitude.
	 * @param Some longitude.
	 * @return [x, y] on the canvas.
	 */
	Graph.prototype.getCanvasCoords = function(latitude, longitude) {
		return this.map.globe.getCanvasCoords(latitude, longitude);
	};
	
	/**
	 * Proxy for app.globes.Globe.getGeoCoords().
	 * 
	 * @param x on the canvas.
	 * @param y on the canvas.
	 * @return [latitude, longitude].
	 */
	Graph.prototype.getGeoCoords = function(x, y) {
		return this.map.globe.getGeoCoords(x, y);
	};
	
	
	
	/**
	 * Class definition for individual graph nodes.
	 * 
	 * @class
	 * @param The Graph instance the Node belongs to.
	 */
	var Node = function(graph) {
		var self = this;
		self.graph = graph;
		
		/**
		 * Both the ID and the name to be displayed.
		 */
		self.name = null;
		
		/**
		 * Geographical coordinates.
		 */
		self.latitude = null;
		self.longitude = null;
		
		/**
		 * Canvas coordinates.
		 */
		self.x = null;
		self.y = null;
		
		/**
		 * Some representation attributes, setting these is optional.
		 */
		self.colour = null;
		self.opacity = 1;
		self.fontColour = null;
		self.strokeColour = null;
		
		/**
		 * The paper.js items.
		 */
		self.circleItem = null;
		self.textItem = null;
	};
	
	/**
	 * Inits the paper.js items.
	 */
	Node.prototype.initPaperItems = function() {
		var self = this;
		
		self.circleItem = new paper.Path.Circle({
			parent: self.graph.nodesLayer,
			radius: 15,
			opacity: self.opacity
		});
		
		self.textItem = new paper.PointText({
			parent: self.graph.textLayer,
			content: self.name,
			justification: 'center',
			opacity: self.opacity
		});
	};
	
	/**
	 * Changes the shape of the node.
	 * 
	 * @see Graph.changeNodeShape().
	 * 
	 * @param One of ('circle', 'rectangle', 'square').
	 * @param Whether to add stroke to the shape.
	 */
	Node.prototype.changeShape = function(shape, stroke) {
		var self = this;
		
		self.circleItem.remove();
		self.circleItem = null;
		
		if(shape == 'circle') {
			self.circleItem = new paper.Path.Circle({
				parent: self.graph.nodesLayer,
				radius: 15,
				opacity: self.opacity
			});
		}
		else if(shape == 'rectangle') {
			self.circleItem = new paper.Path.Rectangle({
				parent: self.graph.nodesLayer,
				size: new paper.Size(30, 25),
				opacity: self.opacity
			});
		}
		else if(shape == 'square') {
			self.circleItem = new paper.Path.Rectangle({
				parent: self.graph.nodesLayer,
				size: new paper.Size(30, 30),
				opacity: self.opacity
			});
		}
		
		if(stroke && self.strokeColour) {
			self.circleItem.strokeColor = self.strokeColour;
			self.circleItem.strokeWidth = 2.5;
		}
	};
	
	/**
	 * Redraws the paper.js items representing the node.
	 */
	Node.prototype.redraw = function() {
		var self = this;
		
		var coords = self.graph.getCanvasCoords(self.latitude, self.longitude);
		
		if(coords == null) {
			self.x = null;
			self.y = null;
			self.circleItem.visible = false;
			self.textItem.visible = false;
			return;
		}
		
		self.x = coords[0];
		self.y = coords[1];
		
		self.circleItem.visible = true;
		self.textItem.visible = true;
		
		self.textItem.position = [self.x, self.y];
		self.circleItem.position = [self.x, self.y];
		
		if(self.colour) {
			self.circleItem.fillColor = self.colour;
		}
		if(self.fontColour) {
			self.textItem.style.fillColor = self.fontColour;
		}
	};
	
	/**
	 * Checks whether the node should be visible on the map.
	 * 
	 * @return Yes/no.
	 */
	Node.prototype.isVisible = function() {
		var self = this;
		if(self.x == null || self.y == null) {
			return false;
		}
		else return true;
	};
	
	/**
	 * Removes the paper.js items.
	 */
	Node.prototype.remove = function() {
		var self = this;
		
		self.circleItem.remove();
		self.circleItem = null;
		
		self.textItem.remove();
		self.textItem = null;
	};
	
	
	
	/**
	 * Class definition for individual graph edges.
	 * 
	 * @class
	 * @param The Graph instance the Edge belongs to.
	 * @param The edge's head as Node instance.
	 * @param The edge's tail as Node instance.
	 */
	var Edge = function(graph, head, tail) {
		var self = this;
		self.graph = graph;
		
		/**
		 * The edge's head and tail as Node instances.
		 */
		self.head = head;
		self.tail = tail;
		
		/**
		 * Whether the edge is directed or not.
		 */
		self.isDirected = false;
		
		/**
		 * The weight, this is represented as strokeWidth.
		 */
		self.weight = 1;
		
		/**
		 * The representation attributes, these might be set by the data.
		 */
		self.colour = null;
		self.opacity = null;
		
		/**
		 * The paper.js items.
		 */
		self.pathItem = null;
		self.arrowItem = null;
		
		/**
		 * The [latitude, longitude] of the head and tail handles.
		 */
		self.headHandleGeo = null;
		self.tailHandleGeo = null;
	};
	
	/**
	 * Inits the paper.js items.
	 */
	Edge.prototype.initPaperItems = function() {
		var self = this;
		
		if(self.opacity == null) {
			self.opacity = (self.weight + 3) / 10;
			if(self.opacity > 1) self.opacity = 1;
		}
		
		self.pathItem = new paper.Path({
			parent: self.graph.edgesLayer,
			closed: false,
			strokeWidth: self.weight * 1.75,
			opacity: self.opacity
		});
		
		if(self.isDirected) {
			self.arrowItem = new paper.Path({
				parent: self.graph.edgesLayer,
				closed: false,
				// strokeWidth: 2.5,
				strokeWidth: self.weight * 1.75,
				opacity: self.opacity
			});
		}
	};
	
	/**
	 * Redraws the paper.js items representing the edge.
	 * 
	 * @todo Draw edges from invisible nodes.
	 */
	Edge.prototype.redraw = function() {
		var self = this;
		
		/* decide on visibility */
		if(!self.head.isVisible() || !self.tail.isVisible()) {
			self.pathItem.visible = false;
			if(self.isDirected) self.arrowItem.visible = false;
			return;
		}
		else {
			self.pathItem.visible = true;
			if(self.isDirected) self.arrowItem.visible = true;
		}
		
		/* set anchor points */
		self.pathItem.segments = [
			[self.head.x, self.head.y],
			[self.tail.x, self.tail.y]
		];
		
		if(self.headHandleGeo != null) {
			var headHandle = self.graph.getCanvasCoords(
				self.headHandleGeo[0],
				self.headHandleGeo[1]
			);
			if(headHandle) {  // might be on the dark side
				self.pathItem.segments[0].handleOut.x = headHandle[0] - self.pathItem.segments[0].point.x;
				self.pathItem.segments[0].handleOut.y = headHandle[1] - self.pathItem.segments[0].point.y;
			}
		}
		if(self.tailHandleGeo != null) {
			var tailHandle = self.graph.getCanvasCoords(
				self.tailHandleGeo[0],
				self.tailHandleGeo[1]
			);
			if(tailHandle) {  // might be on the dark side
				self.pathItem.segments[1].handleIn.x = tailHandle[0] - self.pathItem.segments[1].point.x;
				self.pathItem.segments[1].handleIn.y = tailHandle[1] - self.pathItem.segments[1].point.y;
			}
		}
		if(self.colour) {
			self.pathItem.strokeColor = self.colour;
		}
		
		/* draw the arrow head */
		if(self.isDirected) {
			self._redrawArrow();
			if(self.colour) {
				self.arrowItem.strokeColor = self.colour;
			}
		}
	};
	
	/**
	 * (Re-)draws the arrow paper.js item.
	 * This method exists for better readability.
	 * 
	 * @see Edge.redraw().
	 */
	Edge.prototype._redrawArrow = function() {
		var self = this;
		
		var intersections = self.pathItem.getIntersections(self.tail.circleItem);
		if(intersections.length != 1) {  // nodes overlap
			self.arrowItem.visible = false;
			return;
		}
		var arrowHead = intersections[0].point;
		
		if(self.pathItem.length < 30) {  // nodes are too close
			self.arrowItem.visible = false;
			return;
		}
		var arrowTail = self.pathItem.getPointAt(self.pathItem.length - 30);
		
		var arrowLeft = arrowTail.rotate(-30, arrowHead);
		var arrowRight = arrowTail.rotate(30, arrowHead);
		
		self.arrowItem.segments = [arrowLeft, arrowHead, arrowRight];
		self.arrowItem.visible = true;
	};
	
	/**
	 * Moves one of the movable handles by the distance specified by the given
	 * delta vector.
	 * 
	 * @param One of ['head', 'tail'].
	 * @param The delta vector as a paper.js Point instance.
	 */
	Edge.prototype.moveHandle = function(which, delta) {
		var self = this;
		
		if(which == 'head') {
			self.pathItem.segments[0].handleOut.x += delta.x;
			self.pathItem.segments[0].handleOut.y += delta.y;
			self.headHandleGeo = self.graph.getGeoCoords(
				self.pathItem.segments[0].point.x + self.pathItem.segments[0].handleOut.x,
				self.pathItem.segments[0].point.y + self.pathItem.segments[0].handleOut.y
			);
		}
		else {
			self.pathItem.segments[1].handleIn.x += delta.x;
			self.pathItem.segments[1].handleIn.y += delta.y;
			self.tailHandleGeo = self.graph.getGeoCoords(
				self.pathItem.segments[1].point.x + self.pathItem.segments[1].handleIn.x,
				self.pathItem.segments[1].point.y + self.pathItem.segments[1].handleIn.y
			);
		}
		
		if(self.isDirected) {
			self._redrawArrow();
		}
	};
	
	/**
	 * If the edge intersects a node, tries to curve itself out of the way.
	 */
	Edge.prototype.beautify = function() {
		var self = this;
		var i, node, A, B, C, vector;
		
		for(i = 0; i < self.graph.nodes.length; i++) {
			node = self.graph.nodes[i];
			
			if(node.name == self.head.name || node.name == self.tail.name) {
				continue;
			}
			if(!self.pathItem.intersects(node.circleItem)) {
				continue;
			}
			
			A = self.pathItem.segments[0].point;
			B = self.pathItem.segments[1].point;
			C = new paper.Point(node.x, node.y);
			
			vector = A.subtract(C).add(B.subtract(A).multiply(A.getDistance(C) / (A.getDistance(C) + B.getDistance(C))));
			vector.length = 40;
			// console.log(self.head.name, self.tail.name, node.name, vector);
			
			while(true) {
				self.moveHandle('head', vector);
				self.moveHandle('tail', vector);
				if(!self.pathItem.intersects(node.circleItem)) break;
			}
		}
	};
	
	/**
	 * Removes the paper.js items.
	 */
	Edge.prototype.remove = function() {
		var self = this;
		
		self.pathItem.remove();
		self.pathItem = null;
		
		if(self.arrowItem) {
			self.arrowItem.remove();
			self.arrowItem = null;
		}
	};
	
	
	
	/**
	 * Class definition for edit operations.
	 * 
	 * @class
	 * @param The graph that the operation belongs to.
	 */
	var EditOperation = function(graph) {
		var self = this;
		self.graph = graph;
		
		/**
		 * The paper.js tool for manipulating the edit.
		 */
		self.tool = null;
		
		/**
		 * The edge that is worked on.
		 * If null, then the operation is not active.
		 */
		self.edge = null;
		
		/**
		 * The currently dragged handle.
		 * If null, there is no drag under way.
		 */
		self.handle = null;
	};
	
	/**
	 * Inits the paper.js tool.
	 * 
	 * @see https://gist.github.com/puckey/1124831
	 */
	EditOperation.prototype.initPaperItems = function() {
		var self = this;
		
		self.tool = new paper.Tool();
		self.tool.minDistance = 10;
		
		self.tool.onMouseDown = self._handleMouseDown.bind(self);
		self.tool.onMouseDrag = self._handleMouseDrag.bind(self);
	};
	
	/**
	 * Handles mousedown with the edit tool.
	 * 
	 * Clicking a handle selects that.
	 * Clicking empty space exits edit mode.
	 * 
	 * @param A paper.js ToolEvent instance.
	 */
	EditOperation.prototype._handleMouseDown = function(e) {
		var self = this;
		
		var hitResult = self.edge.pathItem.hitTest(e.point, {
			handles: true
		});
		
		if(hitResult == null) {
			self.end();
			return;
		}
		
		if(hitResult.segment.index == 0) {
			self.handle = 'head';
		}
		else {
			self.handle = 'tail';
		}
	};
	
	/**
	 * If there is a handle selected, move it.
	 * 
	 * @param A paper.js ToolEvent instance.
	 */
	EditOperation.prototype._handleMouseDrag = function(e) {
		var self = this;
		
		if(self.handle == null) {
			return;
		}
		
		self.edge.moveHandle(self.handle, e.delta);
	};
	
	/**
	 * Starts an edit operation session.
	 * 
	 * @param The Edge instance to be manipulated.
	 */
	EditOperation.prototype.start = function(edge) {
		var self = this;
		
		self.edge = edge;
		self.edge.pathItem.fullySelected = true;
		
		self.tool.activate();
		
		app.messages.info('edit mode');
	};
	
	/**
	 * Ends the currently active edit operation session.
	 */
	EditOperation.prototype.end = function() {
		var self = this;
		
		self.edge.pathItem.fullySelected = false;
		self.edge = null;
		
		self.graph.map.viewport.getPaperTool().activate();
		
		app.messages.clear();
	};
	
	
	
	/**
	 * Module exports.
	 */
	return {
		Graph: Graph,
		Node: Node,
		Edge: Edge,
		EditOperation: EditOperation
	};
	
}());
