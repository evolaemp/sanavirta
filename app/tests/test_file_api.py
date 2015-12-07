from django.core.urlresolvers import reverse
from django.test import TestCase

from utils.json import read_json



class FileApiTestCase(TestCase):
	def test_good_upload(self):
		with open('app/fixtures/sample.dot', 'r') as f:
			response = self.client.post(
				reverse('file_api'),
				{'file': f}
			)
		
		self.assertEqual(response.status_code, 200)
		
		d = read_json(response.content)
		self.assertEqual(len(d), 4)
	
	def test_bad_upload(self):
		with open('app/fixtures/globes.json', 'r') as f:
			response = self.client.post(
				reverse('file_api'),
				{'file': f}
			)
		
		self.assertEqual(response.status_code, 400)
		
		d = read_json(response.content)
		self.assertEqual(len(d), 1)
		
		self.assertIn('error', d)
	
	def test_empty_upload(self):
		response = self.client.post(reverse('file_api'))
		self.assertEqual(response.status_code, 400)
		
		d = read_json(response.content)
		self.assertEqual(len(d), 1)
		
		self.assertIn('error', d)



