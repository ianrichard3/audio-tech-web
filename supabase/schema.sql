-- =============================================
-- SQL para crear las tablas en Supabase
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- Tabla de dispositivos
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de puntos del patchbay
CREATE TABLE patchbay_points (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de puertos (relación con devices y patchbay_points)
CREATE TABLE ports (
  id VARCHAR(50) PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('Input', 'Output', 'Other')) NOT NULL,
  patchbay_id INTEGER REFERENCES patchbay_points(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_ports_device_id ON ports(device_id);
CREATE INDEX idx_ports_patchbay_id ON ports(patchbay_id);
CREATE INDEX idx_devices_type ON devices(type);

-- =============================================
-- Habilitar Row Level Security (RLS)
-- =============================================

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE patchbay_points ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura pública (ajusta según tus necesidades)
CREATE POLICY "Allow public read access on devices"
  ON devices FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on ports"
  ON ports FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on patchbay_points"
  ON patchbay_points FOR SELECT
  USING (true);

-- Si necesitas que usuarios autenticados puedan modificar datos:
CREATE POLICY "Allow authenticated insert on devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on devices"
  ON devices FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on ports"
  ON ports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on ports"
  ON ports FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on ports"
  ON ports FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on patchbay_points"
  ON patchbay_points FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on patchbay_points"
  ON patchbay_points FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on patchbay_points"
  ON patchbay_points FOR DELETE
  TO authenticated
  USING (true);
