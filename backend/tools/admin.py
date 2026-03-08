from django.contrib import admin
from .models import (
    Machine, Component, Master, MachineTools, ToolBOM, ToolBOMDetail,
    ToolShape, ToolLife, ToolOtherDetails, ToolTrialMaster,
    ToolTrialAdaptor, ToolTrialCuttingTool, ToolTrialInsert,
    ToolTrialPullstud, PlanningData, ToolMasterImport, SKUCounter,
)


@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    list_display = ['machine_id', 'machine_name', 'machine_type', 'status']
    list_filter = ['machine_type', 'status']
    search_fields = ['machine_id', 'machine_name']


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ['component_name', 'machine', 'operation', 'status']
    list_filter = ['machine', 'status']
    search_fields = ['component_name', 'part_number']


@admin.register(Master)
class MasterAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'master_type', 'status']
    list_filter = ['master_type', 'status']
    search_fields = ['code', 'name']


@admin.register(MachineTools)
class MachineToolsAdmin(admin.ModelAdmin):
    list_display = ['tool_number', 'tool_name', 'machine', 'component', 'category', 'status']
    list_filter = ['machine', 'category', 'status', 'asset_type']
    search_fields = ['tool_number', 'tool_name']


class ToolBOMDetailInline(admin.StackedInline):
    model = ToolBOMDetail
    extra = 0


@admin.register(ToolBOM)
class ToolBOMAdmin(admin.ModelAdmin):
    list_display = ['tool', 'bom_type', 'master_item', 'supplier']
    list_filter = ['bom_type']
    inlines = [ToolBOMDetailInline]


class ToolTrialAdaptorInline(admin.StackedInline):
    model = ToolTrialAdaptor
    extra = 0


class ToolTrialInsertInline(admin.StackedInline):
    model = ToolTrialInsert
    extra = 0


class ToolTrialPullstudInline(admin.StackedInline):
    model = ToolTrialPullstud
    extra = 0


@admin.register(ToolTrialMaster)
class ToolTrialMasterAdmin(admin.ModelAdmin):
    list_display = ['id', 'tool_number', 'tool_name', 'machine_name', 'status', 'trial_result', 'trial_date']
    list_filter = ['status', 'trial_result']
    search_fields = ['tool_number', 'tool_name', 'machine_name']
    inlines = [ToolTrialAdaptorInline, ToolTrialInsertInline, ToolTrialPullstudInline]


@admin.register(PlanningData)
class PlanningDataAdmin(admin.ModelAdmin):
    list_display = ['machine', 'component', 'tool', 'production_qty', 'tools_required', 'month']
    list_filter = ['machine', 'month']


@admin.register(SKUCounter)
class SKUCounterAdmin(admin.ModelAdmin):
    list_display = ['prefix', 'current_value']
