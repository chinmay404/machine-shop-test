-- ============================================================================
-- Tool Data Management System - SQL Schema Reference
-- Database structure for complete tool hierarchy implementation
-- ============================================================================

-- ============================================================================
-- MATERIALS TABLE
-- ============================================================================
CREATE TABLE materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    material_code VARCHAR(50) UNIQUE NOT NULL,
    material_name VARCHAR(150) NOT NULL,
    material_type VARCHAR(100),
    description TEXT,
    unit VARCHAR(20) DEFAULT 'PCS',
    quantity_available INT DEFAULT 0 CHECK (quantity_available >= 0),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_material_code (material_code),
    INDEX idx_status (status),
    INDEX idx_material_name (material_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    remarks TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_supplier_code (supplier_code),
    INDEX idx_status (status),
    INDEX idx_supplier_name (supplier_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TOOL BOM TABLE - Bill of Materials for tools
-- ============================================================================
CREATE TABLE tool_bom (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tool_id INT NOT NULL,
    material_id INT NOT NULL,
    supplier_id INT,
    quantity INT DEFAULT 1 CHECK (quantity >= 1),
    issued_date DATE NOT NULL,
    drawing_file VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tool_id) REFERENCES machine_tools(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    
    INDEX idx_tool_id (tool_id),
    INDEX idx_material_id (material_id),
    INDEX idx_issued_date (issued_date),
    INDEX idx_tool_material (tool_id, material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TOOL SHAPE TABLE - Dimensional and specification data for tools
-- OneToOne relationship with machine_tools table
-- ============================================================================
CREATE TABLE tool_shape (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tool_id INT UNIQUE NOT NULL,
    tool_system_name VARCHAR(100),
    nom_d DECIMAL(10, 2),
    id_code VARCHAR(100),
    tool_identity_name VARCHAR(100),
    length DECIMAL(10, 2),
    leng_co DECIMAL(10, 2),
    no INT,
    insert_used VARCHAR(100),
    corner_r DECIMAL(10, 2),
    no_of_corners INT CHECK (no_of_corners >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tool_id) REFERENCES machine_tools(id) ON DELETE CASCADE,
    
    INDEX idx_tool_id (tool_id),
    CONSTRAINT chk_shape_values CHECK (
        nom_d >= 0 OR nom_d IS NULL AND
        length >= 0 OR length IS NULL AND
        corner_r >= 0 OR corner_r IS NULL
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TOOL LIFE TABLE - Tool life performance and metrics
-- OneToOne relationship with machine_tools table
-- ============================================================================
CREATE TABLE tool_life (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tool_id INT UNIQUE NOT NULL,
    life INT CHECK (life >= 0),
    cut_time INT CHECK (cut_time >= 0),
    life_per_corner INT CHECK (life_per_corner >= 0),
    life_in_meters DECIMAL(15, 2) CHECK (life_in_meters >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tool_id) REFERENCES machine_tools(id) ON DELETE CASCADE,
    
    INDEX idx_tool_id (tool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TOOL OTHER DETAILS TABLE - Additional tool information
-- Trial, approval, and miscellaneous data
-- OneToOne relationship with machine_tools table
-- ============================================================================
CREATE TABLE tool_other_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tool_id INT UNIQUE NOT NULL,
    tool_used_machine_date DATE,
    supplier VARCHAR(150),
    purchase_date DATE,
    trial_by VARCHAR(100),
    approved_by VARCHAR(100),
    correction_remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tool_id) REFERENCES machine_tools(id) ON DELETE CASCADE,
    
    INDEX idx_tool_id (tool_id),
    INDEX idx_purchase_date (purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- RELATIONSHIPS SUMMARY
-- ============================================================================

/*
Tool Hierarchy and Relationships:

1. Machine (One)
   ├── Component (Many)
   │   ├── MachineTools/Tool (Many)
   │   │   ├── asset_type = 'Tooling'
   │   │   ├── ToolBOM (Many, via tool_id)
   │   │   │   ├── Material (One, via material_id)
   │   │   │   └── Supplier (One, via supplier_id, nullable)
   │   │   ├── ToolShape (One, OneToOne via tool_id)
   │   │   ├── ToolLife (One, OneToOne via tool_id)
   │   │   └── ToolOtherDetails (One, OneToOne via tool_id)

2. Foreign Key Constraints:
   - tool_bom.tool_id → machine_tools.id (CASCADE)
   - tool_bom.material_id → materials.id (CASCADE)
   - tool_bom.supplier_id → suppliers.id (SET NULL)
   - tool_shape.tool_id → machine_tools.id (CASCADE)
   - tool_life.tool_id → machine_tools.id (CASCADE)
   - tool_other_details.tool_id → machine_tools.id (CASCADE)

3. Indexes for Performance:
   - Materials: material_code, status, name
   - Suppliers: supplier_code, status, name
   - Tool BOM: tool_id, material_id, issued_date, composite (tool, material)
   - Tool Shape: tool_id
   - Tool Life: tool_id
   - Tool Other Details: tool_id, purchase_date
*/

-- ============================================================================
-- DATA ACCESS PATTERNS
-- ============================================================================

-- Get all BOM items for a tool
SELECT 
    tb.id,
    tb.quantity,
    tb.issued_date,
    m.material_code,
    m.material_name,
    s.supplier_code,
    s.supplier_name
FROM tool_bom tb
LEFT JOIN materials m ON tb.material_id = m.id
LEFT JOIN suppliers s ON tb.supplier_id = s.id
WHERE tb.tool_id = ?
ORDER BY tb.issued_date DESC;

-- Get complete tool data
SELECT 
    t.id as tool_id,
    t.tool_number,
    t.tool_name,
    ts.tool_system_name,
    ts.nom_d,
    ts.length,
    tl.life,
    tl.cut_time,
    tod.trial_by,
    tod.approved_by
FROM machine_tools t
LEFT JOIN tool_shape ts ON t.id = ts.tool_id
LEFT JOIN tool_life tl ON t.id = tl.tool_id
LEFT JOIN tool_other_details tod ON t.id = tod.tool_id
WHERE t.id = ?;

-- Get tools by machine and component with BOM count
SELECT 
    t.id,
    t.tool_number,
    t.tool_name,
    COUNT(tb.id) as bom_count
FROM machine_tools t
LEFT JOIN tool_bom tb ON t.id = tb.tool_id
WHERE t.machine_id = ? AND t.component_id = ?
GROUP BY t.id
ORDER BY t.tool_number;

-- Get active materials
SELECT id, material_code, material_name
FROM materials
WHERE status = 'ACTIVE'
ORDER BY material_name;

-- Get active suppliers
SELECT id, supplier_code, supplier_name
FROM suppliers
WHERE status = 'ACTIVE'
ORDER BY supplier_name;

-- ============================================================================
-- SAMPLE INSERTS
-- ============================================================================

-- Insert materials
INSERT INTO materials (material_code, material_name, material_type, unit, status)
VALUES 
    ('MAT001', 'Aluminum 6061', 'Aluminum', 'KG', 'ACTIVE'),
    ('MAT002', 'Steel HSS', 'Steel', 'KG', 'ACTIVE'),
    ('MAT003', 'Tungsten Carbide', 'Carbide', 'G', 'ACTIVE');

-- Insert suppliers
INSERT INTO suppliers (supplier_code, supplier_name, email, phone, status)
VALUES 
    ('SUP001', 'ABC Tools Inc.', 'contact@abc.com', '+1-555-0100', 'ACTIVE'),
    ('SUP002', 'XYZ Manufacturing', 'sales@xyz.com', '+1-555-0200', 'ACTIVE');

-- Insert BOM item (requires existing tool_id and material_id)
INSERT INTO tool_bom (tool_id, material_id, supplier_id, quantity, issued_date)
VALUES (1, 1, 1, 2, CURDATE());

-- Insert shape data (requires existing tool_id)
INSERT INTO tool_shape (tool_id, tool_system_name, nom_d, length, corner_r, no_of_corners)
VALUES (1, 'System A', 50.5, 100.0, 2.0, 4);

-- Insert life data (requires existing tool_id)
INSERT INTO tool_life (tool_id, life, cut_time, life_per_corner, life_in_meters)
VALUES (1, 1000, 500, 250, 1000.50);

-- Insert other details (requires existing tool_id)
INSERT INTO tool_other_details (tool_id, tool_used_machine_date, supplier, purchase_date, trial_by, approved_by)
VALUES (1, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'ABC Tools Inc.', CURDATE(), 'John Doe', 'Jane Smith');

-- ============================================================================
-- MIGRATION APPLIED
-- ============================================================================

/*
Django Migration: 0004_material_supplier_toollife_toolotherdetails_and_more

This migration creates all new tables and maintains referential integrity
with existing machine_tools table.

Run: python manage.py migrate toolmanager

To rollback: python manage.py migrate toolmanager 0003

*/
