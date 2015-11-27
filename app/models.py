from django.db import models
from django.utils import timezone



class Globe(models.Model):
	name = models.CharField(
		max_length = 240,
		unique = True
	)
	description = models.TextField()
	geo_json = models.TextField(
		verbose_name = 'GeoJSON'
	)
	created = models.DateTimeField(
		default = timezone.now,
		editable = False
	)
	last_modified = models.DateTimeField(
		default = timezone.now,
		editable = False
	)
	
	class Meta:
		ordering = ['name']
	
	def __str__(self):
		"""
		Returns the model's string representation.
		"""
		return self.name
	
	def save(self, *args, **kwargs):
		"""
		Overrides the default save() method in order to update last_modified.
		"""
		self.last_modified = timezone.now()
		super().save(*args, **kwargs)



