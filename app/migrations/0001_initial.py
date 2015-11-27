# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Globe',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, primary_key=True, auto_created=True)),
                ('name', models.CharField(max_length=240, unique=True)),
                ('description', models.TextField()),
                ('geo_json', models.TextField(verbose_name='GeoJSON')),
                ('created', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('last_modified', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
    ]
