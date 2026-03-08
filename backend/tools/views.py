from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.db.models import Count, Q, Avg, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Machine, Component, Master, MachineTools, ToolBOM, ToolBOMDetail,
    ToolShape, ToolLife, ToolOtherDetails, ToolTrialMaster,
    PlanningData, ToolMasterImport, SKUCounter,
    SUBASSEMBLY_FIELD_CONFIG, SUBASSEMBLY_CODE_MAP,
)
from .serializers import (
    UserSerializer, MachineSerializer, MachineListSerializer,
    ComponentSerializer, MasterSerializer, MachineToolsListSerializer,
    MachineToolsDetailSerializer, ToolBOMSerializer, ToolBOMDetailSerializer,
    ToolShapeSerializer, ToolLifeSerializer, ToolOtherDetailsSerializer,
    ToolTrialListSerializer, ToolTrialDetailSerializer, ToolTrialCreateSerializer,
    PlanningDataSerializer, ToolMasterImportSerializer,
)


# ============================================================================
# Auth
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_me(request):
    user = request.user
    groups = list(user.groups.values_list('name', flat=True))
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': groups[0] if groups else 'operator',
    })


# ============================================================================
# Dashboard
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    machines = Machine.objects.filter(status='ACTIVE')
    total_tools = MachineTools.objects.count()
    active_trials = ToolTrialMaster.objects.filter(status__in=['DRAFT', 'SUBMITTED', 'PENDING']).count()
    life_critical = MachineTools.objects.filter(
        initial_life__gt=0
    ).extra(
        where=["life_used * 100 / initial_life >= 80"]
    ).count() if MachineTools.objects.filter(initial_life__gt=0).exists() else 0

    recent_trials = ToolTrialMaster.objects.order_by('-created_at')[:10]

    return Response({
        'machines': MachineListSerializer(machines, many=True).data,
        'stats': {
            'total_machines': machines.count(),
            'total_tools': total_tools,
            'active_trials': active_trials,
            'life_critical': life_critical,
        },
        'recent_trials': ToolTrialListSerializer(recent_trials, many=True).data,
    })


# ============================================================================
# Machine ViewSet
# ============================================================================
class MachineViewSet(viewsets.ModelViewSet):
    queryset = Machine.objects.all()
    serializer_class = MachineSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['machine_type', 'status']
    search_fields = ['machine_id', 'machine_name', 'manufacturer']

    def get_serializer_class(self):
        if self.action == 'list':
            return MachineListSerializer
        return MachineSerializer

    @action(detail=True, methods=['get'])
    def components(self, request, pk=None):
        machine = self.get_object()
        components = machine.components.all()
        return Response(ComponentSerializer(components, many=True).data)


# ============================================================================
# Component ViewSet
# ============================================================================
class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.select_related('machine').all()
    serializer_class = ComponentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['machine', 'status']
    search_fields = ['component_name', 'part_number', 'customer']


# ============================================================================
# Master ViewSet
# ============================================================================
class MasterViewSet(viewsets.ModelViewSet):
    queryset = Master.objects.all()
    serializer_class = MasterSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['master_type', 'status']
    search_fields = ['code', 'name', 'description']


# ============================================================================
# Tool Slots (MachineTools) ViewSet
# ============================================================================
class ToolSlotViewSet(viewsets.ModelViewSet):
    queryset = MachineTools.objects.select_related('machine', 'component').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['machine', 'component', 'asset_type', 'status', 'category']
    search_fields = ['tool_number', 'tool_name']
    ordering_fields = ['tool_number', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MachineToolsDetailSerializer
        return MachineToolsListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        machine_id_code = self.request.query_params.get('machine_id_code')
        if machine_id_code:
            qs = qs.filter(machine__machine_id=machine_id_code)
        component_id = self.request.query_params.get('component_id')
        if component_id:
            qs = qs.filter(component_id=component_id)
        return qs

    def create(self, request, *args, **kwargs):
        """Auto-assign T01-T60 tool number. Max 60 tools per machine+component."""
        from django.db import IntegrityError
        machine_id = request.data.get('machine')
        component_id = request.data.get('component')
        if not machine_id:
            return Response({'error': 'machine is required'}, status=400)

        # Unique constraint is (machine, tool_number), so check ALL tools on this machine
        all_machine_tools = MachineTools.objects.filter(machine_id=machine_id)
        if all_machine_tools.count() >= 60:
            return Response({'error': 'Maximum 60 tools per machine'}, status=400)

        # Find next available tool number across the entire machine
        used_numbers = set(all_machine_tools.values_list('tool_number', flat=True))
        next_num = None
        for i in range(1, 61):
            tn = f'T{i:02d}'
            if tn not in used_numbers:
                next_num = tn
                break
        if not next_num:
            return Response({'error': 'No available tool numbers (T01-T60)'}, status=400)

        tool_name = request.data.get('tool_name') or f'Tool {next_num}'
        try:
            tool = MachineTools.objects.create(
                machine_id=machine_id,
                component_id=component_id or None,
                tool_number=next_num,
                pocket_number=request.data.get('pocket_number', ''),
                tool_name=tool_name,
                category=request.data.get('category', 'OTHER'),
            )
        except IntegrityError:
            return Response({'error': f'Tool number {next_num} already exists on this machine. Please try again.'}, status=409)
        serializer = self.get_serializer(tool)
        return Response(serializer.data, status=201)

    @action(detail=False, methods=['get'])
    def next_tool_number(self, request):
        """GET /api/tool-slots/next_tool_number/?machine=X&component=Y"""
        machine_id = request.query_params.get('machine')
        if not machine_id:
            return Response({'error': 'machine param required'}, status=400)

        # Check all tools on this machine (unique constraint is machine + tool_number)
        all_machine_tools = MachineTools.objects.filter(machine_id=machine_id)
        used_numbers = set(all_machine_tools.values_list('tool_number', flat=True))
        next_num = None
        for i in range(1, 61):
            tn = f'T{i:02d}'
            if tn not in used_numbers:
                next_num = tn
                break

        return Response({
            'next_tool_number': next_num,
            'tools_count': all_machine_tools.count(),
            'max_tools': 60,
            'used_numbers': sorted(list(used_numbers)),
        })

    @action(detail=True, methods=['get'])
    def bom(self, request, pk=None):
        tool = self.get_object()
        bom_items = tool.bom_items.select_related('master_item', 'supplier').all()
        return Response(ToolBOMSerializer(bom_items, many=True).data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_drawing(self, request, pk=None):
        tool = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        tool.drawing_file = file
        tool.save()
        return Response({'message': 'Drawing uploaded', 'file_url': tool.drawing_file.url})

    @action(detail=True, methods=['get'])
    def trial_history(self, request, pk=None):
        tool = self.get_object()
        trials = tool.trial_masters.order_by('-created_at')
        return Response(ToolTrialListSerializer(trials, many=True).data)


# ============================================================================
# ToolBOM ViewSet
# ============================================================================
class ToolBOMViewSet(viewsets.ModelViewSet):
    queryset = ToolBOM.objects.select_related('master_item', 'supplier').all()
    serializer_class = ToolBOMSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tool', 'bom_type']

    def perform_create(self, serializer):
        bom = serializer.save()  # sku auto-generated in model save()
        detail_data = self.request.data.get('detail')
        if detail_data and isinstance(detail_data, dict):
            ToolBOMDetail.objects.update_or_create(bom=bom, defaults=detail_data)

    def perform_update(self, serializer):
        bom = serializer.save()
        detail_data = self.request.data.get('detail')
        if detail_data and isinstance(detail_data, dict):
            detail_obj = getattr(bom, 'detail', None)
            if detail_obj and detail_obj.is_locked:
                return  # locked data cannot be edited directly
            ToolBOMDetail.objects.update_or_create(bom=bom, defaults=detail_data)

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """Lock subassembly data so it can only be changed via Trial."""
        bom = self.get_object()
        detail, _ = ToolBOMDetail.objects.get_or_create(bom=bom)
        detail.is_locked = True
        detail.save()
        return Response({'message': 'Subassembly data locked', 'is_locked': True})

    @action(detail=True, methods=['post'])
    def save_detail(self, request, pk=None):
        """
        Save shape/life/params/other data for a BOM item.
        Body: { section: 'shape'|'life'|'params'|'other', data: {...} }
        OR: { shape_data: {...}, life_data: {...}, parameter_data: {...}, other_data: {...} }
        """
        bom = self.get_object()
        detail, _ = ToolBOMDetail.objects.get_or_create(bom=bom)
        if detail.is_locked:
            return Response({'error': 'Data is locked. Use Replace to create a Trial.'}, status=403)

        section = request.data.get('section')
        if section and 'data' in request.data:
            field_data = request.data['data']
            if section == 'shape':
                detail.shape_data = field_data
            elif section == 'life':
                detail.life_data = field_data
            elif section == 'params':
                detail.parameter_data = field_data
            elif section == 'other':
                detail.other_data = field_data
            else:
                return Response({'error': 'Invalid section'}, status=400)
            detail.save()
        else:
            for key, attr in [('shape_data', 'shape_data'), ('life_data', 'life_data'),
                              ('parameter_data', 'parameter_data'), ('other_data', 'other_data')]:
                if key in request.data and isinstance(request.data[key], dict):
                    setattr(detail, attr, request.data[key])
            detail.save()

        from .serializers import ToolBOMDetailSerializer
        return Response(ToolBOMDetailSerializer(detail).data)


# ============================================================================
# ToolShape / ToolLife / ToolOtherDetails
# ============================================================================
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def tool_shape_view(request, tool_id):
    try:
        tool = MachineTools.objects.get(pk=tool_id)
    except MachineTools.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)

    shape, _ = ToolShape.objects.get_or_create(tool=tool)
    if request.method == 'GET':
        return Response(ToolShapeSerializer(shape).data)

    serializer = ToolShapeSerializer(shape, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def tool_life_view(request, tool_id):
    try:
        tool = MachineTools.objects.get(pk=tool_id)
    except MachineTools.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)

    life, _ = ToolLife.objects.get_or_create(tool=tool)
    if request.method == 'GET':
        return Response(ToolLifeSerializer(life).data)

    serializer = ToolLifeSerializer(life, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def tool_other_details_view(request, tool_id):
    try:
        tool = MachineTools.objects.get(pk=tool_id)
    except MachineTools.DoesNotExist:
        return Response({'error': 'Tool not found'}, status=404)

    other, _ = ToolOtherDetails.objects.get_or_create(tool=tool)
    if request.method == 'GET':
        return Response(ToolOtherDetailsSerializer(other).data)

    serializer = ToolOtherDetailsSerializer(other, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# ============================================================================
# Trial ViewSet
# ============================================================================
class TrialViewSet(viewsets.ModelViewSet):
    queryset = ToolTrialMaster.objects.select_related('tool', 'tool__machine', 'tool__component').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'trial_result', 'tool__machine']
    search_fields = ['tool_number', 'tool_name', 'machine_name', 'component_name']
    ordering_fields = ['created_at', 'trial_date']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ToolTrialCreateSerializer
        if self.action == 'retrieve':
            return ToolTrialDetailSerializer
        return ToolTrialListSerializer

    @action(detail=False, methods=['get'])
    def active_summary(self, request):
        active = self.queryset.filter(status__in=['DRAFT', 'SUBMITTED', 'PENDING'])
        total_savings = active.aggregate(s=Sum('monthly_savings'))['s'] or 0
        return Response({
            'active_count': active.count(),
            'total_monthly_savings': float(total_savings),
            'by_status': {
                'draft': active.filter(status='DRAFT').count(),
                'submitted': active.filter(status='SUBMITTED').count(),
                'pending': active.filter(status='PENDING').count(),
            }
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        trial = self.get_object()
        if trial.status not in ('SUBMITTED', 'PENDING'):
            return Response({'error': f'Cannot approve trial with status {trial.status}'}, status=400)
        approved_by = request.data.get('approved_by', request.user.username)
        trial.approve(approved_by)
        return Response(ToolTrialDetailSerializer(trial).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        trial = self.get_object()
        if trial.status not in ('SUBMITTED', 'PENDING'):
            return Response({'error': f'Cannot reject trial with status {trial.status}'}, status=400)
        reason = request.data.get('reason', '')
        if not reason:
            return Response({'error': 'Rejection reason is required'}, status=400)
        rejected_by = request.data.get('rejected_by', request.user.username)
        trial.reject(rejected_by, reason)
        return Response(ToolTrialDetailSerializer(trial).data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        trial = self.get_object()
        if trial.status != 'DRAFT':
            return Response({'error': 'Only draft trials can be submitted'}, status=400)
        trial.status = 'SUBMITTED'
        trial.submitted_at = timezone.now()
        trial.conducted_by = request.data.get('conducted_by', request.user.username)
        trial.save()
        return Response(ToolTrialDetailSerializer(trial).data)

    @action(detail=False, methods=['get'], url_path='slot/(?P<slot_id>[^/.]+)/history')
    def slot_history(self, request, slot_id=None):
        trials = ToolTrialMaster.objects.filter(tool_id=slot_id).order_by('-created_at')
        return Response(ToolTrialListSerializer(trials, many=True).data)

    @action(detail=True, methods=['post'])
    def replace_subassembly(self, request, pk=None):
        """Replace BOM detail data with approved trial data for the target BOM item."""
        trial = self.get_object()
        if trial.status != 'APPROVED':
            return Response({'error': 'Only approved trials can replace subassembly data'}, status=400)

        bom_id = request.data.get('bom_id')
        replace_all = request.data.get('replace_all', False)

        tool = trial.tool
        bom_qs = tool.bom_items.all()
        if not bom_qs.exists():
            return Response({'error': 'No BOM items found for this tool'}, status=404)

        # Map trial data into BOM detail fields
        new_shape = {}
        new_params = {}
        new_life = {}
        new_other = {}

        if trial.new_manufacturer:
            new_other['manufacturer'] = trial.new_manufacturer
        if trial.new_insert_code:
            new_shape['insert_shape'] = trial.new_insert_code
        if trial.new_cutting_edges:
            new_shape['number_of_cutting_edges'] = trial.new_cutting_edges
        if trial.new_cutting_speed:
            new_params['vc'] = str(trial.new_cutting_speed)
        if trial.new_feed:
            new_params['feed'] = str(trial.new_feed)
        if trial.new_feed_per_tooth:
            new_params['feed_per_tooth'] = str(trial.new_feed_per_tooth)
        if trial.new_tool_life:
            new_life['overall_life'] = trial.new_tool_life
        if trial.new_cutting_time:
            new_params['cutting_time'] = str(trial.new_cutting_time)
        if trial.new_coolant:
            new_params['coolant'] = trial.new_coolant
        if trial.spindle_speed:
            new_params['rpm'] = str(trial.spindle_speed)

        # Also map extended fields stored in JSONField-style patterns
        extra_fields = request.data.get('extra_fields', {})
        for k, v in extra_fields.items():
            if k.startswith('new_') and v:
                clean_key = k[4:]  # strip 'new_'
                if clean_key in ('rpm', 'feed', 'feed_per_tooth', 'feed_per_rev', 'cutting_speed',
                                 'cutting_time', 'cutting_time_min', 'cutting_time_sec',
                                 'cutting_length', 'total_cutting_length', 'depth_of_cut',
                                 'no_of_passes', 'coolant', 'surface_finish'):
                    new_params[clean_key] = v
                elif clean_key in ('tool_life', 'tool_life_m', 'overall_life', 'life_per_edge'):
                    new_life[clean_key] = v
                elif clean_key in ('manufacturer', 'rate', 'cpc', 'overall_cpc', 'insert_cost',
                                   'total_insert_cost', 'avg_life_per_corner',
                                   'cost_per_component', 'tool_cost_per_component',
                                   'overall_cost_per_component'):
                    new_other[clean_key] = v
                else:
                    new_shape[clean_key] = v

        updated_count = 0
        target_boms = bom_qs if replace_all else bom_qs.filter(id=bom_id) if bom_id else bom_qs

        for bom in target_boms:
            detail, _ = ToolBOMDetail.objects.get_or_create(bom=bom)
            if new_shape:
                detail.shape_data = {**detail.shape_data, **new_shape}
            if new_params:
                detail.parameter_data = {**detail.parameter_data, **new_params}
            if new_life:
                detail.life_data = {**detail.life_data, **new_life}
            if new_other:
                detail.other_data = {**detail.other_data, **new_other}
            # Store trial reference in other_data
            detail.other_data['replaced_from_trial'] = trial.id
            detail.other_data['trial_data'] = {
                'manufacturer': trial.new_manufacturer or '',
                'insert_code': trial.new_insert_code or '',
                'grade': getattr(trial, 'new_grade', '') or '',
                'cutting_edges': trial.new_cutting_edges,
                'cutting_speed': str(trial.new_cutting_speed) if trial.new_cutting_speed else '',
                'feed': str(trial.new_feed) if trial.new_feed else '',
                'rpm': str(trial.spindle_speed) if trial.spindle_speed else '',
                'tool_life_components': trial.new_tool_life,
            }
            detail.save()
            updated_count += 1

        return Response({
            'message': f'Replaced data in {updated_count} BOM item(s) from trial #{trial.id}',
            'updated_count': updated_count,
        })

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Generate a trial report PDF."""
        trial = self.get_object()
        from .pdf_report import generate_trial_pdf
        pdf_buffer = generate_trial_pdf(trial)
        from django.http import HttpResponse
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="trial_report_{trial.id}.pdf"'
        return response


# ============================================================================
# Planning
# ============================================================================
class PlanningViewSet(viewsets.ModelViewSet):
    queryset = PlanningData.objects.select_related('machine', 'component', 'tool').all()
    serializer_class = PlanningDataSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['machine', 'component', 'month']

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        machine_id = request.data.get('machine_id')
        component_id = request.data.get('component_id')
        production_qty = int(request.data.get('production_qty', 0))
        month = request.data.get('month')

        if not all([machine_id, component_id, production_qty, month]):
            return Response({'error': 'machine_id, component_id, production_qty, month required'}, status=400)

        tools = MachineTools.objects.filter(machine_id=machine_id, component_id=component_id, status='ACTIVE')
        results = []
        for tool in tools:
            tool_life = tool.initial_life or 1
            tools_required = max(1, -(-production_qty // tool_life))
            inserts_required = tools_required * 2
            est_cost = float(tool.cost or 0) * tools_required

            pd, _ = PlanningData.objects.update_or_create(
                machine_id=machine_id, component_id=component_id, tool=tool, month=month,
                defaults={
                    'production_qty': production_qty,
                    'tool_life_per_component': tool_life,
                    'tools_required': tools_required,
                    'inserts_required': inserts_required,
                    'estimated_cost': est_cost,
                }
            )
            results.append(PlanningDataSerializer(pd).data)

        return Response({'results': results, 'total_tools': len(results)})

    @action(detail=False, methods=['get'])
    def summary(self, request):
        active_tools = MachineTools.objects.filter(status='ACTIVE').count()
        avg_life = MachineTools.objects.filter(initial_life__gt=0).aggregate(avg=Avg('initial_life'))['avg'] or 0
        required_soon = MachineTools.objects.filter(
            initial_life__gt=0
        ).extra(where=["life_used * 100 / initial_life >= 70"]).count()

        return Response({
            'active_tools': active_tools,
            'required_soon': required_soon,
            'avg_tool_life': round(float(avg_life), 1),
        })


# ============================================================================
# Import
# ============================================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def import_tool_master(request):
    if request.method == 'GET':
        imports = ToolMasterImport.objects.all()[:50]
        return Response(ToolMasterImportSerializer(imports, many=True).data)

    rows = request.data.get('rows', [])
    if not rows:
        return Response({'error': 'No rows provided'}, status=400)

    import_record = ToolMasterImport.objects.create(
        imported_by=request.user,
        total_rows=len(rows),
        status='pending',
    )

    success = 0
    errors = []
    for i, row in enumerate(rows):
        try:
            master_type = row.get('type', 'CUTTING_TOOL')
            code = row.get('code') or row.get('sku', '')
            name = row.get('name', '')
            if not code:
                prefix_map = {'PULLSTUD': 'PS', 'ADAPTOR': 'AD', 'CUTTING_TOOL': 'TL', 'INSERT': 'IN', 'COLLET': 'NC'}
                prefix = prefix_map.get(master_type, 'TL')
                code = SKUCounter.next_sku(prefix, name[:8].upper().replace(' ', ''))

            Master.objects.update_or_create(
                code=code,
                defaults={
                    'master_type': master_type,
                    'name': name,
                    'description': row.get('description', ''),
                    'specifications': row.get('specifications', {}),
                    'status': 'ACTIVE',
                }
            )
            success += 1
        except Exception as e:
            errors.append({'row': i + 1, 'error': str(e)})

    import_record.success_count = success
    import_record.error_count = len(errors)
    import_record.errors = errors
    import_record.data = rows
    import_record.status = 'completed' if not errors else 'failed' if success == 0 else 'completed'
    import_record.save()

    return Response(ToolMasterImportSerializer(import_record).data, status=201)


# ============================================================================
# Subassembly Field Config & Parameter Calculations
# ============================================================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subassembly_field_config(request):
    """Return dynamic form field configuration for all subassembly types."""
    bom_type = request.query_params.get('bom_type')
    if bom_type:
        config = SUBASSEMBLY_FIELD_CONFIG.get(bom_type)
        if not config:
            return Response({'error': f'Unknown bom_type: {bom_type}'}, status=400)
        return Response({bom_type: config})
    return Response(SUBASSEMBLY_FIELD_CONFIG)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_parameters(request):
    """
    Auto-calculate RPM and Feed.
    RPM = (1000 * Vc) / (pi * Tool_Diameter)
    Feed = RPM * Feed_per_tooth * Number_of_teeth
    Overall_Life = Life_per_edge * Number_of_edges
    """
    import math
    vc = float(request.data.get('vc', 0))
    tool_diameter = float(request.data.get('tool_diameter', 0))
    feed_per_tooth = float(request.data.get('feed_per_tooth', 0))
    number_of_teeth = int(request.data.get('number_of_teeth') or request.data.get('number_of_flutes') or 0)
    life_per_edge = float(request.data.get('life_per_edge', 0))
    number_of_edges = int(request.data.get('number_of_cutting_edges', 0))

    result = {}
    if vc > 0 and tool_diameter > 0:
        result['rpm'] = round((1000 * vc) / (math.pi * tool_diameter))
    if result.get('rpm') and feed_per_tooth > 0 and number_of_teeth > 0:
        result['feed'] = round(result['rpm'] * feed_per_tooth * number_of_teeth, 4)
    if life_per_edge > 0 and number_of_edges > 0:
        result['overall_life'] = round(life_per_edge * number_of_edges)

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subassembly_codes(request):
    """Return subassembly code map for SKU display."""
    return Response(SUBASSEMBLY_CODE_MAP)
