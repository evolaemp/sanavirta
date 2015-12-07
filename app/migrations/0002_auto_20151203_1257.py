# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Language',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, verbose_name='ID', primary_key=True)),
                ('iso_code', models.CharField(max_length=3, unique=True, verbose_name='ISO 639-3')),
                ('latitude', models.FloatField(null=True)),
                ('longitude', models.FloatField(null=True)),
                ('created', models.DateTimeField(help_text='Timestamp of database entry creation.', default=django.utils.timezone.now, editable=False)),
                ('last_modified', models.DateTimeField(help_text='Timestamp of last database modification.', default=django.utils.timezone.now, editable=False)),
            ],
            options={
                'ordering': ['iso_code'],
            },
        ),
        migrations.AlterField(
            model_name='globe',
            name='created',
            field=models.DateTimeField(help_text='Timestamp of database entry creation.', default=django.utils.timezone.now, editable=False),
        ),
        migrations.AlterField(
            model_name='globe',
            name='last_modified',
            field=models.DateTimeField(help_text='Timestamp of last database modification.', default=django.utils.timezone.now, editable=False),
        ),
    ]
