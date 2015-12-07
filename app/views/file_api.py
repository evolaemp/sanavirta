from django.http import JsonResponse
from django.views.generic.base import View

from app.models import Language
from app.graphs import Graph



class FileApiView(View):
	def post(self, request):
		"""
		Receives .dot files and returns ready-for-front-end-consumption graphs.
		
		POST
			file	# the .dot file
		
		200:
			name	# pretty file name
			nodes	# list of {language, latitude, longitude}
			edges	# list of {head, tail, weight}
		
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
			return JsonResponse({'error': str(error)}, status=400)
		except Exception as error:
			print(error)
			return JsonResponse({'error': 'File unreadable.'}, status=400)
		
		return JsonResponse({
			'name': graph.name,
			'nodes': list(graph.nodes),
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



