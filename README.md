# sanavirta

Source code of project sanavirta.

The back end is powered by [Django][dj] and fuelled by [Python3][py]. The front
end has a README of its own in the `static` directory.


## setup

Do something like:

```bash
# clone this repo
git clone https://github.com/evolaemp/sanavirta
cd sanavirta

# create a virtual environment
python3 -m venv meta/env
source meta/env/bin/activate

# install the dependencies
pip install -r requirements.txt
```

Now you have to create your own `settings_local.py` in the `project` directory.
You should include at least the following settings:

* `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
* `STATICFILES_DIRS`, `STATIC_URL`
* `DATABASES`
* `EMAIL_BACKEND` (e.g. `locmem` for testing and `console` for developing)

There is an example configuration in `project/settings_local.example`. You can
use it for local development by copying the file (do not move it, as this would
delete it from the repo). However, do not forget to generate a fresh
`SECRET_KEY` whenever deploying on a publicly visible server.

The last step is to set up and the database:

```bash
python manage.py syncdb
python manage.py loaddata app/fixtures/globes.json
```

The second line is optional and loads some globes (see below) into the newly
created database.

That is it! Do not forget you also have to set up the front end scripts: please
refer to the `static/README.md` file.


## wordflow

You are probably here because you want to export an image. The latter will be a
rectangle cropped out of what this project calls a map. You can think of a map
as the big canvas, i.e. everything excluding the navigation and settings. A map
consists of two layers: a globe and a graph.


### globes

A globe is the map layer representing the Earth. The `globes.json` fixture
mentioned in the initialisation section above contains some globes that you can
choose from when playing with your map. You can also add new globes through the
admin panel: practically a globe is little more than a GeoJSON string. (So yes,
you are not restricted to Earth!) Obtaining such GeoJSON strings is out of the
scope of this project, but here are some hints.

* The [Natural Earth Project][ne] provides public domain shape files.
* [ogr2ogr][oo] is a tool for converting shape files into GeoJSON.


### graphs

For graphs to work as expected, languages and their geographical locations
should be present in the database. You can populate the database through the
admin panel or you can call the following command with `app/fixtures/locations`
as an argument:

```bash
python manage.py harvest_languages <file_name>
```

The command expects lines of whitespace-separated ISO 639-3 codes, latitudes,
and longitudes.


## workflow

```bash
source meta/env/bin/activate
python manage.py runserver
```

Do not forget `python manage.py test` and `python manage.py migrate`, they are
your friends!


[dj]: https://www.djangoproject.com
[py]: https://www.python.org
[ne]: http://www.naturalearthdata.com
[oo]: http://www.gdal.org/ogr2ogr.html
