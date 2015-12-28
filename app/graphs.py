"""
Graph instances combine the relevant information from .dot files and the
languages geographical coordinates.
"""
from app.models import Language

import re



class Graph:
	"""
	The self.nodes dict is of the form node_name: [latitude, longitude].
	The edge dicts are of the form (node, node): {}. The latter might contain
	the edge's weight, colour, and/or opacity.
	"""
	
	def __init__(self):
		"""
		Constructor.
		"""
		self.name = ''
		self.nodes = {}
		self.undirected = {}
		self.directed = {}
	
	
	def add_node(self, node_name, information={}):
		"""
		Only adds nodes that are present in the database.
		"""
		try:
			lang = Language.objects.get(iso_code=node_name)
			assert type(lang.latitude) is float
			assert type(lang.longitude) is float
		except (Language.DoesNotExist, AssertionError):
			return
		
		coords = [lang.latitude, lang.longitude]
		
		if 'latitude' in information:
			coords[0] = information['latitude']
		if 'longitude' in information:
			coords[1] = information['longitude']
		
		self.nodes[lang.iso_code] = tuple(coords)
	
	
	def add_edge(self, node_one, node_two, is_directed=False, information={}):
		"""
		Only adds edges between already known nodes.
		"""
		try:
			assert node_one in self.nodes
			assert node_two in self.nodes
		except AssertionError:
			return
		
		try:
			for key in information:
				assert key in ('weight', 'colour', 'opacity',)
		except AssertionError:
			return
		
		if is_directed:
			# self.directed.add((node_one, node_two, information['weight']))
			self.directed[(node_one, node_two)] = information
		else:
			# self.undirected.add((node_one, node_two, information['weight']))
			self.undirected[(node_one, node_two)] = information
	
	
	def read_dot_string(self, string):
		"""
		Populates the graph with the contents of the .dot string given.
		http://www.graphviz.org/doc/info/lang.html
		"""
		string = self._clean_dot_string(string)
		
		graph_elem = GraphElement()
		graph_elem.parse(string)
		graph_elem.populate(self)
	
	
	def _clean_dot_string(self, string):
		"""
		Returns the given .dot string without comments and newlines.
		"""
		string = re.sub(
			r'(/\*.*\*/|//.*?$|[\n]+)',
			' ',
			string,
			flags = re.DOTALL | re.MULTILINE
		)
		return string
	
	
	def to_dict(self):
		"""
		Returns the graph as dict ready for JSON serialisation.
		"""
		edges = []
		
		for key, item in self.undirected.items():
			d = {'head': key[0], 'tail': key[1], 'is_directed': False}
			for attr in ('weight', 'colour', 'opacity',):
				if attr in item:
					d[attr] = item[attr]
			edges.append(d)
		
		for key, item in self.directed.items():
			d = {'head': key[0], 'tail': key[1], 'is_directed': True}
			for attr in ('weight', 'colour', 'opacity',):
				if attr in item:
					d[attr] = item[attr]
			edges.append(d)
		
		return {
			'name': self.name,
			'nodes': self.nodes,
			'edges': edges
		}



class Element:
	"""
	All .dot language elements should define:
	* self.regex: as class property in order to avoid re-compilation.
	* self.parse(string): raising ValueError if the regex fails.
	* self.populate(graph): adds nodes/edges to the given Graph instance.
	Element subclass instances are helpers for parsing the .dot language.
	"""
	regex = None
	
	def parse(self, string):
		return True
	
	def populate(self, graph):
		pass



class GraphElement(Element):
	regex = re.compile(
		r'''
		^(graph|digraph)\s*(?P<name>\w*)\s*{(?P<contents>.*)}$
		''',
		flags = re.VERBOSE
	)
	
	def __init__(self):
		self.name = ''
		self.nodes = []
		self.subgraphs = []
	
	def parse(self, string):
		"""
		Graphs contain subgraphs and node statements.
		"""
		match = self.regex.match(string.strip())
		if match is None:
			raise ValueError()
		
		self.name = match.group('name')
		
		string = match.group('contents')
		
		while True:
			subgraph = SubgraphElement()
			try:
				string = subgraph.parse(string)
			except ValueError:
				break
			self.subgraphs.append(subgraph)
		
		while True:
			node_stmt = NodeStmtElement()
			try:
				string = node_stmt.parse(string)
			except ValueError:
				break
			self.nodes.append(node_stmt)
		
		return ''
	
	def populate(self, graph):
		graph.name = self.name
		
		for node in self.nodes:
			node.populate(graph)
		
		for subgraph in self.subgraphs:
			subgraph.populate(graph)



class SubgraphElement(Element):
	regex = re.compile(
		r'''
		subgraph\s*(?P<name>\w*)\s*{(?P<contents>[^{}]*)}
		''',
		flags = re.VERBOSE
	)
	
	def __init__(self):
		self.name = ''
		self.edges = []
	
	def parse(self, string):
		"""
		Subgraphs contain edge statements.
		"""
		match = self.regex.search(string)
		
		if match is None:
			raise ValueError()
		
		self.name = match.group('name')
		
		contents = match.group('contents')
		
		while True:
			edge_stmt = EdgeStmtElement()
			try:
				contents = edge_stmt.parse(contents)
			except ValueError:
				break
			self.edges.append(edge_stmt)
		
		return string[:match.start()] + string[match.end():]
	
	def populate(self, graph):
		is_directed = False
		if self.name.lower() in ('directed',):
			is_directed = True
		
		for edge in self.edges:
			information = {}
			
			try:
				weight = int(edge.attr['penwidth'])
			except (KeyError, ValueError):
				weight = None
			else:
				information['weight'] = weight
			
			if 'color' in edge.attr:
				t = AttrStmtElement.parse_colour(edge.attr['color'])
				information['colour'] = t[0]
				if t[1] is not None:
					information['opacity'] = t[1]
			
			graph.add_edge(edge.left, edge.right, is_directed, information)



class NodeStmtElement(Element):
	regex = re.compile(
		r'''
		(?P<node>\w+)\s+
		\[(?P<attributes>.*?)\];
		''',
		flags = re.VERBOSE
	)
	
	def __init__(self):
		self.name = ''
		self.attr = {}
	
	def parse(self, string):
		match = self.regex.search(string)
		
		if match is None:
			raise ValueError()
		
		self.name = match.group('node')
		
		if len(match.group('attributes')):
			attr_stmt = AttrStmtElement()
			attr_stmt.parse(match.group('attributes'))
			self.attr = attr_stmt.attr
		
		return string[:match.start()] + string[match.end():]
	
	def populate(self, graph):
		if self.name in ('node', 'edge'):  # .dot keywords
			return
		
		information = {}
		
		for item in ('latitude', 'longitude'):
			try:
				assert item in self.attr
				float(self.attr[item])
			except (AssertionError, ValueError):
				continue
			else:
				information[item] = float(self.attr[item])
		
		graph.add_node(self.name, information)



class EdgeStmtElement(Element):
	regex = re.compile(
		r'''
		(?P<left>\w+)\s*(?P<arc>->|--)\s*(?P<right>\w+)\s*
		\[(?P<attributes>.*?)\];
		''',
		flags = re.VERBOSE
	)
	
	def __init__(self):
		self.left = None
		self.right = None
		self.is_directed = False
		self.attr = {}
	
	def parse(self, string):
		match = self.regex.search(string)
		
		if match is None:
			raise ValueError()
		
		self.left = match.group('left')
		self.right = match.group('right')
		
		if match.group('arc') == '->':
			self.is_directed = True
		
		if len(match.group('attributes')):
			attr_stmt = AttrStmtElement()
			attr_stmt.parse(match.group('attributes'))
			self.attr = attr_stmt.attr
		
		return string[:match.start()] + string[match.end():]



class AttrStmtElement(Element):
	regex = re.compile(
		r'''
		^((?P<name>[-\w.,]+)="?(?P<value>[-\w.,#]+?)"?,?\s*)*$
		''',
		flags = re.VERBOSE
	)
	
	def __init__(self):
		self.attr = {}
	
	def parse(self, string):
		while True:
			string = string.strip()
			if len(string) == 0:
				break
			
			match = self.regex.match(string)
			if match is None:
				raise ValueError()
			
			self.attr[match.group('name')] = match.group('value')
			string = string[:match.start('name')]
		
		return ''
	
	def parse_colour(string):
		"""
		Extracts the (colour, opacity) tuple out of /#.{8}/ colour encoding.
		Static method.
		"""
		try:
			assert len(string) == 9
			assert string[0] == '#'
		except AssertionError:  # assumes no opacity encoded
			return (string, None)
		
		colour = string[:-2]
		
		try:
			opacity = int(string[-2:], 16)
			opacity = opacity / 255
		except ValueError:
			opacity = None
		
		return (colour, opacity)



