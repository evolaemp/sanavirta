# Sanavirta

Source code of project Sanavirta.

The back end is powered by [Django](https://www.djangoproject.com) and fuelled
by [Python3](https://www.python.org/). The front end has a README of its own in
the `static` directory.

The `development` directory is ignored by git by default, so you can use it for
local storage.


## Initialisation

Do something like:

```
git clone && cd
virtualenv /path/to/environments/sanavirta
source /path/to/environments/sanavirta/bin/activate
pip install -r requirements.txt
```

Now you have to create your own `settings_local.py` in the `project` directory.
You should include at least the following settings:

* `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
* `STATICFILES_DIRS`, `STATIC_ROOT`, `STATIC_URL`
* `MEDIA_ROOT`, `MEDIA_URL`
* `JS_TESTS_ROOT`, `QUNIT_ROOT`
* `DATABASES`
* `CACHES` (needed for storing uploaded files for subsequent API requests)
* `EMAIL_BACKEND` (e.g. `locmem` for testing and `console` for developing),
  `DEFAULT_FROM_EMAIL`, `EMAIL_SUBJECT_PREFIX`
* `ADMINS`, `MANAGERS`

There is an example configuration in `project/settings_local.example`. You can
use it for local development by copying the file (do not move it, as this would
delete it from the repo).

The last step is to set up and the database:
```
python manage.py syncdb
python manage.py loaddata app/fixtures/globes.json
```
The second line is optional and loads some globes (see below) into the newly
created database.

That is it! Do not forget you also have to set up the front end scripts: please
refer to the `static/README.md` file.


## Wordflow

You are probably here because you want to export an image. The latter will be a
rectangle cropped out of what this project calls a map. You can think of a map
as the big canvas, i.e. everything excluding the navigation and settings. A map
consists of two layers: a globe and a graph.


### Globes

A globe is the map layer representing the Earth. The `globes.json` fixture
mentioned in the initialisation section above contains some globes that you can
choose from when playing with your map. You can also add new globes through the
admin panel: practically a globe is little more than a GeoJSON string. (So yes,
you are not restricted to Earth!) Obtaining such GeoJSON strings is out of the
scope of this project, but here are some hints.

* The [Natural Earth Project](http://www.naturalearthdata.com/) provides public
  domain shape files.
* [ogr2ogr](http://www.gdal.org/ogr2ogr.html) is a tool for converting shape
  files into GeoJSON.


### Graphs

For graphs to work as expected, languages and their geographical locations
should be present in the database. You can populate the database through the
admin panel or you can call the following command with `app/fixtures/locations`
as an argument:
```
python manage.py harvest_languages <file_name>
```
The command expects lines of whitespace-separated ISO 639-3 codes, latitudes,
and longitudes.


## Workflow

```
source /path/to/environments/kalakukko/bin/activate
python manage.py runserver
```
Do not forget `python manage.py test` and `python manage.py migrate`, they are
your friends!


