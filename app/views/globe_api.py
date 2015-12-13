from django.http import JsonResponse, HttpResponse
from django.views.generic.base import View

from app.models import Globe



class GlobeApiView(View):
	
	def get(self, request, globe_id):
		"""
		Returns the GeoJSON of the requested globe.
		
		GET
			id		# globe.pk
		
		200:
			data	# GeoJSON
		
		404: error
		"""
		try:
			globe = Globe.objects.get(pk=globe_id)
		except Globe.DoesNotExist:
			return JsonResponse({'error': 'Globe not found.'}, status=404)
		
		return HttpResponse(globe.geo_json, status=200)



