const encryptionService = require('./encryptionService');

class AuditService {
  constructor() {
    this.encryptionService = encryptionService;
    
    // Define which fields should be encrypted for each table
    this.encryptedFields = {
      purchases: ['supplier_contact', 'supplier_phone', 'supplier_email', 'supplier_address'],
      purchase_items: ['unit_price', 'total_price'],
      sales_invoices: ['customer_contact', 'customer_phone', 'customer_email', 'customer_address'],
      sales_invoice_items: ['unit_price', 'total_price'],
      expenses: ['vendor_contact', 'reference_number'],
      stock_movements: ['driver_name', 'vehicle_number'],
      users: ['phone', 'address']
    };
    
    // Define activity types and categories
    this.activityTypes = {
      GATEKEEPER_ENTRY: 'gatekeeper_entry',
      ACCOUNTANT_TRANSACTION: 'accountant_transaction',
      ADMIN_ACTION: 'admin_action',
      SYSTEM_ACTION: 'system_action'
    };
    
    this.activityCategories = {
      STOCK_MOVEMENT: 'stock_movement',
      FINANCIAL: 'financial',
      USER_MANAGEMENT: 'user_management',
      PRODUCT_MANAGEMENT: 'product_management',
      SYSTEM_CONFIG: 'system_config'
    };
  }

  /**
   * Log gatekeeper activities
   */
  async logGatekeeperActivity(req, action, tableName, recordId, oldData = null, newData = null) {
    const activityDescription = this.generateGatekeeperDescription(action, tableName, newData);
    
    return await this.logActivity({
      req,
      activityType: this.activityTypes.GATEKEEPER_ENTRY,
      activityCategory: this.activityCategories.STOCK_MOVEMENT,
      activityDescription,
      tableName,
      recordId,
      action,
      oldData,
      newData
    });
  }

  /**
   * Log accountant activities
   */
  async logAccountantActivity(req, action, tableName, recordId, oldData = null, newData = null) {
    const activityDescription = this.generateAccountantDescription(action, tableName, newData);
    
    return await this.logActivity({
      req,
      activityType: this.activityTypes.ACCOUNTANT_TRANSACTION,
      activityCategory: this.activityCategories.FINANCIAL,
      activityDescription,
      tableName,
      recordId,
      action,
      oldData,
      newData
    });
  }

  /**
   * Log admin activities
   */
  async logAdminActivity(req, action, tableName, recordId, oldData = null, newData = null) {
    const activityDescription = this.generateAdminDescription(action, tableName, newData);
    
    return await this.logActivity({
      req,
      activityType: this.activityTypes.ADMIN_ACTION,
      activityCategory: this.getAdminCategory(tableName),
      activityDescription,
      tableName,
      recordId,
      action,
      oldData,
      newData
    });
  }

  /**
   * Main logging method
   */
  async logActivity({ req, activityType, activityCategory, activityDescription, tableName, recordId, action, oldData, newData }) {
    try {
      const { runQuery } = require('../config/database');
      
      // Get request information
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent') || '';
      const sessionId = req.sessionID || req.headers['x-session-id'] || null;
      const requestId = req.headers['x-request-id'] || null;
      
      // Process data for encryption
      const { encryptedOldData, sensitiveOldData } = this.processDataForLogging(oldData, tableName, recordId);
      const { encryptedNewData, sensitiveNewData } = this.processDataForLogging(newData, tableName, recordId);
      
      // Determine changed fields
      const changedFields = this.getChangedFields(oldData, newData);
      
      // Create metadata
      const metadata = {
        userRole: req.user?.role,
        userEmail: req.user?.email,
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        timestamp: new Date().toISOString()
      };
      
      // Insert audit log
      const result = await runQuery(`
        INSERT INTO audit_logs (
          table_name, record_id, action, old_values, new_values, changed_fields,
          user_id, ip_address, user_agent, activity_type, activity_category,
          activity_description, sensitive_data, session_id, request_id, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `, [
        tableName, recordId, action, 
        encryptedOldData ? JSON.stringify(encryptedOldData) : null,
        encryptedNewData ? JSON.stringify(encryptedNewData) : null,
        changedFields,
        req.user?.id, ipAddress, userAgent, activityType, activityCategory,
        activityDescription, 
        JSON.stringify({ old: sensitiveOldData, new: sensitiveNewData }),
        sessionId, requestId, JSON.stringify(metadata)
      ]);
      
      return result[0].id;
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error to avoid breaking the main operation
      return null;
    }
  }

  /**
   * Process data for logging with encryption
   */
  processDataForLogging(data, tableName, recordId) {
    if (!data) return { encryptedOldData: null, sensitiveOldData: null };
    
    const fieldsToEncrypt = this.encryptedFields[tableName] || [];
    const { encrypted, sensitiveData } = this.encryptionService.encryptFields(data, fieldsToEncrypt, recordId);
    
    return {
      encryptedOldData: encrypted,
      sensitiveOldData: sensitiveData
    };
  }

  /**
   * Get changed fields between old and new data
   */
  getChangedFields(oldData, newData) {
    if (!oldData || !newData) return null;
    
    const changedFields = [];
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changedFields.push(key);
      }
    }
    
    return changedFields.length > 0 ? changedFields.join(',') : null;
  }

  /**
   * Generate activity descriptions
   */
  generateGatekeeperDescription(action, tableName, data) {
    switch (tableName) {
      case 'stock_movements':
        if (action === 'insert') {
          return `Gatekeeper recorded ${data.movement_type} stock movement: ${data.quantity} units of product ${data.product_id} via vehicle ${data.vehicle_number}`;
        }
        return `Gatekeeper ${action}d stock movement record`;
      
      default:
        return `Gatekeeper ${action} on ${tableName}`;
    }
  }

  generateAccountantDescription(action, tableName, data) {
    switch (tableName) {
      case 'purchases':
        if (action === 'insert') {
          return `Accountant created purchase order ${data.purchase_number} for ${data.supplier_name}`;
        }
        return `Accountant ${action}d purchase order`;
      
      case 'sales_invoices':
        if (action === 'insert') {
          return `Accountant created sales invoice ${data.invoice_number} for ${data.customer_name}`;
        }
        return `Accountant ${action}d sales invoice`;
      
      case 'expenses':
        if (action === 'insert') {
          return `Accountant recorded expense ${data.expense_number}: ${data.description} (${data.expense_category})`;
        }
        return `Accountant ${action}d expense record`;
      
      default:
        return `Accountant ${action} on ${tableName}`;
    }
  }

  generateAdminDescription(action, tableName, data) {
    switch (tableName) {
      case 'users':
        if (action === 'insert') {
          return `Admin created user account for ${data.name} (${data.email}) with role ${data.role}`;
        } else if (action === 'update') {
          return `Admin updated user account for ${data.name || 'user'}`;
        }
        return `Admin ${action}d user account`;
      
      case 'products':
        if (action === 'insert') {
          return `Admin added new product: ${data.name} (${data.sku})`;
        } else if (action === 'update') {
          return `Admin updated product: ${data.name || 'product'}`;
        }
        return `Admin ${action}d product`;
      
      case 'warehouses':
        if (action === 'insert') {
          return `Admin created warehouse: ${data.name} in ${data.location}`;
        }
        return `Admin ${action}d warehouse`;
      
      default:
        return `Admin ${action} on ${tableName}`;
    }
  }

  getAdminCategory(tableName) {
    switch (tableName) {
      case 'users':
        return this.activityCategories.USER_MANAGEMENT;
      case 'products':
        return this.activityCategories.PRODUCT_MANAGEMENT;
      case 'warehouses':
        return this.activityCategories.SYSTEM_CONFIG;
      default:
        return this.activityCategories.SYSTEM_CONFIG;
    }
  }

  /**
   * Retrieve audit logs with decryption
   */
  async getAuditLogs(filters = {}) {
    try {
      const { runQuery } = require('../config/database');
      
      let whereClause = '';
      let params = [];
      let paramIndex = 1;
      
      if (filters.activityType) {
        whereClause += `WHERE activity_type = $${paramIndex}`;
        params.push(filters.activityType);
        paramIndex++;
      }
      
      if (filters.activityCategory) {
        whereClause += whereClause ? ` AND activity_category = $${paramIndex}` : `WHERE activity_category = $${paramIndex}`;
        params.push(filters.activityCategory);
        paramIndex++;
      }
      
      if (filters.tableName) {
        whereClause += whereClause ? ` AND table_name = $${paramIndex}` : `WHERE table_name = $${paramIndex}`;
        params.push(filters.tableName);
        paramIndex++;
      }
      
      if (filters.userId) {
        whereClause += whereClause ? ` AND user_id = $${paramIndex}` : `WHERE user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }
      
      if (filters.startDate) {
        whereClause += whereClause ? ` AND created_at >= $${paramIndex}` : `WHERE created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        whereClause += whereClause ? ` AND created_at <= $${paramIndex}` : `WHERE created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      const logs = await runQuery(`
        SELECT al.*, u.name as user_name, u.role as user_role
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);
      
      // Decrypt sensitive data for each log
      const decryptedLogs = logs.map(log => {
        try {
          const sensitiveData = log.sensitive_data ? JSON.parse(log.sensitive_data) : null;
          if (sensitiveData && sensitiveData.old) {
            // Decrypt old values
            for (const [field, encryptedField] of Object.entries(sensitiveData.old)) {
              if (encryptedField && encryptedField.encrypted) {
                const decryptedValue = this.encryptionService.decrypt(encryptedField, field, log.record_id);
                if (log.old_values) {
                  const oldValues = JSON.parse(log.old_values);
                  oldValues[field] = decryptedValue;
                  log.old_values = JSON.stringify(oldValues);
                }
              }
            }
          }
          
          if (sensitiveData && sensitiveData.new) {
            // Decrypt new values
            for (const [field, encryptedField] of Object.entries(sensitiveData.new)) {
              if (encryptedField && encryptedField.encrypted) {
                const decryptedValue = this.encryptionService.decrypt(encryptedField, field, log.record_id);
                if (log.new_values) {
                  const newValues = JSON.parse(log.new_values);
                  newValues[field] = decryptedValue;
                  log.new_values = JSON.stringify(newValues);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error decrypting audit log:', error);
        }
        
        return log;
      });
      
      return decryptedLogs;
    } catch (error) {
      console.error('Error retrieving audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
