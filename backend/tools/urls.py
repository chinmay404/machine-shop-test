from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'machines', views.MachineViewSet)
router.register(r'components', views.ComponentViewSet)
router.register(r'masters', views.MasterViewSet)
router.register(r'tool-slots', views.ToolSlotViewSet)
router.register(r'tool-bom', views.ToolBOMViewSet)
router.register(r'trials', views.TrialViewSet)
router.register(r'planning', views.PlanningViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/me/', views.auth_me, name='auth-me'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('tool-slots/<int:tool_id>/shape/', views.tool_shape_view, name='tool-shape'),
    path('tool-slots/<int:tool_id>/life/', views.tool_life_view, name='tool-life'),
    path('tool-slots/<int:tool_id>/other/', views.tool_other_details_view, name='tool-other'),
    path('import/tool-master/', views.import_tool_master, name='import-tool-master'),
    path('subassembly/field-config/', views.subassembly_field_config, name='subassembly-field-config'),
    path('subassembly/calculate-params/', views.calculate_parameters, name='calculate-params'),
    path('subassembly/codes/', views.subassembly_codes, name='subassembly-codes'),
]
