from django.contrib import admin

from app.models import Globe, Language



@admin.register(Globe)
class GlobeAdmin(admin.ModelAdmin):
	list_display = ('name', 'created', 'last_modified',)
	search_fields = ('name',)
	readonly_fields = ('created', 'last_modified',)



@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
	list_display = ('iso_code', 'latitude', 'longitude',)
	search_fields = ('iso_code',)
	readonly_fields = ('created', 'last_modified',)



