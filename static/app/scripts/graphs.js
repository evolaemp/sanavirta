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
			strokeColor: 'yellowgreen'
		};
		self.nodesLayer.style = {
			fillColor: 'skyblue'
		};
		self.textLayer.style = {
			fillColor: 'black',
			fontFamily: 'Fira Sans',
			fontSize: 9
		};
		
		/* re-draw the canvas */
		paper.view.draw();
	};
	
	/**
	 * 
	 */
	Graph.prototype.setData = function(data) {
		var self = this;
		
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
				self.getNode(data.undirected[i][0]),
				self.getNode(data.undirected[i][1])
			);
			edge.weight = data.undirected[i][2];
			edge.initPaperItems();
			self.edges.push(edge);
		}
		for(i = 0; i < data.directed.length; i++) {
			edge = new Edge(self,
				self.getNode(data.undirected[i][0]),
				self.getNode(data.undirected[i][1])
			);
			edge.weight = data.undirected[i][2];
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
			radius: 12
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
		 * The paper.js items.
		 */
		self.pathItem = null;
		self.arrowItem = null;
	};
	
	/**
	 * Draws the paper.js items for the first time.
	 * Edge instances should not deal with styling, except for strokeWidth.
	 */
	Edge.prototype.initPaperItems = function() {
		var self = this;
		
		self.pathItem = new paper.Path({
			parent: self.graph.edgesLayer,
			closed: false,
			strokeWidth: self.weight * 1.5
		});
		
		if(self.isDirected) {
			self.arrowItem = new paper.Path({
				parent: self.graph.edgesLayer,
				closed: false,
				strokeWidth: 2.5
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
		
		/* draw the arrow head */
		/*if(self.isDirected) {
			var vector = new paper.Point(
				self.tail.x - self.head.x,
				self.tail.y - self.head.y
			);
			var arrowVector = vector.normalize(20);
			self.arrowItem.segments = [
				arrowVector.rotate(135).add([self.tail.x, self.tail.y]),
				[self.tail.x, self.tail.y],
				arrowVector.rotate(-135).add([self.tail.x, self.tail.y]),
			];
		}*/
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
			self.handle = hitResult.segment.handleOut;
		}
		else {
			self.handle = hitResult.segment.handleIn;
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
		
		self.handle.x += e.delta.x;
		self.handle.y += e.delta.y;
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
		Edge: Edge
	};
	
}());
