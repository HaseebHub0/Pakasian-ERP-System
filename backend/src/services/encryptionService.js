const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // In production, these should be stored securely (e.g., AWS KMS, Azure Key Vault)
    this.algorithm = 'aes-256-gcm';
    this.keyDerivationIterations = 100000;
    this.saltLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    
    // Master key - in production, this should be retrieved from secure key management
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY || 'pakasian-erp-master-key-2024-secure';
  }

  /**
   * Generate a unique encryption key for each field
   */
  generateFieldKey(fieldName, recordId) {
    const keyMaterial = `${this.masterKey}-${fieldName}-${recordId}`;
    const salt = crypto.randomBytes(this.saltLength);
    const key = crypto.pbkdf2Sync(keyMaterial, salt, this.keyDerivationIterations, 32, 'sha256');
    return { key, salt };
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data, fieldName, recordId) {
    try {
      if (!data || data === '') return null;
      
      const { key, salt } = this.generateFieldKey(fieldName, recordId);
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(fieldName, 'utf8'));
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted: encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        keyId: `${fieldName}-${recordId}-${Date.now()}`
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData, fieldName, recordId) {
    try {
      if (!encryptedData || !encryptedData.encrypted) return null;
      
      const { key } = this.generateFieldKey(fieldName, recordId);
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(fieldName, 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt multiple fields at once
   */
  encryptFields(data, fieldsToEncrypt, recordId) {
    const encrypted = {};
    const sensitiveData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (fieldsToEncrypt.includes(key) && value !== null && value !== '') {
        const encryptedField = this.encrypt(value, key, recordId);
        sensitiveData[key] = encryptedField;
        encrypted[key] = '[ENCRYPTED]';
      } else {
        encrypted[key] = value;
      }
    }
    
    return { encrypted, sensitiveData };
  }

  /**
   * Decrypt multiple fields at once
   */
  decryptFields(data, sensitiveData, recordId) {
    const decrypted = { ...data };
    
    for (const [key, encryptedField] of Object.entries(sensitiveData)) {
      if (encryptedField && encryptedField.encrypted) {
        decrypted[key] = this.decrypt(encryptedField, key, recordId);
      }
    }
    
    return decrypted;
  }

  /**
   * Hash data for audit purposes (one-way)
   */
  hash(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Generate audit trail hash
   */
  generateAuditHash(oldData, newData, action) {
    const auditData = {
      old: oldData,
      new: newData,
      action: action,
      timestamp: new Date().toISOString()
    };
    return this.hash(auditData);
  }
}

module.exports = new EncryptionService();
