-- ============================================================================
-- STRUCTURED BOM DATABASE SCHEMA
-- Updated Tool Management System with Structured BOM
-- ============================================================================

-- ============================================================================
-- Master Tables for BOM Components
-- ============================================================================

-- Pull Stud Master Table
CREATE TABLE master_pullstud (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    specification TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pullstud_status ON master_pullstud(status);
CREATE INDEX idx_pullstud_code ON master_pullstud(code);

-- Sample Data for Pull Stud
INSERT INTO master_pullstud (code, description, specification) VALUES
('PS-BT40-001', 'BT40 Pull Stud Standard', 'Standard BT40 pull stud'),
('PS-BT50-001', 'BT50 Pull Stud Heavy Duty', 'Heavy duty BT50 pull stud'),
('PS-CAT40-001', 'CAT40 Pull Stud', 'CAT40 standard pull stud');


-- Adaptor Master Table
CREATE TABLE master_adaptor (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    specification TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_adaptor_status ON master_adaptor(status);
CREATE INDEX idx_adaptor_code ON master_adaptor(code);

-- Sample Data for Adaptor
INSERT INTO master_adaptor (code, description, specification) VALUES
('AD-ER32-001', 'ER32 Collet Chuck Adaptor', 'ER32 collet chuck for BT40'),
('AD-ER40-001', 'ER40 Collet Chuck Adaptor', 'ER40 collet chuck for BT50'),
('AD-SHELL-001', 'Shell Mill Adaptor', 'Shell mill holder adaptor');


-- Nut/Collet Master Table
CREATE TABLE master_nut_collet (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    specification TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nut_collet_status ON master_nut_collet(status);
CREATE INDEX idx_nut_collet_code ON master_nut_collet(code);

-- Sample Data for Nut/Collet
INSERT INTO master_nut_collet (code, description, specification) VALUES
('NC-ER32-10', 'ER32 Collet 10mm', 'ER32 spring collet 10mm'),
('NC-ER32-12', 'ER32 Collet 12mm', 'ER32 spring collet 12mm'),
('NC-ER40-20', 'ER40 Collet 20mm', 'ER40 spring collet 20mm');


-- Cutting Tool Master Table
CREATE TABLE master_cutting_tool (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    tool_type VARCHAR(50),
    diameter DECIMAL(8,2),
    specification TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cutting_tool_status ON master_cutting_tool(status);
CREATE INDEX idx_cutting_tool_code ON master_cutting_tool(code);
CREATE INDEX idx_cutting_tool_type ON master_cutting_tool(tool_type);

-- Sample Data for Cutting Tools
INSERT INTO master_cutting_tool (code, description, tool_type, diameter, specification) VALUES
('CT-FM-80', 'Dia 80 Milling Cutter', 'Face Mill', 80.00, '80mm face milling cutter'),
('CT-EM-10', 'Dia 10 End Mill', 'End Mill', 10.00, '10mm solid carbide end mill'),
('CT-DR-8', 'Dia 8 Drill', 'Drill', 8.00, '8mm HSS drill bit');


-- Insert Master Table
CREATE TABLE master_insert (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(200) NOT NULL,
    grade VARCHAR(50),
    specification TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insert_status ON master_insert(status);
CREATE INDEX idx_insert_code ON master_insert(code);
CREATE INDEX idx_insert_grade ON master_insert(grade);

-- Sample Data for Inserts
INSERT INTO master_insert (code, description, grade, specification) VALUES
('INS-APMT-1604', 'APMT 1604 Insert', 'IC928', 'Carbide milling insert'),
('INS-CNMG-120408', 'CNMG 120408 Insert', 'IC907', 'Carbide turning insert'),
('INS-RPMT-10T3', 'RPMT 10T3 Insert', 'IC830', 'Carbide face milling insert');


-- ============================================================================
-- Updated Tool BOM Table - Structured BOM
-- ============================================================================

CREATE TABLE tool_bom (
    id SERIAL PRIMARY KEY,
    tool_id INTEGER NOT NULL REFERENCES machine_tools(id) ON DELETE CASCADE,
    bom_type VARCHAR(20) NOT NULL CHECK (bom_type IN ('PULLSTUD', 'ADAPTOR', 'NUT_COLLET', 'CUTTING_TOOL', 'INSERT')),
    
    -- Foreign keys to master tables (only one will be set based on bom_type)
    pullstud_id INTEGER REFERENCES master_pullstud(id) ON DELETE SET NULL,
    adaptor_id INTEGER REFERENCES master_adaptor(id) ON DELETE SET NULL,
    nut_collet_id INTEGER REFERENCES master_nut_collet(id) ON DELETE SET NULL,
    cutting_tool_id INTEGER REFERENCES master_cutting_tool(id) ON DELETE SET NULL,
    insert_id INTEGER REFERENCES master_insert(id) ON DELETE SET NULL,
    
    -- Additional fields
    description VARCHAR(200),
    drawing_file VARCHAR(255),  -- Path to uploaded drawing file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint: Each tool can have only one BOM entry per type
    CONSTRAINT unique_tool_bom_type UNIQUE (tool_id, bom_type)
);

-- Indexes for performance
CREATE INDEX idx_tool_bom_tool ON tool_bom(tool_id);
CREATE INDEX idx_tool_bom_type ON tool_bom(bom_type);
CREATE INDEX idx_tool_bom_tool_type ON tool_bom(tool_id, bom_type);


-- ============================================================================
-- Updated Machine Tools Table - Auto Tool Number Generation
-- ============================================================================

-- Note: Tool number is now auto-generated based on machine + component
-- Format: T01, T02, T03... incrementing per machine + component combination

ALTER TABLE machine_tools ADD COLUMN IF NOT EXISTS tool_description TEXT;

-- Add constraint for unique tool numbers per machine + component
CREATE UNIQUE INDEX idx_unique_tool_number_machine_component 
ON machine_tools(machine_id, component_id, tool_number);


-- ============================================================================
-- Views for Easy Data Retrieval
-- ============================================================================

-- View: Complete BOM with Master Details
CREATE OR REPLACE VIEW v_tool_bom_complete AS
SELECT 
    tb.id,
    tb.tool_id,
    mt.tool_number,
    mt.tool_name,
    tb.bom_type,
    tb.description,
    tb.drawing_file,
    
    -- Pull Stud details
    ps.code AS pullstud_code,
    ps.description AS pullstud_description,
    
    -- Adaptor details
    ad.code AS adaptor_code,
    ad.description AS adaptor_description,
    
    -- Nut/Collet details
    nc.code AS nut_collet_code,
    nc.description AS nut_collet_description,
    
    -- Cutting Tool details
    ct.code AS cutting_tool_code,
    ct.description AS cutting_tool_description,
    ct.diameter AS cutting_tool_diameter,
    
    -- Insert details
    ins.code AS insert_code,
    ins.description AS insert_description,
    ins.grade AS insert_grade,
    
    tb.created_at,
    tb.updated_at
FROM tool_bom tb
LEFT JOIN machine_tools mt ON tb.tool_id = mt.id
LEFT JOIN master_pullstud ps ON tb.pullstud_id = ps.id
LEFT JOIN master_adaptor ad ON tb.adaptor_id = ad.id
LEFT JOIN master_nut_collet nc ON tb.nut_collet_id = nc.id
LEFT JOIN master_cutting_tool ct ON tb.cutting_tool_id = ct.id
LEFT JOIN master_insert ins ON tb.insert_id = ins.id;


-- ============================================================================
-- Stored Procedure: Auto-generate Tool Number
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_tool_number(
    p_machine_id INTEGER,
    p_component_id INTEGER DEFAULT NULL
) RETURNS VARCHAR(10) AS $$
DECLARE
    max_number INTEGER;
    next_number INTEGER;
BEGIN
    -- Get the maximum tool number for the machine (and optionally component)
    IF p_component_id IS NOT NULL THEN
        SELECT COALESCE(MAX(CAST(SUBSTRING(tool_number FROM 2) AS INTEGER)), 0)
        INTO max_number
        FROM machine_tools
        WHERE machine_id = p_machine_id 
        AND component_id = p_component_id;
    ELSE
        SELECT COALESCE(MAX(CAST(SUBSTRING(tool_number FROM 2) AS INTEGER)), 0)
        INTO max_number
        FROM machine_tools
        WHERE machine_id = p_machine_id;
    END IF;
    
    -- Increment and format
    next_number := max_number + 1;
    RETURN 'T' || LPAD(next_number::TEXT, 2, '0');
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- Sample Usage Examples
-- ============================================================================

-- Example 1: Create a tool with auto-generated tool number
-- SELECT get_next_tool_number(1, 1);  -- Returns "T01" for first tool

-- Example 2: Insert a complete BOM for a tool
/*
-- Assume tool_id = 5
INSERT INTO tool_bom (tool_id, bom_type, pullstud_id, description) 
VALUES (5, 'PULLSTUD', 1, 'Standard pull stud for HMC');

INSERT INTO tool_bom (tool_id, bom_type, adaptor_id, description) 
VALUES (5, 'ADAPTOR', 1, 'ER32 collet chuck');

INSERT INTO tool_bom (tool_id, bom_type, nut_collet_id, description) 
VALUES (5, 'NUT_COLLET', 1, '10mm collet');

INSERT INTO tool_bom (tool_id, bom_type, cutting_tool_id, description) 
VALUES (5, 'CUTTING_TOOL', 2, '10mm end mill');

INSERT INTO tool_bom (tool_id, bom_type, insert_id, description) 
VALUES (5, 'INSERT', 1, 'Face mill insert');
*/

-- Example 3: Query complete BOM for a tool
-- SELECT * FROM v_tool_bom_complete WHERE tool_id = 5;


-- ============================================================================
-- Trigger: Update timestamp on BOM changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_bom_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tool_bom_update
BEFORE UPDATE ON tool_bom
FOR EACH ROW
EXECUTE FUNCTION update_bom_timestamp();


-- ============================================================================
-- End of Schema
-- ============================================================================
