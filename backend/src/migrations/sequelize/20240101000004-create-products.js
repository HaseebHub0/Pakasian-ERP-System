'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      barcode: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      unit: {
        type: Sequelize.STRING(50),
        defaultValue: 'pcs'
      },
      cost_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      selling_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      min_stock_level: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      max_stock_level: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      weight: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true
      },
      weight_unit: {
        type: Sequelize.STRING(10),
        defaultValue: 'kg'
      },
      length: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      width: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      height: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      dimension_unit: {
        type: Sequelize.STRING(10),
        defaultValue: 'cm'
      },
      attributes: {
        type: Sequelize.JSON,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_taxable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('products', ['sku']);
    await queryInterface.addIndex('products', ['barcode']);
    await queryInterface.addIndex('products', ['category']);
    await queryInterface.addIndex('products', ['brand']);
    await queryInterface.addIndex('products', ['is_active']);
    await queryInterface.addIndex('products', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  }
};
