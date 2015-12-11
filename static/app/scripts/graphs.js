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
		 * The currently selected Edge instance.
		 */
		self.selectedEdge = null;
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
		
		/* init layers */
		self.edgesLayer = new paper.Layer();
		self.nodesLayer = new paper.Layer();
		self.textLayer = new paper.Layer();
		
		/* init tools */
		self.tool = new paper.Tool();
		self.tool.minDistance = 10;
		self.tool.onMouseDown = self._handleSelectEdge.bind(self);
		self.tool.onMouseDrag = self._handleDrag.bind(self);
		self.tool.onMouseUp = self._handleEndDrag.bind(self);
		self.tool.activate();
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
			strokeColor: '#48F3AF'
		};
		self.nodesLayer.style = {
			fillColor: '#1D1E21'
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
	 * Handles dragging.
	 * 
	 * @param A paper.js ToolEvent instance.
	 */
	Graph.prototype._handleSelectEdge = function(e) {
		var self = this;
		
		if(e.item == null || e.item.layer != self.edgesLayer) {
			return;
		}
		
		for(var i = 0; i < self.edges.length; i++) {
			if(self.edges[i].pathItem.id == e.item.id) {
				self.selectedEdge = self.edges[i];
				break;
			}
		}
	};
	Graph.prototype._handleDrag = function(e) {
		var self = this;
		
		if(self.selectedEdge == null) {
			return;
		}
		
		self.selectedEdge.moveMiddlePoint(e.point);
	};
	Graph.prototype._handleEndDrag = function(e) {
		var self = this;
		self.selectedEdge = null;
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
		 * If not null, then the middle anchor has been moved.
		 */
		self.middlePoint = null;
		
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
		if(self.middlePoint) {
			self.pathItem.insert(1, self.middlePoint);
			self.pathItem.smooth();
		}
		
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
	
	Edge.prototype.enterSelectMode = function() {
		var self = this;
		self.pathItem.selected = true;
		self.graph.addTool.activate();
	};
	
	Edge.prototype.exitSelectMode = function() {
		var self = this;
		self.pathItem.selected = false;
	};
	
	Edge.prototype.addAnchor = function(x, y) {
		var self = this;
		self.pathItem.insert(1, [x, y]);
		paper.view.draw();
	};
	
	Edge.prototype.moveMiddlePoint = function(point) {
		var self = this;
		
		self.middlePoint = point;
		
		if(self.pathItem.segments.length > 2) {
			self.pathItem.removeSegment(1);
		}
		else console.warn('stella');
		self.pathItem.insert(1, self.middlePoint);
		
		self.pathItem.smooth();
		
		paper.view.draw();
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
