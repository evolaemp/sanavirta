from django.core.urlresolvers import reverse
from django.test import TestCase

from app.models import Globe



class GlobeApiTestCase(TestCase):
	fixtures = ['globes.json']
	
	def test_good_request(self):
		globe = Globe.objects.get(pk=1)
		
		response = self.client.get(reverse('globe_api', args=[globe.pk]))
		self.assertEqual(response.status_code, 200)
		
		self.assertEqual(response.content.decode(), globe.geo_json)
	
	def test_bad_request(self):
		response = self.client.get(reverse('globe_api', args=[42]))
		self.assertEqual(response.status_code, 404)



