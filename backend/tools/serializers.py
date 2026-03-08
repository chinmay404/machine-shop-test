from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Machine, Component, Master, MachineTools, ToolBOM, ToolBOMDetail,
    ToolShape, ToolLife, ToolOtherDetails, ToolTrialMaster,
    ToolTrialAdaptor, ToolTrialCuttingTool, ToolTrialInsert,
    ToolTrialPullstud, PlanningData, ToolMasterImport,
)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']

    def get_role(self, obj):
        return getattr(obj, '_role', obj.groups.first().name if obj.groups.exists() else 'operator')


# ============================================================================
# Machine & Component
# ============================================================================
class ComponentSerializer(serializers.ModelSerializer):
    machine_id_code = serializers.CharField(source='machine.machine_id', read_only=True)

    class Meta:
        model = Component
        fields = '__all__'


class MachineSerializer(serializers.ModelSerializer):
    components = ComponentSerializer(many=True, read_only=True)
    tool_count = serializers.SerializerMethodField()

    class Meta:
        model = Machine
        fields = '__all__'

    def get_tool_count(self, obj):
        return obj.tools.count()


class MachineListSerializer(serializers.ModelSerializer):
    component_count = serializers.SerializerMethodField()
    tool_count = serializers.SerializerMethodField()

    class Meta:
        model = Machine
        fields = ['id', 'machine_id', 'machine_name', 'machine_type', 'manufacturer',
                  'spindle_type', 'max_rpm', 'max_tools', 'status', 'component_count', 'tool_count']

    def get_component_count(self, obj):
        return obj.components.count()

    def get_tool_count(self, obj):
        return obj.tools.count()


# ============================================================================
# Master
# ============================================================================
class MasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Master
        fields = '__all__'


# ============================================================================
# ToolBOM
# ============================================================================
class ToolBOMDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolBOMDetail
        exclude = ['bom']


class ToolBOMSerializer(serializers.ModelSerializer):
    detail = ToolBOMDetailSerializer(read_only=True)
    master_item_name = serializers.CharField(source='master_item.name', read_only=True, default='')
    master_item_code = serializers.CharField(source='master_item.code', read_only=True, default='')
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, default='')
    sku = serializers.CharField(read_only=True)

    class Meta:
        model = ToolBOM
        fields = '__all__'


# ============================================================================
# Tool Shape / Life / Other
# ============================================================================
class ToolShapeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolShape
        exclude = ['tool']


class ToolLifeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolLife
        exclude = ['tool']


class ToolOtherDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolOtherDetails
        exclude = ['tool']


# ============================================================================
# MachineTools (Tool Slots)
# ============================================================================
class MachineToolsListSerializer(serializers.ModelSerializer):
    machine_id_code = serializers.CharField(source='machine.machine_id', read_only=True)
    component_name = serializers.CharField(source='component.component_name', read_only=True, default='')
    life_percentage = serializers.SerializerMethodField()
    trial_status = serializers.SerializerMethodField()

    class Meta:
        model = MachineTools
        fields = ['id', 'machine_id', 'machine_id_code', 'component_id', 'component_name',
                  'tool_number', 'pocket_number', 'tool_name', 'category', 'status', 'trial_required',
                  'life_percentage', 'trial_status', 'initial_life', 'current_life', 'life_used']

    def get_life_percentage(self, obj):
        return obj.get_life_percentage()

    def get_trial_status(self, obj):
        latest = obj.trial_masters.order_by('-created_at').first()
        if latest:
            return latest.status
        return None


class MachineToolsDetailSerializer(serializers.ModelSerializer):
    machine_id_code = serializers.CharField(source='machine.machine_id', read_only=True)
    machine_name = serializers.CharField(source='machine.machine_name', read_only=True)
    component_name = serializers.CharField(source='component.component_name', read_only=True, default='')
    bom_items = ToolBOMSerializer(many=True, read_only=True)
    shape_data = ToolShapeSerializer(read_only=True)
    life_data = ToolLifeSerializer(read_only=True)
    other_details = ToolOtherDetailsSerializer(read_only=True)
    life_percentage = serializers.SerializerMethodField()
    trial_history = serializers.SerializerMethodField()

    class Meta:
        model = MachineTools
        fields = '__all__'

    def get_life_percentage(self, obj):
        return obj.get_life_percentage()

    def get_trial_history(self, obj):
        trials = obj.trial_masters.order_by('-created_at')[:10]
        return ToolTrialListSerializer(trials, many=True).data


# ============================================================================
# Trial
# ============================================================================
class ToolTrialAdaptorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolTrialAdaptor
        exclude = ['trial']


class ToolTrialCuttingToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolTrialCuttingTool
        exclude = ['trial']


class ToolTrialInsertSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolTrialInsert
        exclude = ['trial']


class ToolTrialPullstudSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolTrialPullstud
        exclude = ['trial']


class ToolTrialListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolTrialMaster
        fields = ['id', 'tool_id', 'machine_name', 'component_name', 'tool_number',
                  'tool_name', 'operation', 'part_name', 'part_material', 'customer',
                  'trial_result', 'trial_date', 'status', 'conducted_by',
                  'approved_by', 'existing_manufacturer', 'new_manufacturer',
                  'existing_insert_code', 'existing_cutting_edges', 'existing_cutting_speed',
                  'existing_feed', 'existing_coolant', 'existing_tool_life', 'existing_cutting_time',
                  'new_insert_code', 'new_cutting_edges', 'new_cutting_speed',
                  'new_feed', 'new_coolant', 'new_tool_life', 'new_cutting_time',
                  'spindle_speed', 'feed_rate', 'depth_of_cut', 'cutting_speed',
                  'target_quantity', 'test_pieces_qty', 'surface_finish_ra', 'tool_life_achieved',
                  'existing_cost_per_component', 'new_cost_per_component',
                  'savings_per_component', 'monthly_savings', 'remarks', 'created_at']


class ToolTrialDetailSerializer(serializers.ModelSerializer):
    adaptor = ToolTrialAdaptorSerializer(read_only=True)
    cutting_tools = ToolTrialCuttingToolSerializer(many=True, read_only=True)
    insert_detail = ToolTrialInsertSerializer(read_only=True)
    pullstud = ToolTrialPullstudSerializer(read_only=True)

    class Meta:
        model = ToolTrialMaster
        fields = '__all__'


class ToolTrialCreateSerializer(serializers.ModelSerializer):
    adaptor = ToolTrialAdaptorSerializer(required=False)
    cutting_tools = ToolTrialCuttingToolSerializer(many=True, required=False)
    insert_detail = ToolTrialInsertSerializer(required=False)
    pullstud = ToolTrialPullstudSerializer(required=False)

    class Meta:
        model = ToolTrialMaster
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'submitted_at', 'approved_at']

    def create(self, validated_data):
        adaptor_data = validated_data.pop('adaptor', None)
        cutting_tools_data = validated_data.pop('cutting_tools', [])
        insert_data = validated_data.pop('insert_detail', None)
        pullstud_data = validated_data.pop('pullstud', None)

        trial = ToolTrialMaster.objects.create(**validated_data)

        if adaptor_data:
            ToolTrialAdaptor.objects.create(trial=trial, **adaptor_data)
        for ct in cutting_tools_data:
            ToolTrialCuttingTool.objects.create(trial=trial, **ct)
        if insert_data:
            ToolTrialInsert.objects.create(trial=trial, **insert_data)
        if pullstud_data:
            ToolTrialPullstud.objects.create(trial=trial, **pullstud_data)

        return trial

    def update(self, instance, validated_data):
        adaptor_data = validated_data.pop('adaptor', None)
        cutting_tools_data = validated_data.pop('cutting_tools', None)
        insert_data = validated_data.pop('insert_detail', None)
        pullstud_data = validated_data.pop('pullstud', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if adaptor_data is not None:
            ToolTrialAdaptor.objects.update_or_create(trial=instance, defaults=adaptor_data)
        if cutting_tools_data is not None:
            instance.cutting_tools.all().delete()
            for ct in cutting_tools_data:
                ToolTrialCuttingTool.objects.create(trial=instance, **ct)
        if insert_data is not None:
            ToolTrialInsert.objects.update_or_create(trial=instance, defaults=insert_data)
        if pullstud_data is not None:
            ToolTrialPullstud.objects.update_or_create(trial=instance, defaults=pullstud_data)

        return instance


# ============================================================================
# Planning
# ============================================================================
class PlanningDataSerializer(serializers.ModelSerializer):
    machine_name = serializers.CharField(source='machine.machine_name', read_only=True)
    component_name = serializers.CharField(source='component.component_name', read_only=True)
    tool_number = serializers.CharField(source='tool.tool_number', read_only=True)
    tool_name = serializers.CharField(source='tool.tool_name', read_only=True)

    class Meta:
        model = PlanningData
        fields = '__all__'


# ============================================================================
# Import
# ============================================================================
class ToolMasterImportSerializer(serializers.ModelSerializer):
    imported_by_name = serializers.CharField(source='imported_by.username', read_only=True, default='')

    class Meta:
        model = ToolMasterImport
        fields = '__all__'
