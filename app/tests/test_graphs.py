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
		
		self.assertIn(('fin', 'krl', 4), self.graph.undirected)
		self.assertIn(('bak', 'kaz', 4), self.graph.undirected)
		
		self.assertIn(('fin', 'smn', 3), self.graph.directed)
		self.assertIn(('sel', 'rus', 2), self.graph.directed)



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



