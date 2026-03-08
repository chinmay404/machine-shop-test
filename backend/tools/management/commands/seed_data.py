from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from tools.models import (
    Machine, Component, Master, MachineTools, ToolBOM, ToolBOMDetail,
    ToolShape, ToolLife, ToolOtherDetails, SKUCounter,
)


class Command(BaseCommand):
    help = 'Seed the database with demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Groups (roles)
        roles = ['admin', 'operator', 'supervisor', 'planning', 'store']
        for r in roles:
            Group.objects.get_or_create(name=r)

        # Users
        users_data = [
            ('admin', 'admin123', 'admin', 'Admin', 'User'),
            ('op1', 'operator123', 'operator', 'Operator', 'One'),
            ('supervisor1', 'super123', 'supervisor', 'Super', 'Visor'),
            ('planner1', 'plan123', 'planning', 'Plan', 'Ner'),
            ('store1', 'store123', 'store', 'Store', 'Keeper'),
        ]
        for uname, pwd, role, fn, ln in users_data:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={'first_name': fn, 'last_name': ln, 'is_staff': role == 'admin'}
            )
            if created:
                user.set_password(pwd)
                user.save()
            user.groups.set([Group.objects.get(name=role)])

        # SKU Counters
        for prefix in ['PS', 'AD', 'TL', 'IN', 'NC']:
            SKUCounter.objects.get_or_create(prefix=prefix, defaults={'current_value': 0})

        # Machines
        machines_data = [
            ('HMC-90', 'HMC 90 Machine', 'HMC', 'Mazak', 'BT40', 12000, 90),
            ('HMC-10', 'HMC 10 Machine', 'HMC', 'Okuma', 'BT50', 10000, 60),
            ('VMC-01', 'VMC 01 Machine', 'VMC', 'Haas', 'CAT40', 15000, 40),
        ]
        for mid, mname, mtype, mfg, spindle, rpm, mx in machines_data:
            Machine.objects.get_or_create(
                machine_id=mid,
                defaults={
                    'machine_name': mname, 'machine_type': mtype, 'manufacturer': mfg,
                    'spindle_type': spindle, 'max_rpm': rpm, 'max_tools': mx,
                }
            )

        hmc90 = Machine.objects.get(machine_id='HMC-90')
        hmc10 = Machine.objects.get(machine_id='HMC-10')

        # Components
        comp1, _ = Component.objects.get_or_create(
            machine=hmc90, component_name='Case Rear', operation='OP20',
            defaults={'material': 'Aluminium 6061', 'customer': 'Client A', 'cycle_time_minutes': 12.5}
        )
        comp2, _ = Component.objects.get_or_create(
            machine=hmc90, component_name='Case Front', operation='OP10',
            defaults={'material': 'Aluminium 7075', 'customer': 'Client A', 'cycle_time_minutes': 8.0}
        )
        comp3, _ = Component.objects.get_or_create(
            machine=hmc10, component_name='Housing', operation='OP10',
            defaults={'material': 'Cast Iron', 'customer': 'Client B', 'cycle_time_minutes': 18.0}
        )

        # Masters
        masters_data = [
            ('PULLSTUD', 'PS-BT40-001', 'BT40 Pull Stud Standard', {}),
            ('PULLSTUD', 'PS-BT50-001', 'BT50 Pull Stud Heavy Duty', {}),
            ('ADAPTOR', 'AD-ER32-001', 'ER32 Collet Chuck Adaptor', {}),
            ('ADAPTOR', 'AD-ER40-001', 'ER40 Collet Chuck Adaptor', {}),
            ('ADAPTOR', 'AD-SHELL-001', 'Shell Mill Adaptor', {}),
            ('COLLET', 'NC-ER32-10', 'ER32 Collet 10mm', {}),
            ('COLLET', 'NC-ER32-12', 'ER32 Collet 12mm', {}),
            ('CUTTING_TOOL', 'TL-FM-80', 'Dia 80 Face Milling Cutter', {'diameter': 80}),
            ('CUTTING_TOOL', 'TL-EM-10', 'Dia 10 End Mill', {'diameter': 10}),
            ('CUTTING_TOOL', 'TL-DR-8', 'Dia 8 Drill', {'diameter': 8}),
            ('CUTTING_TOOL', 'TL-DR-10', 'Dia 10.2 Drill', {'diameter': 10.2}),
            ('CUTTING_TOOL', 'TL-TAP-M12', 'M12 Tap', {}),
            ('CUTTING_TOOL', 'TL-BB-40', 'Dia 40 Boring Bar', {'diameter': 40}),
            ('INSERT', 'IN-APMT-1604', 'APMT 1604 Insert', {'grade': 'IC928'}),
            ('INSERT', 'IN-CNMG-120408', 'CNMG 120408 Insert', {'grade': 'IC907'}),
            ('INSERT', 'IN-RPMT-10T3', 'RPMT 10T3 Insert', {'grade': 'IC830'}),
            ('SUPPLIER', 'SUP-SAND', 'Sandvik', {}),
            ('SUPPLIER', 'SUP-ISCAR', 'Iscar', {}),
            ('SUPPLIER', 'SUP-KENN', 'Kennametal', {}),
        ]
        for mt, code, name, specs in masters_data:
            Master.objects.get_or_create(code=code, defaults={
                'master_type': mt, 'name': name, 'specifications': specs,
            })

        # Tool Slots for HMC-90 / Case Rear OP20
        tools_data = [
            ('T01', 'Dia 80 Face Milling Cutter', 'FACE_MILL', 80, 120, 500, 50),
            ('T02', 'Dia 10 End Mill', 'END_MILL', 10, 50, 300, 100),
            ('T03', 'Dia 8 Drill', 'DRILL', 8, 80, 200, 80),
            ('T04', 'Dia 10.2 Drill', 'DRILL', 10.2, 100, 200, 60),
            ('T05', 'M12 Tap', 'TAP', 12, 60, 150, 40),
            ('T06', 'Dia 40 Boring Bar', 'BORING_BAR', 40, 150, 400, 120),
            ('T07', 'Dia 16 Milling Cutter', 'MILLING_CUTTER', 16, 70, 250, 90),
        ]
        for tnum, tname, cat, dia, length, init_life, used in tools_data:
            tool, _ = MachineTools.objects.get_or_create(
                machine=hmc90, tool_number=tnum,
                defaults={
                    'component': comp1, 'tool_name': tname, 'category': cat,
                    'diameter': dia, 'length': length, 'initial_life': init_life,
                    'life_used': used, 'status': 'ACTIVE',
                }
            )
            # Create Shape and Life data
            ToolShape.objects.get_or_create(tool=tool, defaults={
                'nom_d': dia, 'length': length, 'data_status': 'FINALIZED',
            })
            ToolLife.objects.get_or_create(tool=tool, defaults={
                'life': init_life, 'cut_time': int(init_life * 0.4),
                'data_status': 'FINALIZED',
            })
            ToolOtherDetails.objects.get_or_create(tool=tool, defaults={
                'supplier': 'Sandvik', 'data_status': 'FINALIZED',
            })

        # BOM for T01 (Face Milling Cutter)
        t01 = MachineTools.objects.get(machine=hmc90, tool_number='T01')
        ps = Master.objects.get(code='PS-BT40-001')
        ad = Master.objects.get(code='AD-SHELL-001')
        ct = Master.objects.get(code='TL-FM-80')
        ins = Master.objects.get(code='IN-APMT-1604')

        for btype, master in [('PULLSTUD', ps), ('ADAPTOR', ad), ('CUTTING_TOOL', ct), ('INSERT', ins)]:
            bom, _ = ToolBOM.objects.get_or_create(tool=t01, bom_type=btype, defaults={'master_item': master})
            ToolBOMDetail.objects.get_or_create(bom=bom, defaults={
                'shape_data': {'diameter': 80} if btype == 'CUTTING_TOOL' else {},
                'life_data': {'life': 500} if btype in ('CUTTING_TOOL', 'INSERT') else {},
            })

        self.stdout.write(self.style.SUCCESS(
            f'Seeded: {User.objects.count()} users, {Machine.objects.count()} machines, '
            f'{Component.objects.count()} components, {MachineTools.objects.count()} tools, '
            f'{Master.objects.count()} masters, {ToolBOM.objects.count()} BOM items'
        ))
