import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { MODULES } from '../constants/modules.js';
import { ACTIONS } from '../constants/permissions.js';
import { hashPassword } from '../utils/crypto.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const getUsersList = async (queryParams) => {
  const { search, status, roleId, page = 1, limit = 10 } = queryParams;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (roleId) {
    filter.roleId = roleId;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Retrieve user matching details
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('roleId')
    .populate('invitedBy', 'name email');

  const count = await User.countDocuments(filter);

  return {
    users,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(count / limitNum)
    }
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id).populate('roleId').populate('invitedBy', 'name email');
  if (!user) {
    throw new NotFoundError('User profile context not found.');
  }
  return user;
};

export const updateUserProfile = async (id, updateData) => {
  const { name, roleId, permissions, status } = updateData;

  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User profile context not found.');
  }

  // Prevent editing the fallback absolute Admin to avoid locking out directories
  if (user.email === 'admin@example.com' && status === 'Disabled') {
    throw new BadRequestError('The default Administrator profile cannot be marked disabled.');
  }

  if (name) user.name = name;
  
  if (status) user.status = status;

  if (roleId) {
    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      throw new NotFoundError('Selected Role definition not found in system.');
    }
    user.roleId = roleId;
  }

  // Clean empty array values if overrides are unset or configured
  if (permissions !== undefined) {
    user.permissions = permissions.length === 0 ? undefined : permissions;
  }

  await user.save();
  return await user.populate('roleId');
};

export const deleteUserAccount = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User profile details not found.');
  }

  if (user.email === 'admin@example.com') {
    throw new BadRequestError('The primary Administrator log user cannot be deleted.');
  }

  await User.findByIdAndDelete(id);
  return user;
};

// Database Seeder
export const seedRolesAndAdminAccount = async () => {
  try {
    // 1. Seed Roles
    const countRoles = await Role.countDocuments();
    let adminRole, managerRole, employeeRole;

    if (countRoles === 0) {
      logger.info('Database empty. Seeding roles...');
      
      const allModules = Object.values(MODULES);
      const allActions = Object.values(ACTIONS);

      adminRole = await Role.create({
        name: 'Admin',
        description: 'Super User with complete system rights across all modules.',
        permissions: allModules.map(module => ({
          module,
          actions: allActions
        }))
      });

      managerRole = await Role.create({
        name: 'Manager',
        description: 'Management staff who can read, create, and edit Products.',
        permissions: [
          {
            module: MODULES.PRODUCTS,
            actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE]
          }
        ]
      });

      employeeRole = await Role.create({
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
    } else {
      adminRole = await Role.findOne({ name: 'Admin' });
    }

    // 2. Seed Default Admin User
    const countUsers = await User.countDocuments();
    if (countUsers === 0 && adminRole) {
      logger.info('Seeding default administrator user profiles...');
      const defaultPassword = 'Admin@12345';
      const hashedPassword = await hashPassword(defaultPassword);

      const rootAdmin = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        roleId: adminRole._id,
        status: 'Active'
      });

      logger.info(`=========================================`);
      logger.info(`DEFAULT SYSTEM ADMIN CREATED`);
      logger.info(`Email: admin@example.com`);
      logger.info(`Password: ${defaultPassword}`);
      logger.info(`=========================================`);
    }
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
  }
};
