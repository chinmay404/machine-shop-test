from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone


# ============================================================================
# Machine
# ============================================================================
class Machine(models.Model):
    MACHINE_TYPES = [
        ('HMC', 'Horizontal Machining Center'),
        ('VMC', 'Vertical Machining Center'),
        ('CNC', 'CNC Machine'),
        ('LATHE', 'CNC Lathe'),
    ]
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('INACTIVE', 'Inactive'), ('MAINTENANCE', 'Maintenance')]

    machine_id = models.CharField(max_length=50, unique=True)
    machine_name = models.CharField(max_length=100)
    machine_type = models.CharField(max_length=20, choices=MACHINE_TYPES, default='HMC')
    manufacturer = models.CharField(max_length=100, blank=True, default='')
    model_number = models.CharField(max_length=100, blank=True, default='')
    spindle_type = models.CharField(max_length=50, blank=True, default='')
    max_rpm = models.IntegerField(null=True, blank=True)
    max_tools = models.IntegerField(default=60)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'machines'
        ordering = ['machine_id']

    def __str__(self):
        return f"{self.machine_id} - {self.machine_name}"


# ============================================================================
# Component
# ============================================================================
class Component(models.Model):
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='components')
    component_name = models.CharField(max_length=150)
    part_number = models.CharField(max_length=100, blank=True, default='')
    material = models.CharField(max_length=100, blank=True, default='')
    customer = models.CharField(max_length=200, blank=True, default='')
    drawing_number = models.CharField(max_length=100, blank=True, default='')
    operation = models.CharField(max_length=100, blank=True, default='')
    cycle_time_minutes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'components'
        ordering = ['component_name']
        unique_together = [['machine', 'component_name', 'operation']]

    def __str__(self):
        return f"{self.machine.machine_id} - {self.component_name}"


# ============================================================================
# Unified Master Table
# ============================================================================
class Master(models.Model):
    MASTER_TYPE_CHOICES = [
        ('PULLSTUD', 'Pull Stud'),
        ('ADAPTOR', 'Adaptor'),
        ('COLLET', 'Collet'),
        ('CUTTING_TOOL', 'Cutting Tool'),
        ('INSERT', 'Insert'),
        ('SUPPLIER', 'Supplier'),
    ]
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('INACTIVE', 'Inactive')]

    master_type = models.CharField(max_length=20, choices=MASTER_TYPE_CHOICES, db_index=True)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    specifications = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'masters'
        ordering = ['master_type', 'name']
        indexes = [models.Index(fields=['master_type', 'status'])]

    def __str__(self):
        return f"[{self.master_type}] {self.code} - {self.name}"


# ============================================================================
# MachineTools (Tool Slots)
# ============================================================================
class MachineTools(models.Model):
    TOOL_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('TRIAL_PENDING', 'Trial Pending'),
        ('ACTIVE', 'Active'),
        ('TRIAL', 'Trial'),
        ('WORN_OUT', 'Worn Out'),
        ('INACTIVE', 'Inactive'),
    ]
    ASSET_TYPE_CHOICES = [
        ('Tooling', 'Tooling'),
        ('Gauges', 'Gauges'),
        ('Fixture', 'Fixture'),
    ]
    TOOL_CATEGORY_CHOICES = [
        ('MILLING_CUTTER', 'Milling Cutter'),
        ('DRILL', 'Drill'),
        ('ENDMILL', 'Endmill'),
        ('TAP', 'Tap'),
        ('THREADMILL', 'Threadmill'),
        ('BORING_BAR', 'Boring Bar'),
        ('REAMERS', 'Reamers'),
        ('SPECIAL_DRILL', 'Special Drill'),
        ('SPECIAL_TOOL', 'Special Tool'),
        ('OTHER', 'Other'),
    ]

    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='tools')
    component = models.ForeignKey(Component, on_delete=models.CASCADE, related_name='tools', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE_CHOICES, default='Tooling', db_index=True)
    tool_number = models.CharField(max_length=10)
    pocket_number = models.CharField(max_length=10, blank=True, default='')
    tool_name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=TOOL_CATEGORY_CHOICES, default='MILLING_CUTTER')
    diameter = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    corner_radius = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    insert_used = models.CharField(max_length=100, blank=True, default='')
    initial_life = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    current_life = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    life_used = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    supplier = models.CharField(max_length=150, blank=True, default='')
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20, choices=TOOL_STATUS_CHOICES, default='DRAFT')
    trial_required = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, default='')
    drawing_file = models.FileField(upload_to='tool_drawings/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'machine_tools'
        unique_together = ('machine', 'tool_number')
        ordering = ['machine', 'tool_number']
        indexes = [
            models.Index(fields=['machine', 'status']),
            models.Index(fields=['machine', 'asset_type', 'status']),
        ]

    def __str__(self):
        return f"{self.machine.machine_id} - {self.tool_number}: {self.tool_name}"

    def get_life_percentage(self):
        if self.initial_life == 0:
            return 0
        return min(100, int((self.life_used / self.initial_life) * 100))

    def save(self, *args, **kwargs):
        if self.initial_life > 0:
            self.current_life = max(0, self.initial_life - self.life_used)
        super().save(*args, **kwargs)


# ============================================================================
# Subassembly helpers
# ============================================================================
SUBASSEMBLY_CODE_MAP = {
    'PULLSTUD': 'PS', 'ADAPTOR': 'AD', 'TOOL': 'TL', 'INSERT': 'IN',
    'CARTRIDGE': 'CR', 'MBU': 'MB', 'BORING_HEAD': 'BH',
    'NUT_COLLET': 'NC', 'CUTTING_TOOL': 'CT',
    'COLLET': 'CL', 'INSERT_SCREW': 'IS', 'SCREW': 'SC', 'MIDDLE_EXTENSION': 'ME',
}

# Dynamic form field config per subassembly category
SUBASSEMBLY_FIELD_CONFIG = {
    'PULLSTUD': {
        'shape': ['thread_size', 'standard', 'compatible_machine'],
        'life': [],
        'params': [],
        'other': [],
    },
    'ADAPTOR': {
        'shape': ['taper', 'adaptor_diameter', 'gauge_length_gpl', 'minor_diameter', 'major_diameter', 'make'],
        'life': [],
        'params': [],
        'other': [],
    },
    'TOOL': {
        'shape': ['sub_type', 'tool_diameter', 'number_of_flutes', 'cutting_length', 'overall_length', 'holder_type'],
        'life': [],
        'params': ['vc', 'rpm', 'feed', 'feed_per_tooth'],
        'other': ['manufacturer', 'rate', 'cpc', 'overall_cpc', 'purchase_date'],
    },
    'INSERT': {
        'shape': ['insert_shape', 'size_diameter', 'number_of_cutting_edges', 'corner_radius', 'grade'],
        'life': ['life_per_edge', 'overall_life'],
        'params': ['vc', 'rpm', 'feed', 'feed_per_tooth'],
        'other': ['manufacturer', 'rate', 'cpc', 'overall_cpc', 'purchase_date'],
    },
    'CARTRIDGE': {
        'shape': ['cartridge_type', 'size', 'material'],
        'life': [],
        'params': [],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
    'MBU': {
        'shape': ['mbu_type', 'size', 'range'],
        'life': [],
        'params': [],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
    'BORING_HEAD': {
        'shape': ['boring_range_min', 'boring_range_max', 'shank_type', 'connection_type'],
        'life': [],
        'params': ['vc', 'rpm', 'feed', 'feed_per_tooth'],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
    'COLLET': {
        'shape': ['collet_type', 'size', 'clamping_range'],
        'life': [],
        'params': [],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
    'INSERT_SCREW': {
        'shape': ['screw_size', 'thread_type', 'length'],
        'life': [],
        'params': [],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
    'SCREW': {
        'shape': ['screw_size', 'thread_type', 'length'],
        'life': [],
        'params': [],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
    'MIDDLE_EXTENSION': {
        'shape': ['extension_type', 'length', 'diameter', 'connection_type'],
        'life': [],
        'params': [],
        'other': ['manufacturer', 'rate', 'purchase_date'],
    },
}


def generate_component_initials(component_name):
    """Generate initials from component name, e.g. 'Case Rear' -> 'CR'"""
    if not component_name:
        return 'XX'
    words = component_name.strip().split()
    return ''.join(w[0].upper() for w in words if w)[:4] or 'XX'


# ============================================================================
# ToolBOM - Structured Bill of Materials
# ============================================================================
class ToolBOM(models.Model):
    BOM_TYPE_CHOICES = [
        ('PULLSTUD', 'Pull Stud'),
        ('ADAPTOR', 'Adaptor'),
        ('TOOL', 'Tool'),
        ('INSERT', 'Insert'),
        ('CARTRIDGE', 'Cartridge'),
        ('MBU', 'MBU'),
        ('BORING_HEAD', 'Boring Head / Boring Bar'),
        ('COLLET', 'Collet'),
        ('INSERT_SCREW', 'Insert Screw'),
        ('SCREW', 'Screw'),
        ('MIDDLE_EXTENSION', 'Middle Extension'),
        ('NUT_COLLET', 'Nut / Collet'),       # legacy
        ('CUTTING_TOOL', 'Cutting Tool'),     # legacy
    ]

    tool = models.ForeignKey(MachineTools, on_delete=models.CASCADE, related_name='bom_items')
    bom_type = models.CharField(max_length=20, choices=BOM_TYPE_CHOICES)
    master_item = models.ForeignKey(Master, on_delete=models.SET_NULL, null=True, blank=True, related_name='bom_items')
    supplier = models.ForeignKey(Master, on_delete=models.SET_NULL, null=True, blank=True, related_name='bom_suppliers', limit_choices_to={'master_type': 'SUPPLIER'})
    sku = models.CharField(max_length=50, blank=True, default='', db_index=True)
    quantity = models.PositiveIntegerField(default=1, help_text='Quantity of this subassembly')
    description = models.CharField(max_length=200, blank=True, default='')
    drawing_file = models.FileField(upload_to='tool_bom_drawings/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_bom'
        ordering = ['tool', 'bom_type']
        unique_together = [['tool', 'bom_type']]

    def __str__(self):
        return f"{self.tool.tool_number} - {self.bom_type} ({self.sku})"

    def save(self, *args, **kwargs):
        if not self.sku:
            self.sku = self._generate_sku()
        super().save(*args, **kwargs)

    def _generate_sku(self):
        comp_name = ''
        if self.tool and self.tool.component:
            comp_name = self.tool.component.component_name
        initials = generate_component_initials(comp_name)
        tool_no = self.tool.tool_number if self.tool else 'T00'
        sub_code = SUBASSEMBLY_CODE_MAP.get(self.bom_type, 'XX')
        serial = SKUCounter.next_serial(f"{initials}-{sub_code}")
        return f"{initials}-{tool_no}-{sub_code}-{serial:04d}"


# ============================================================================
# ToolBOMDetail - JSON shape/life/other data per BOM item
# ============================================================================
class ToolBOMDetail(models.Model):
    TOOL_SUBTYPE_CHOICES = [
        ('DRILL', 'Drill'), ('ENDMILL', 'Endmill'), ('TAP', 'Tap'),
        ('THREADMILL', 'Threadmill'), ('MILLING_CUTTER', 'Milling Cutter'),
        ('SPECIAL_TOOL', 'Special Tool'),
    ]
    bom = models.OneToOneField(ToolBOM, on_delete=models.CASCADE, related_name='detail')
    cutting_tool_type = models.CharField(max_length=30, choices=TOOL_SUBTYPE_CHOICES, blank=True, default='')
    shape_data = models.JSONField(default=dict, blank=True)
    life_data = models.JSONField(default=dict, blank=True)
    parameter_data = models.JSONField(default=dict, blank=True)
    other_data = models.JSONField(default=dict, blank=True)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_bom_details'

    def __str__(self):
        return f"Detail for BOM #{self.bom_id}"


# ============================================================================
# ToolShape - Shape and dimensional specifications
# ============================================================================
class ToolShape(models.Model):
    DATA_STATUS = [('DRAFT', 'Draft'), ('FINALIZED', 'Finalized')]

    tool = models.OneToOneField(MachineTools, on_delete=models.CASCADE, related_name='shape_data')
    data_status = models.CharField(max_length=20, choices=DATA_STATUS, default='DRAFT')
    finalized_date = models.DateTimeField(null=True, blank=True)
    finalized_by = models.CharField(max_length=100, blank=True, default='')
    tool_system_name = models.CharField(max_length=100, blank=True, default='')
    nom_d = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    id_code = models.CharField(max_length=100, blank=True, default='')
    tool_identity_name = models.CharField(max_length=100, blank=True, default='')
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    leng_co = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    no = models.IntegerField(null=True, blank=True)
    insert_used = models.CharField(max_length=100, blank=True, default='')
    corner_r = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    no_of_corners = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_shape'

    def __str__(self):
        return f"Shape - {self.tool.tool_number}"


# ============================================================================
# ToolLife - Tool life and performance metrics
# ============================================================================
class ToolLife(models.Model):
    DATA_STATUS = [('DRAFT', 'Draft'), ('FINALIZED', 'Finalized')]

    tool = models.OneToOneField(MachineTools, on_delete=models.CASCADE, related_name='life_data')
    data_status = models.CharField(max_length=20, choices=DATA_STATUS, default='DRAFT')
    finalized_date = models.DateTimeField(null=True, blank=True)
    finalized_by = models.CharField(max_length=100, blank=True, default='')
    life = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    cut_time = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    life_per_corner = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    life_in_meters = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_life'

    def __str__(self):
        return f"Life - {self.tool.tool_number}"


# ============================================================================
# ToolOtherDetails
# ============================================================================
class ToolOtherDetails(models.Model):
    DATA_STATUS = [('DRAFT', 'Draft'), ('FINALIZED', 'Finalized')]

    tool = models.OneToOneField(MachineTools, on_delete=models.CASCADE, related_name='other_details')
    data_status = models.CharField(max_length=20, choices=DATA_STATUS, default='DRAFT')
    finalized_date = models.DateTimeField(null=True, blank=True)
    finalized_by = models.CharField(max_length=100, blank=True, default='')
    tool_used_machine_date = models.DateField(null=True, blank=True)
    supplier = models.CharField(max_length=150, blank=True, default='')
    purchase_date = models.DateField(null=True, blank=True)
    trial_by = models.CharField(max_length=100, blank=True, default='')
    approved_by = models.CharField(max_length=100, blank=True, default='')
    correction_remark = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_other_details'

    def __str__(self):
        return f"Other - {self.tool.tool_number}"


# ============================================================================
# ToolTrialMaster - Enhanced trial with sub-assemblies
# ============================================================================
class ToolTrialMaster(models.Model):
    TRIAL_STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    TRIAL_RESULT_CHOICES = [
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
        ('CONDITIONAL', 'Conditional Pass'),
    ]
    COOLANT_CHOICES = [
        ('DRY', 'Dry'), ('FLOOD', 'Flood'), ('MIST', 'Mist'),
        ('MQL', 'MQL'), ('THROUGH_TOOL', 'Through Tool'),
    ]

    tool = models.ForeignKey(MachineTools, on_delete=models.CASCADE, related_name='trial_masters')
    machine_name = models.CharField(max_length=100)
    component_name = models.CharField(max_length=150)
    tool_number = models.CharField(max_length=20)
    tool_name = models.CharField(max_length=200)
    operation = models.CharField(max_length=200, blank=True, default='')
    customer = models.CharField(max_length=200, blank=True, default='')
    part_name = models.CharField(max_length=200, blank=True, default='')
    part_material = models.CharField(max_length=100, blank=True, default='')

    # Existing tool parameters
    existing_manufacturer = models.CharField(max_length=200, blank=True, default='')
    existing_insert_code = models.CharField(max_length=100, blank=True, default='')
    existing_cutting_edges = models.IntegerField(null=True, blank=True)
    existing_cutting_speed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    existing_feed = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    existing_coolant = models.CharField(max_length=20, choices=COOLANT_CHOICES, blank=True, default='')
    existing_tool_life = models.IntegerField(null=True, blank=True)
    existing_cutting_time = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # New trial tool parameters
    new_manufacturer = models.CharField(max_length=200, blank=True, default='')
    new_insert_code = models.CharField(max_length=100, blank=True, default='')
    new_cutting_edges = models.IntegerField(null=True, blank=True)
    new_cutting_speed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_feed = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    new_coolant = models.CharField(max_length=20, choices=COOLANT_CHOICES, blank=True, default='')
    new_tool_life = models.IntegerField(null=True, blank=True)
    new_cutting_time = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Cutting parameters
    spindle_speed = models.IntegerField(null=True, blank=True)
    feed_rate = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    depth_of_cut = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    cutting_speed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Test results
    target_quantity = models.IntegerField(null=True, blank=True)
    test_pieces_qty = models.IntegerField(null=True, blank=True)
    surface_finish_ra = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    tool_life_achieved = models.IntegerField(null=True, blank=True)

    # Cost/savings
    existing_cost_per_component = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    new_cost_per_component = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    savings_per_component = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_savings = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Trial info
    trial_result = models.CharField(max_length=20, choices=TRIAL_RESULT_CHOICES, blank=True, default='')
    trial_date = models.DateField(null=True, blank=True)
    conducted_by = models.CharField(max_length=100, blank=True, default='')
    approved_by = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=TRIAL_STATUS_CHOICES, default='DRAFT')
    remarks = models.TextField(blank=True, default='')
    rejection_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'tool_trial_master'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tool', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Trial {self.id} - {self.tool_number} ({self.status})"

    def approve(self, approved_by):
        self.status = 'APPROVED'
        self.approved_by = approved_by
        self.approved_at = timezone.now()
        self.save()
        self.tool.trial_required = False
        self.tool.status = 'ACTIVE'
        self.tool.save()

    def reject(self, rejected_by, reason):
        self.status = 'REJECTED'
        self.approved_by = rejected_by
        self.rejection_reason = reason
        self.save()


# ============================================================================
# Trial Sub-assembly Models
# ============================================================================
class ToolTrialAdaptor(models.Model):
    trial = models.OneToOneField(ToolTrialMaster, on_delete=models.CASCADE, related_name='adaptor')
    adaptor_type = models.CharField(max_length=100, blank=True, default='')
    interface = models.CharField(max_length=100, blank=True, default='')
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    make = models.CharField(max_length=100, blank=True, default='')
    coolant_type = models.CharField(max_length=50, blank=True, default='')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_trial_adaptor'


class ToolTrialCuttingTool(models.Model):
    TOOL_TYPE_CHOICES = [
        ('DRILL', 'Drill'), ('ENDMILL', 'Endmill'), ('BORING_BAR', 'Boring Bar'),
        ('SPECIAL', 'Special'), ('REAMER', 'Reamer'), ('TAP', 'Tap'),
        ('MILLING_CUTTER', 'Milling Cutter'),
    ]

    trial = models.ForeignKey(ToolTrialMaster, on_delete=models.CASCADE, related_name='cutting_tools')
    tool_type = models.CharField(max_length=30, choices=TOOL_TYPE_CHOICES)
    diameter = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    flutes = models.IntegerField(null=True, blank=True)
    oal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    material = models.CharField(max_length=100, blank=True, default='')
    coating = models.CharField(max_length=100, blank=True, default='')
    make = models.CharField(max_length=100, blank=True, default='')
    tool_code = models.CharField(max_length=100, blank=True, default='')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_trial_cutting_tools'


class ToolTrialInsert(models.Model):
    trial = models.OneToOneField(ToolTrialMaster, on_delete=models.CASCADE, related_name='insert_detail')
    insert_type = models.CharField(max_length=100, blank=True, default='')
    iso_code = models.CharField(max_length=50, blank=True, default='')
    grade = models.CharField(max_length=50, blank=True, default='')
    coating = models.CharField(max_length=100, blank=True, default='')
    no_of_inserts = models.IntegerField(null=True, blank=True)
    no_of_corners = models.IntegerField(null=True, blank=True)
    insert_life = models.IntegerField(null=True, blank=True)
    life_per_edge = models.IntegerField(null=True, blank=True)
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_trial_insert'


class ToolTrialPullstud(models.Model):
    trial = models.OneToOneField(ToolTrialMaster, on_delete=models.CASCADE, related_name='pullstud')
    pullstud_type = models.CharField(max_length=50, blank=True, default='')
    thread_size = models.CharField(max_length=30, blank=True, default='')
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    make = models.CharField(max_length=100, blank=True, default='')
    material = models.CharField(max_length=50, blank=True, default='')
    coolant_through = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tool_trial_pullstud'


# ============================================================================
# Planning
# ============================================================================
class PlanningData(models.Model):
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name='planning_data')
    component = models.ForeignKey(Component, on_delete=models.CASCADE, related_name='planning_data')
    tool = models.ForeignKey(MachineTools, on_delete=models.CASCADE, related_name='planning_data')
    production_qty = models.IntegerField(default=0)
    tool_life_per_component = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tools_required = models.IntegerField(default=0)
    inserts_required = models.IntegerField(default=0)
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    month = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'planning_data'
        ordering = ['-month']


# ============================================================================
# ToolMasterImport
# ============================================================================
class ToolMasterImport(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed'), ('failed', 'Failed')]

    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True, default='')
    total_rows = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    errors = models.JSONField(default=list, blank=True)
    data = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tool_master_imports'
        ordering = ['-created_at']


# ============================================================================
# SKU Counter
# ============================================================================
class SKUCounter(models.Model):
    prefix = models.CharField(max_length=30, unique=True)
    current_value = models.IntegerField(default=0)

    class Meta:
        db_table = 'sku_counters'

    def __str__(self):
        return f"{self.prefix}: {self.current_value}"

    @classmethod
    def next_sku(cls, prefix, spec=''):
        counter, _ = cls.objects.get_or_create(prefix=prefix, defaults={'current_value': 0})
        counter.current_value += 1
        counter.save()
        spec_part = f"-{spec}" if spec else ''
        return f"{prefix}{spec_part}-{counter.current_value:04d}"

    @classmethod
    def next_serial(cls, prefix):
        """Return the next serial number integer for the given prefix."""
        counter, _ = cls.objects.get_or_create(prefix=prefix, defaults={'current_value': 0})
        counter.current_value += 1
        counter.save()
        return counter.current_value
