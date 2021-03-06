import os


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


"""
Basic configuration
"""
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app',
    'utils',
)
MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)
ROOT_URLCONF = 'project.urls'
WSGI_APPLICATION = 'project.wsgi.application'


"""
Templates
"""
TEMPLATES = [
	{
		'BACKEND': 'django.template.backends.django.DjangoTemplates',
		'DIRS': [
			os.path.join(BASE_DIR, 'templates')
		],
		'APP_DIRS': True,
		'OPTIONS': {
			'context_processors': [
				'django.template.context_processors.debug',
				'django.template.context_processors.request',
				'django.contrib.auth.context_processors.auth',
				'django.contrib.messages.context_processors.messages',
			],
			'debug': True,
		},
	},
]


"""
Physical time and place settings
"""
LANGUAGE_CODE = 'en-gb'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True


"""
Logging
"""
LOGGING = {
	'version': 1,
	'disable_existing_loggers': False,
	'handlers': {
		'mail_admins': {
			'class': 'django.utils.log.AdminEmailHandler',
			'include_html': True,
			'level': 'DEBUG'
		}
	},
	'loggers': {
		'sanavirta.error': {
			'handlers': ['mail_admins'],
			'level': 'DEBUG',
			'propagate': True
		}
	}
}


"""
Local settings
"""
from project.settings_local import *


