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
		 * The paper.js tool for attaching event listeners.
		 */
		self.tool = null;
		
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
	 * 
	 * @param The <canvas> element.
	 */
	Graph.prototype.initCanvas = function(canvas) {
		var self = this;
		self.canvas = canvas;
		
		/* init paper.js */
		paper.setup(self.canvas);
		paper.settings.handleSize = 10;
		paper.settings.hitTolerance = 5;
		
		/* init layers */
		self.edgesLayer = new paper.Layer();
		self.nodesLayer = new paper.Layer();
		self.textLayer = new paper.Layer();
		
		/* init tools and modes */
		self.tool = new paper.Tool();
		self.tool.onMouseDown = self._handleMouseDown.bind(self);
		self.tool.activate();
		
		self.editOperation.initPaperItems();
	};
	
	/**
	 * Handles mousedown with the graph's paper.js tool.
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
		
		/* re-calculate positions of nodes and edges */
		var i;
		for(i = 0; i < self.nodes.length; i++) {
			self.nodes[i].redraw();
		}
		for(i = 0; i < self.edges.length; i++) {
			self.edges[i].redraw();
		}
		
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
			node.latitude = data.nodes[isoCode][0];
			node.longitude = data.nodes[isoCode][1];
			node.initPaperItems();
			self.nodes.push(node);
		}
		
		var i, edge;
		for(i = 0; i < data.undirected.length; i++) {
			edge = new Edge(self,
				self.getNode(data.undirected[i].head),
				self.getNode(data.undirected[i].tail)
			);
			edge.weight = data.undirected[i].weight;
			if(data.undirected[i].colour) edge.colour = data.undirected[i].colour;
			if(data.undirected[i].opacity) edge.opacity = data.undirected[i].opacity;
			edge.isDirected = false;
			edge.initPaperItems();
			self.edges.push(edge);
		}
		for(i = 0; i < data.directed.length; i++) {
			edge = new Edge(self,
				self.getNode(data.directed[i].head),
				self.getNode(data.directed[i].tail)
			);
			edge.weight = data.directed[i].weight;
			if(data.directed[i].colour) edge.colour = data.directed[i].colour;
			if(data.directed[i].opacity) edge.opacity = data.directed[i].opacity;
			edge.isDirected = true;
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
		 * The paper.js items.
		 */
		self.circleItem = null;
		self.textItem = null;
		self.compoundItem = null;
	};
	
	/**
	 * Draws the paper.js items for the first time.
	 * Node instances should not deal with styling.
	 */
	Node.prototype.initPaperItems = function() {
		var self = this;
		
		self.circleItem = new paper.Path.Circle({
			parent: self.graph.nodesLayer,
			radius: 15
		});
		
		self.textItem = new paper.PointText({
			parent: self.graph.textLayer,
			content: self.name,
			justification: 'center'
		});
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
	 * Draws the paper.js items for the first time.
	 * Edge instances should not deal with styling, except for strokeWidth.
	 */
	Edge.prototype.initPaperItems = function() {
		var self = this;
		
		var opacity = (self.weight + 3) / 10;
		if(opacity > 1) opacity = 1;
		
		self.pathItem = new paper.Path({
			parent: self.graph.edgesLayer,
			closed: false,
			strokeWidth: self.weight * 1.75,
			opacity: opacity
		});
		
		if(self.isDirected) {
			self.arrowItem = new paper.Path({
				parent: self.graph.edgesLayer,
				closed: false,
				// strokeWidth: 2.5,
				strokeWidth: self.weight * 1.75,
				opacity: opacity
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
		
		/* draw the arrow head */
		if(self.isDirected) {
			self._redrawArrow();
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
		
		self.arrowItem.segments = [
			[self.tail.x - 27, self.tail.y - 8],
			[self.tail.x - 15, self.tail.y],
			[self.tail.x - 27, self.tail.y + 8]
		];
		
		var angle = null;
		if(self.tailHandleGeo) {
			var handle = self.pathItem.segments[1].handleIn;
			angle = Math.atan2(  // handle coords are relative
				-handle.y,
				-handle.x
			);
		}
		else {
			angle = Math.atan2(
				self.tail.y - self.head.y,
				self.tail.x - self.head.x
			);
		}
		angle = angle * 180 / Math.PI;
		// console.log(self.head.name, self.tail.name, angle);
		
		self.arrowItem.rotate(angle, [self.tail.x, self.tail.y]);
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
		
		app.messages.info('Edit mode.');
	};
	
	/**
	 * Ends the currently active edit operation session.
	 */
	EditOperation.prototype.end = function() {
		var self = this;
		
		self.edge.pathItem.fullySelected = false;
		self.edge = null;
		
		self.graph.tool.activate();
		
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
