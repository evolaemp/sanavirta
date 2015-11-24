from django.conf.urls import include, url
from django.contrib import admin

from app.views.landing import LandingView



urlpatterns = [
	url(r'^admin/', include(admin.site.urls)),
	url(r'^$', LandingView.as_view(), name='landing'),
]



