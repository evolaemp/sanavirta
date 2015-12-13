from django.http import JsonResponse
from django.views.generic.base import View

from app.models import Language
from app.graphs import Graph



class FileApiView(View):
	
	def get(self, request):
		"""
		Equivalent to POST the app/fixtures/sample.dot file.
		Used for development purposes.
		"""
		with open('app/fixtures/sample.dot', 'r') as f:
			contents = f.read()
		
		graph = Graph()
		
		try:
			graph.read_dot_string(contents)
		except ValueError as error:
			return JsonResponse({
				'error': 'File could not be parsed.'
			}, status=400)
		
		return JsonResponse({
			'name': graph.name,
			'nodes': graph.nodes,
			'undirected': list(graph.undirected),
			'directed': list(graph.directed)
		}, status=200)
	
	
	def post(self, request):
		"""
		Receives .dot files and returns ready-for-front-end-consumption graphs.
		
		POST
			file		# the .dot file
		
		200:
			name		# pretty file name
			nodes		# [] of [language, latitude, longitude]
			directed	# [] of [head, tail, weight]
			undirected	# [] of [head, tail, weight]
		
		400: error
		"""
		
		try:
			f = self.validate_file(request)
		except ValueError as error:
			return JsonResponse({'error': str(error)}, status=400)
		
		graph = Graph()
		
		contents = f.read()
		if isinstance(contents, bytes):
			contents = contents.decode()
		
		try:
			graph.read_dot_string(contents)
		except ValueError as error:
			return JsonResponse({
				'error': 'File could not be parsed.'
			}, status=400)
		
		return JsonResponse({
			'name': graph.name,
			'nodes': graph.nodes,
			'undirected': list(graph.undirected),
			'directed': list(graph.directed)
		}, status=200)
	
	
	def validate_file(self, request):
		"""
		Input validation.
		Returns the UploadedFile instance.
		"""
		try:
			assert len(request.FILES) == 1
			assert 'file' in request.FILES
		except AssertionError:
			raise ValueError('One file at a time, please.')
		
		f = request.FILES['file']
		
		try:
			assert f.size > 0
		except AssertionError:
			raise ValueError('The file is empty.')
		
		try:
			assert f.size <= 1024 * 500
		except AssertionError:
			raise ValueError('The file exceeds the 500 KB limit.')
		
		return f



