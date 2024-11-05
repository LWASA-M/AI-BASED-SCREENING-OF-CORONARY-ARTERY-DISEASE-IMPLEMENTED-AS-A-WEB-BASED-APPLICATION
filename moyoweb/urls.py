# myapp/urls.py
from django.urls import path
from . import views

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin

urlpatterns = [
path('admin/', admin.site.urls),
    path('result/', views.view_results, name='view_results'),
    path('assessment/', views.show_inner_page, name='show_inner_page'),
    path('', views.index, name='index')
]+ static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
