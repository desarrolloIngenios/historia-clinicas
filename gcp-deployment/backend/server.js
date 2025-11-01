const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Configuración de la aplicación
const app = express();
const PORT = process.env.PORT || 8080;

// ===== CONFIGURACIÓN DE SEGURIDAD =====

// Helmet para headers de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes, intente de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 intentos de login por ventana
  message: {
    error: 'Demasiados intentos de autenticación, intente de nuevo más tarde.',
    retryAfter: '15 minutos'
  }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// CORS configurado para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://clinical-records.healthcare.com'] // Dominio de producción
    : ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== CONFIGURACIÓN DE BASE DE DATOS =====

const sequelize = new Sequelize(
  process.env.DB_NAME || 'clinical_records',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// ===== MODELOS DE BASE DE DATOS =====

// Modelo de Usuario
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('admin', 'medico', 'enfermera', 'paciente'),
    allowNull: false,
    defaultValue: 'paciente'
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  speciality: {
    type: Sequelize.STRING,
    allowNull: true
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: Sequelize.DATE,
    allowNull: true
  },
  failedLoginAttempts: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  lockedUntil: {
    type: Sequelize.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['username'] },
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

// Modelo de Paciente
const Patient = sequelize.define('Patient', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: [10, 15]
    }
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  birthDate: {
    type: Sequelize.DATEONLY,
    allowNull: true
  },
  gender: {
    type: Sequelize.ENUM('M', 'F', 'O'),
    allowNull: true
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  emergencyContact: {
    type: Sequelize.STRING,
    allowNull: true
  },
  emergencyPhone: {
    type: Sequelize.STRING,
    allowNull: true
  },
  encryptedData: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: Sequelize.ENUM('active', 'inactive', 'forgotten'),
    defaultValue: 'active'
  },
  createdBy: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'patients',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['createdBy'] }
  ]
});

// Modelo de Historia Clínica
const MedicalRecord = sequelize.define('MedicalRecord', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: Patient,
      key: 'id'
    }
  },
  doctorId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  motivo: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  antecedentes: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  examenFisico: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  diagnostico: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  analisis: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  planManejo: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  encryptedData: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  digitalSignature: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  version: {
    type: Sequelize.INTEGER,
    defaultValue: 1
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'medical_records',
  timestamps: true,
  indexes: [
    { fields: ['patientId'] },
    { fields: ['doctorId'] },
    { fields: ['createdAt'] }
  ]
});

// Modelo de Auditoría
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  action: {
    type: Sequelize.STRING,
    allowNull: false
  },
  resourceType: {
    type: Sequelize.STRING,
    allowNull: true
  },
  resourceId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  details: {
    type: Sequelize.JSONB,
    allowNull: true
  },
  ipAddress: {
    type: Sequelize.STRING,
    allowNull: true
  },
  userAgent: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sessionId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  timestamp: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW
  }
}, {
  tableName: 'audit_logs',
  timestamps: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['timestamp'] },
    { fields: ['resourceType', 'resourceId'] }
  ]
});

// Definir asociaciones
User.hasMany(Patient, { foreignKey: 'createdBy' });
Patient.belongsTo(User, { foreignKey: 'createdBy' });

Patient.hasMany(MedicalRecord, { foreignKey: 'patientId' });
MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId' });

User.hasMany(MedicalRecord, { foreignKey: 'doctorId' });
MedicalRecord.belongsTo(User, { foreignKey: 'doctorId' });

User.hasMany(AuditLog, { foreignKey: 'userId' });
AuditLog.belongsTo(User, { foreignKey: 'userId' });

// ===== UTILIDADES DE SEGURIDAD =====

class SecurityUtils {
  static encrypt(data, key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production') {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  static decrypt(encryptedData, key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production') {
    const algorithm = 'aes-256-gcm';
    const decipher = crypto.createDecipher(algorithm, key);
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '')
      .replace(/['"]/g, '')
      .trim();
  }

  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    await logAuditEvent(null, 'AUTH_FAILED', 'No token provided', req);
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      await logAuditEvent(decoded.userId, 'AUTH_FAILED', 'User not found or inactive', req);
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = user;
    next();
  } catch (error) {
    await logAuditEvent(null, 'AUTH_FAILED', 'Invalid token', req);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware de autorización por roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      logAuditEvent(req.user.id, 'AUTHORIZATION_FAILED', `Required roles: ${roles.join(', ')}, User role: ${req.user.role}`, req);
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
};

// Función de auditoría
const logAuditEvent = async (userId, action, details, req) => {
  try {
    await AuditLog.create({
      userId: userId,
      action: action,
      details: typeof details === 'string' ? { message: details } : details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionId || 'unknown'
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// ===== RUTAS DE AUTENTICACIÓN =====

app.post('/api/auth/login', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAuditEvent(null, 'LOGIN_VALIDATION_FAILED', errors.array(), req);
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    
    const user = await User.findOne({ where: { username: username.toLowerCase() } });
    
    if (!user) {
      await logAuditEvent(null, 'LOGIN_FAILED', `Username not found: ${username}`, req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si la cuenta está bloqueada
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      await logAuditEvent(user.id, 'LOGIN_BLOCKED', 'Account temporarily locked', req);
      return res.status(423).json({ error: 'Cuenta temporalmente bloqueada' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await user.increment('failedLoginAttempts');
      
      if (user.failedLoginAttempts >= 5) {
        // Bloquear cuenta por 15 minutos
        await user.update({
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
          failedLoginAttempts: 0
        });
      }
      
      await logAuditEvent(user.id, 'LOGIN_FAILED', 'Invalid password', req);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Login exitoso
    await user.update({
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'change-this-secret',
      { expiresIn: '8h' }
    );

    await logAuditEvent(user.id, 'LOGIN_SUCCESS', 'Successful authentication', req);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        speciality: user.speciality
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    await logAuditEvent(null, 'LOGIN_ERROR', error.message, req);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== RUTAS DE PACIENTES =====

app.get('/api/patients', authenticateToken, authorize('admin', 'medico', 'enfermera'), async (req, res) => {
  try {
    const patients = await Patient.findAll({
      where: { isActive: true, status: 'active' },
      include: [{
        model: User,
        attributes: ['name', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });

    await logAuditEvent(req.user.id, 'PATIENTS_LIST_ACCESSED', `Retrieved ${patients.length} patients`, req);

    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    await logAuditEvent(req.user.id, 'PATIENTS_LIST_ERROR', error.message, req);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

app.post('/api/patients', authenticateToken, authorize('admin', 'medico'), [
  body('name').isLength({ min: 2 }).trim().escape(),
  body('phone').isLength({ min: 10, max: 15 }).trim(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await logAuditEvent(req.user.id, 'PATIENT_CREATE_VALIDATION_FAILED', errors.array(), req);
      return res.status(400).json({ errors: errors.array() });
    }

    const patientData = {
      ...req.body,
      createdBy: req.user.id,
      name: SecurityUtils.sanitizeInput(req.body.name),
      phone: SecurityUtils.sanitizeInput(req.body.phone)
    };

    const patient = await Patient.create(patientData);

    await logAuditEvent(req.user.id, 'PATIENT_CREATED', { patientId: patient.id, name: patient.name }, req);

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    await logAuditEvent(req.user.id, 'PATIENT_CREATE_ERROR', error.message, req);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

// ===== RUTAS DE HISTORIA CLÍNICA =====

app.get('/api/patients/:id/medical-records', authenticateToken, authorize('admin', 'medico', 'enfermera'), async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    
    const records = await MedicalRecord.findAll({
      where: { patientId: patientId, isActive: true },
      include: [{
        model: User,
        attributes: ['name', 'speciality']
      }],
      order: [['createdAt', 'DESC']]
    });

    await logAuditEvent(req.user.id, 'MEDICAL_RECORDS_ACCESSED', { patientId }, req);

    res.json(records);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    await logAuditEvent(req.user.id, 'MEDICAL_RECORDS_ERROR', error.message, req);
    res.status(500).json({ error: 'Error al obtener historias clínicas' });
  }
});

// ===== RUTAS DE AUDITORÍA =====

app.get('/api/audit-logs', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (action) whereClause.action = action;
    if (userId) whereClause.userId = userId;

    const logs = await AuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['username', 'name', 'role']
      }],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    await logAuditEvent(req.user.id, 'AUDIT_LOGS_ACCESSED', { page, limit, filters: whereClause }, req);

    res.json({
      logs: logs.rows,
      total: logs.count,
      page: parseInt(page),
      totalPages: Math.ceil(logs.count / limit)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
});

// ===== MIDDLEWARE DE MANEJO DE ERRORES =====

app.use((err, req, res, next) => {
  console.error(err.stack);
  logAuditEvent(req.user?.id, 'SERVER_ERROR', err.message, req);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ===== HEALTH CHECK =====

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== INICIALIZACIÓN =====

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');

    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Crear usuario admin por defecto
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        username: 'admin',
        email: 'admin@clinical-records.com',
        passwordHash: hashedPassword,
        role: 'admin',
        name: 'Administrador del Sistema'
      });
      console.log('✅ Usuario admin creado');
    }

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
};

// Iniciar servidor
const startServer = async () => {
  await initializeDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Clinical Records API v2.0 - Seguro para producción`);
  });
};

// Manejo graceful de shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

startServer().catch(error => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

module.exports = app;