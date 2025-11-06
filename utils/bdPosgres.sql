-- Usuarios del sistema
CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contra VARCHAR(255) NOT NULL,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    tipo_usuario INT NOT NULL,
    status INT NOT NULL DEFAULT 1
);

-- Sesiones activas
CREATE TABLE sesion (
    id_sesion SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_acceso TEXT NOT NULL,
    token_refresh TEXT NOT NULL,
    ip_cliente VARCHAR(45),
    user_agent TEXT,
    fecha_creacion TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP(6) NOT NULL,
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
);

-- Parcelas controladas por usuarios
CREATE TABLE parcela (
    id_parcela SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    nombre VARCHAR(100),
    descripcion TEXT,
    largo DECIMAL(10,2),
    ancho DECIMAL(10,2),
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_parcela_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE
);

-- Cultivo activo asignado a una parcela
CREATE TABLE cultivo (
    id_cultivo SERIAL PRIMARY KEY,
    id_parcela INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_cultivo_parcela FOREIGN KEY (id_parcela)
        REFERENCES parcela (id_parcela)
        ON DELETE CASCADE
);


CREATE TABLE iot (
    id_iot SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP,          
    status INT NOT NULL DEFAULT 1                
);


CREATE TABLE iot_parcela (
    id_iot_parcela SERIAL PRIMARY KEY,
    id_parcela INT NOT NULL,
    id_iot INT NOT NULL,
    ubicacion_parcela_x DECIMAL(10,2),  
    ubicacion_parcela_y DECIMAL(10,2),
    descripcion TEXT,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_iot_parcela FOREIGN KEY (id_parcela)
        REFERENCES parcela (id_parcela)
        ON DELETE CASCADE,
    CONSTRAINT fk_iot_dispositivo FOREIGN KEY (id_iot)
        REFERENCES iot (id_iot)
        ON DELETE CASCADE
);


CREATE TABLE sensor (
    id_sensor SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,         
    tipo VARCHAR(50) NOT NULL,              
    unidad_medicion VARCHAR(20) NOT NULL,    
    modelo VARCHAR(50),
    status INT NOT NULL DEFAULT 1
);


CREATE TABLE sensor_iot (
    id_sensor_iot SERIAL PRIMARY KEY,
    id_sensor INT NOT NULL,
    id_iot INT NOT NULL,
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_sensor FOREIGN KEY (id_sensor)
        REFERENCES sensor (id_sensor)
        ON DELETE CASCADE,
    CONSTRAINT fk_sensor_iot FOREIGN KEY (id_iot)
        REFERENCES iot (id_iot)
        ON DELETE CASCADE
);

ALTER TABLE cultivo DROP CONSTRAINT fk_cultivo_parcela;
ALTER TABLE cultivo DROP COLUMN id_parcela;

ALTER TABLE parcela
ADD COLUMN id_cultivo INT,
ADD CONSTRAINT fk_parcela_cultivo
FOREIGN KEY (id_cultivo)
REFERENCES cultivo (id_cultivo)
ON DELETE SET NULL
ON UPDATE NO ACTION;




/////
DROP TABLE IF EXISTS parcela CASCADE;
DROP TABLE IF EXISTS cultivo CASCADE;

-- Luego pega las tablas nuevas arriba 👆

-- ==========================
-- 🌱 TABLA PARCELA
-- ==========================
CREATE TABLE parcela (
    id_parcela SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_cultivo INT UNIQUE, 
    nombre VARCHAR(100),
    descripcion TEXT,
    largo DECIMAL(10,2),
    ancho DECIMAL(10,2),
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_parcela_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT fk_parcela_cultivo FOREIGN KEY (id_cultivo)
        REFERENCES cultivo (id_cultivo)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- ==========================
-- 🌾 TABLA CULTIVO
-- ==========================
CREATE TABLE cultivo (
    id_cultivo SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    status INT NOT NULL DEFAULT 1
);


-- 1️⃣ Elimina la tabla intermedia (ya no se usará)
DROP TABLE IF EXISTS iot_parcela CASCADE;

-- 2️⃣ Elimina la tabla iot (para recrearla con el campo id_parcela)
DROP TABLE IF EXISTS iot CASCADE;

-- 3️⃣ (opcional) Si quieres asegurar integridad en cascada, primero elimina dependencias de iot (por ejemplo sensor_iot)
-- DROP TABLE IF EXISTS sensor_iot CASCADE;


CREATE TABLE iot (
    id_iot SERIAL PRIMARY KEY,
    id_parcela INT NOT NULL,
    descripcion TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP,
    status INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_iot_parcela FOREIGN KEY (id_parcela)
        REFERENCES parcela (id_parcela)
        ON DELETE CASCADE
);



-- 🌡️ Sensor de temperatura ambiental
INSERT INTO sensor (nombre, tipo, unidad_medicion, modelo, status)
VALUES ('Sensor de Temperatura Ambiental', 'Temperatura', '°C', 'DHT11', 1);

-- 🌱 Sensor de temperatura del suelo
INSERT INTO sensor (nombre, tipo, unidad_medicion, modelo, status)
VALUES ('Sensor de Temperatura del Suelo', 'Temperatura Suelo', '°C', 'DS18B20', 1);

-- 💧 Sensor de humedad ambiental
INSERT INTO sensor (nombre, tipo, unidad_medicion, modelo, status)
VALUES ('Sensor de Humedad Ambiental', 'Humedad', '%', 'DHT11', 1);

-- ☀️ Sensor de luz (luminosidad)
INSERT INTO sensor (nombre, tipo, unidad_medicion, modelo, status)
VALUES ('Sensor de Luz', 'Luminosidad', 'lx', 'BH1750', 1);

-- 👁️ Sensor PIR (movimiento)
INSERT INTO sensor (nombre, tipo, unidad_medicion, modelo, status)
VALUES ('Sensor de Movimiento PIR', 'Movimiento', 'Detección', 'HC-SR501', 1);

-- 📸 Cámara (monitoreo visual)
INSERT INTO sensor (nombre, tipo, unidad_medicion, modelo, status)
VALUES ('Cámara de Monitoreo', 'Imagen', 'Fotograma', 'ESP32-CAM', 1);
