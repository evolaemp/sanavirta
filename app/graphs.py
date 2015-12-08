"""
Graph instances combine the relevant information from .dot files and the
languages geographical coordinates.
"""
from app.models import Language

import re



class Graph:
	
	def __init__(self):
		self.name = ''
		self.nodes = {}
		self.undirected = set()
		self.directed = set()
	
	
	def add_node(self, node_name):
		"""
		Only adds nodes that are present in the database.
		"""
		try:
			lang = Language.objects.get(iso_code=node_name)
			assert type(lang.latitude) is float
			assert type(lang.longitude) is float
		except (Language.DoesNotExist, AssertionError):
			return
		
		self.nodes[lang.iso_code] = (lang.latitude, lang.longitude)
	
	
	def add_edge(self, node_one, node_two, is_directed=False, weight=0):
		"""
		Only adds edges between already known nodes.
		"""
		try:
			assert node_one in self.nodes
			assert node_two in self.nodes
		except AssertionError:
			return
		
		if is_directed:
			self.directed.add((node_one, node_two, weight))
		else:
			self.undirected.add((node_one, node_two, weight))
	
	
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
			if node.name not in ('node', 'edge'):  # .dot keywords
				graph.add_node(node.name)
		
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
			try:
				weight = int(edge.attr['penwidth'])
			except (KeyError, ValueError):
				weight = 0
			
			graph.add_edge(edge.left, edge.right, is_directed, weight)



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



