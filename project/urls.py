from django.conf.urls import include, url
from django.contrib import admin

from app.views.file_api import FileApiView
from app.views.landing import LandingView



urlpatterns = [
	url(r'^admin/', include(admin.site.urls)),
	url(r'^api/file/$', FileApiView.as_view(), name='file_api'),
	url(r'^$', LandingView.as_view(), name='landing'),
]



