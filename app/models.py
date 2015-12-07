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
		editable = False,
		help_text = 'Timestamp of database entry creation.'
	)
	last_modified = models.DateTimeField(
		default = timezone.now,
		editable = False,
		help_text = 'Timestamp of last database modification.'
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



class Language(models.Model):
	iso_code = models.CharField(
		max_length = 3,
		unique = True,
		verbose_name = 'ISO 639-3'
	)
	
	latitude = models.FloatField(null=True)
	longitude = models.FloatField(null=True)
	
	created = models.DateTimeField(
		default = timezone.now,
		editable = False,
		help_text = 'Timestamp of database entry creation.'
	)
	last_modified = models.DateTimeField(
		default = timezone.now,
		editable = False,
		help_text = 'Timestamp of last database modification.'
	)
	
	class Meta:
		ordering = ['iso_code']
	
	def __str__(self):
		"""
		Returns the model's string representation.
		"""
		return self.iso_code
	
	def save(self, *args, **kwargs):
		"""
		Overrides the default save() method in order to update last_modified.
		"""
		self.last_modified = timezone.now()
		super().save(*args, **kwargs)



