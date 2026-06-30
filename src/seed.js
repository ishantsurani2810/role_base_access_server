import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { Role } from '../models/role.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Invitation } from '../models/invitation.model.js';
import { AuditLog } from '../models/audit.model.js';
import { Token } from '../models/token.model.js';
import { hashPassword } from '../utils/crypto.js';
import { MODULES } from '../constants/modules.js';
import { ACTIONS } from '../constants/permissions.js';
import logger from '../utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Connect to database
    await connectDatabase();

    // 1. Clear Existing Data
    logger.info('Clearing existing collections...');
    await Role.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Invitation.deleteMany({});
    await AuditLog.deleteMany({});
    await Token.deleteMany({});
    logger.info('Collections cleared.');

    // 2. Seed Roles
    logger.info('Seeding Roles...');
    const allModules = Object.values(MODULES);
    const allActions = Object.values(ACTIONS);

    const adminRole = await Role.create({
      name: 'Admin',
      description: 'Super User with complete system rights across all modules.',
      permissions: allModules.map(module => ({
        module,
        actions: allActions
      }))
    });

    const managerRole = await Role.create({
      name: 'Manager',
      description: 'Management staff who can read, create, and edit Products.',
      permissions: [
        {
          module: MODULES.PRODUCTS,
          actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE]
        }
      ]
    });

    const employeeRole = await Role.create({
      name: 'Employee',
      description: 'Standard staff with basic read access to Products only.',
      permissions: [
        {
          module: MODULES.PRODUCTS,
          actions: [ACTIONS.READ]
        }
      ]
    });
    logger.info('Roles seeded successfully.');

    // 3. Seed Users
    logger.info('Seeding Users...');
    const defaultHashedPassword = await hashPassword('Admin@12345');

    // Create System Admin
    const systemAdmin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: defaultHashedPassword,
      roleId: adminRole._id,
      status: 'Active'
    });

    // Create Manager Alice
    const managerAlice = await User.create({
      name: 'Alice Manager',
      email: 'manager@example.com',
      password: defaultHashedPassword,
      roleId: managerRole._id,
      status: 'Active',
      invitedBy: systemAdmin._id
    });

    // Create Employee Bob
    const employeeBob = await User.create({
      name: 'Bob Employee',
      email: 'employee@example.com',
      password: defaultHashedPassword,
      roleId: employeeRole._id,
      status: 'Active',
      invitedBy: systemAdmin._id
    });

    // Create Charlie Employee with Direct Permission Overrides
    // Standard Employee role only gets READ permission on Products.
    // We override to add CREATE and UPDATE permission to Charlie to showcase the PBAC direct override feature!
    const employeeCharlieWithOverrides = await User.create({
      name: 'Charlie Overrides',
      email: 'charlie@example.com',
      password: defaultHashedPassword,
      roleId: employeeRole._id,
      status: 'Active',
      invitedBy: systemAdmin._id,
      permissions: [
        {
          module: MODULES.PRODUCTS,
          actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE]
        }
      ]
    });

    // Create Disabled User
    await User.create({
      name: 'Disabled User',
      email: 'disabled@example.com',
      password: defaultHashedPassword,
      roleId: employeeRole._id,
      status: 'Disabled',
      invitedBy: systemAdmin._id
    });
    logger.info('Users seeded successfully.');

    // 4. Seed Products
    logger.info('Seeding Products...');
    const productsData = [
      {
        name: 'Dual Chamber PC Case',
        sku: 'CASE-DUAL-001',
        description: 'Premium PC case with high air circulation filters, dual-chamber PSU layout, and panoramic tempered glass windows.',
        price: 149.99,
        stock: 35,
        createdBy: systemAdmin._id,
        updatedBy: systemAdmin._id
      },
      {
        name: 'USB-C Mechanical Keyboard',
        sku: 'KBD-USBC-MECH',
        description: '75% Layout hot-swappable keyboard with yellow linear switches, pre-lubed stabilizers, and dynamic RGB backlighting.',
        price: 89.50,
        stock: 65,
        createdBy: managerAlice._id,
        updatedBy: managerAlice._id
      },
      {
        name: 'UltraWide Curved Monitor 34"',
        sku: 'MON-UW-34C',
        description: 'WQHD monitor featuring a 1500R curvature, 144Hz refresh speed support, and USB-C power delivery hubs.',
        price: 499.00,
        stock: 20,
        createdBy: systemAdmin._id,
        updatedBy: managerAlice._id
      },
      {
        name: 'Ergonomic Office Chair',
        sku: 'CHR-ERG-EX',
        description: 'High-back desk seat with fully adaptive mesh lumbar structures, 4D adjustable arm rests, and multi-directional tilt locking.',
        price: 279.00,
        stock: 12,
        createdBy: managerAlice._id,
        updatedBy: managerAlice._id
      },
      {
        name: 'Active Noise Cancelling Headphones',
        sku: 'HP-ANC-BT5',
        description: 'Over-ear wireless headphones with custom hybrid isolation feeds, quick-charge USB interface, and 40 hour battery spans.',
        price: 189.99,
        stock: 0, // Out of stock to test edge cases
        createdBy: systemAdmin._id,
        updatedBy: systemAdmin._id
      }
    ];

    await Product.insertMany(productsData);
    logger.info('Products seeded successfully.');

    // 5. Seed Invitations
    logger.info('Seeding Invitations...');
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const invitationsData = [
      {
        name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        roleId: managerRole._id,
        token: 'mock_token_pending_manager_invitation',
        status: 'Pending',
        invitedBy: systemAdmin._id,
        expiresAt: tomorrow
      },
      {
        name: 'Kyle Reese',
        email: 'kyle.reese@example.com',
        roleId: employeeRole._id,
        token: 'mock_token_expired_invitation',
        status: 'Expired',
        invitedBy: systemAdmin._id,
        expiresAt: yesterday
      },
      {
        name: 'T-800 Cyberdyne',
        email: 'cyberdyne@example.com',
        roleId: adminRole._id,
        token: 'mock_token_canceled_invitation',
        status: 'Canceled',
        invitedBy: systemAdmin._id,
        expiresAt: tomorrow
      },
      {
        name: 'Bob Employee',
        email: 'employee@example.com',
        roleId: employeeRole._id,
        token: 'mock_token_accepted_invitation',
        status: 'Accepted',
        invitedBy: systemAdmin._id,
        expiresAt: yesterday
      }
    ];

    await Invitation.insertMany(invitationsData);
    logger.info('Invitations seeded successfully.');

    // 6. Seed Audit Logs
    logger.info('Seeding Audit Logs...');
    const auditLogsData = [
      {
        actorId: systemAdmin._id,
        action: 'USER_LOGIN_SUCCESS',
        module: 'Authentication',
        details: { email: systemAdmin.email },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        actorId: systemAdmin._id,
        action: 'INVITATION_CREATED',
        module: 'Invitations',
        details: { email: 'sarah.connor@example.com', role: 'Manager' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      },
      {
        actorId: managerAlice._id,
        action: 'PRODUCT_CREATED',
        module: 'Products',
        details: { sku: 'KBD-USBC-MECH', price: 89.50 },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0'
      },
      {
        actorId: systemAdmin._id,
        action: 'USER_UPDATED',
        module: 'Users',
        details: { targetUser: 'charlie@example.com', msg: 'Granted direct overrides to Products' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    ];

    await AuditLog.insertMany(auditLogsData);
    logger.info('Audit Logs seeded successfully.');

    logger.info('Database seeding completed successfully!');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
