from django.contrib import admin

from app.models import Globe



@admin.register(Globe)
class GlobeAdmin(admin.ModelAdmin):
	list_display = ('name', 'created', 'last_modified',)
	search_fields = ('name',)
	readonly_fields = ('created', 'last_modified',)



