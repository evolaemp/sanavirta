from django.test import TestCase

from app.graphs import *



class GraphTestCase(TestCase):
	fixtures = ['languages.json']
	
	def setUp(self):
		self.graph = Graph()
	
	def test_read_dot_string(self):
		with open('app/fixtures/sample.dot') as f:
			dot_string = f.read()
		self.graph.read_dot_string(dot_string)
		
		self.assertEqual(self.graph.name, 'LanguageGraph')
		self.assertEqual(len(self.graph.nodes), 44)
		self.assertEqual(len(self.graph.undirected), 87)
		self.assertEqual(len(self.graph.directed), 17)
		
		self.assertIn('bul', self.graph.nodes)
		self.assertIn('fin', self.graph.nodes)
		self.assertIn('hrv', self.graph.nodes)
		self.assertIn('yrk', self.graph.nodes)
		
		self.assertIn(('fin', 'krl'), self.graph.undirected)
		self.assertEqual(
			self.graph.undirected[('fin', 'krl')],
			{'weight': 4, 'colour': '#000000', 'opacity': 1.0}
		)
		
		self.assertIn(('bak', 'kaz'), self.graph.undirected)
		self.assertEqual(
			self.graph.undirected[('bak', 'kaz')],
			{'weight': 4, 'colour': '#000000', 'opacity': 1.0}
		)
		
		self.assertIn(('fin', 'smn'), self.graph.directed)
		self.assertEqual(
			self.graph.directed[('fin', 'smn')],
			{'weight': 3, 'colour': '#00cc66', 'opacity': 0.9294117647058824}
		)
		
		self.assertIn(('sel', 'rus'), self.graph.directed)
		self.assertEqual(
			self.graph.directed[('sel', 'rus')],
			{'weight': 2, 'colour': '#00cc66', 'opacity': 0.6235294117647059}
		)
	
	def test_to_dict(self):
		self.graph.add_node('fin')
		self.graph.add_node('smn')
		self.graph.add_edge('fin', 'smn', False, {'weight': 3})
		
		d = self.graph.to_dict()
		self.assertIn('name', d)
		self.assertIn('nodes', d)
		self.assertEqual(len(d['nodes']), 2)
		
		self.assertIn('edges', d)
		self.assertEqual(len(d['edges']), 1)
		self.assertEqual(d['edges'][0], {
			'head': 'fin',
			'tail': 'smn',
			'is_directed': False,
			'weight': 3
		})



class ElementTestCase(TestCase):
	def test_attr_stmt_element(self):
		elem = AttrStmtElement()
		elem.parse('pos="3800.0,2650.0", width="0.1", height="0.05"')
		
		self.assertIn('pos', elem.attr)
		self.assertEqual(elem.attr['pos'], '3800.0,2650.0')
		
		self.assertIn('width', elem.attr)
		self.assertEqual(elem.attr['width'], '0.1')
		
		self.assertIn('height', elem.attr)
		self.assertEqual(elem.attr['height'], '0.05')
		
		elem = AttrStmtElement()
		elem.parse('')
		self.assertEqual(len(elem.attr), 0)
	
	def test_node_stmt_element(self):
		node = NodeStmtElement()
		node.parse('bul [pos="2250.0,2125.0", width="0.1", height="0.05"];')
		
		self.assertEqual(node.name, 'bul')
		self.assertIn('pos', node.attr)
		self.assertIn('width', node.attr)
		self.assertIn('height', node.attr)
	
	def test_edge_stmt_element(self):
		edge = EdgeStmtElement()
		edge.parse('fin -> krl [color="#000000ff",penwidth="4"];')
		
		self.assertEqual(edge.left, 'fin')
		self.assertEqual(edge.right, 'krl')
		self.assertTrue(edge.is_directed)
		
		self.assertIn('color', edge.attr)
		self.assertIn('penwidth', edge.attr)
	
	def test_subgraph_element(self):
		subgraph = SubgraphElement()
		subgraph.parse('subgraph bidirected {}')
		self.assertEqual(subgraph.name, 'bidirected')
		
		subgraph = SubgraphElement()
		subgraph.parse('subgraph {}')
		self.assertEqual(subgraph.name, '')
	
	def test_graph_element(self):
		graph = GraphElement()
		graph.parse('digraph LanguageGraph {}')
		self.assertEqual(graph.name, 'LanguageGraph')
		
		graph = GraphElement()
		graph.parse('graph {}')
		self.assertEqual(graph.name, '')
	
	def test_parse_colour(self):
		f = AttrStmtElement.parse_colour
		
		self.assertEqual(f('white'), ('white', None))
		self.assertEqual(f('#000000ff'), ('#000000', 1.0))
		self.assertEqual(f('#00000000'), ('#000000', 0.0))



