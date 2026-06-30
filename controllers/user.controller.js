import * as userService from '../services/user.service.js';
import { Role } from '../models/role.model.js';
import { AuditLog } from '../models/audit.model.js';

export const list = async (req, res, next) => {
  try {
    const listData = await userService.getUsersList(req.query);
    res.status(200).json({
      status: 'success',
      data: listData
    });
  } catch (err) {
    next(err);
  }
};

export const get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.updateUserProfile(id, req.body);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'USER_UPDATED',
      module: 'Users',
      details: { targetUserId: user._id, email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'User profile updated successfully.',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.deleteUserAccount(id);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'USER_DELETED',
      module: 'Users',
      details: { targetUserId: user._id, email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'User account deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const listRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.status(200).json({
      status: 'success',
      data: { roles }
    });
  } catch (err) {
    next(err);
  }
};
