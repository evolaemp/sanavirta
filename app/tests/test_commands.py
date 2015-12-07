from django.core.management.base import CommandError
from django.core.management import call_command
from django.test import TestCase
from django.utils.six import StringIO

from app.models import Language



class HarvestLanguagesTestCase(TestCase):
	def setUp(self):
		self.stdout = StringIO()
		self.stderr = StringIO()
		
		self.args = ['app/fixtures/locations']
		self.opts = {'stdout': self.stdout, 'stderr': self.stderr}
	
	def test_nargs(self):
		for args in (
				[],
				['app/fixtures/locations'] * 2,
				['app/fixtures/locations'] * 3,
			):
			with self.assertRaises(CommandError):
				call_command('harvest_languages', *args, **self.opts)
	
	def test_command(self):
		call_command('harvest_languages', *self.args, **self.opts)
		self.assertEqual('', self.stderr.getvalue())
		
		self.assertEqual(Language.objects.count(), 130)
		
		ain = Language.objects.get(iso_code='ain')
		self.assertEqual(ain.latitude, 43.0)
		self.assertEqual(ain.longitude, 143.0)
		
		fin = Language.objects.get(iso_code='fin')
		self.assertEqual(fin.latitude, 62.0)
		self.assertEqual(fin.longitude, 25.0)
		
		isl = Language.objects.get(iso_code='isl')
		self.assertEqual(isl.latitude, 65.0)
		self.assertEqual(isl.longitude, -17.0)
		
		krl = Language.objects.get(iso_code='krl')
		self.assertEqual(krl.latitude, 64.0)
		self.assertEqual(krl.longitude, 32.0)
		
		rus = Language.objects.get(iso_code='rus')
		self.assertEqual(rus.latitude, 56.0)
		self.assertEqual(rus.longitude, 38.0)



