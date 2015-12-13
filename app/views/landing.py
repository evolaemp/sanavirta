from django.conf import settings
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic.base import View

from app.models import Globe



class LandingView(View):
	
	@method_decorator(ensure_csrf_cookie)
	def dispatch(self, *args, **kwargs):
		"""
		Ensures sending of csrf cookie.
		"""
		return super().dispatch(*args, **kwargs)
	
	
	def get(self, request):
		"""
		Renders the landing page.
		"""
		globes = Globe.objects.all()
		
		return render_to_response(
			'landing.html',
			{
				'globes': globes,
				'EARTH': globes[0].geo_json
			},
			context_instance = RequestContext(request)
		)



