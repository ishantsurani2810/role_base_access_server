import { ForbiddenError } from '../utils/errors.js';

export const checkPermission = (targetModule, requiredAction) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return next(new ForbiddenError('Authentication is required to verify permissions.'));
      }

      // Admin bypasses all fine-grained permission validations
      if (user.roleId && user.roleId.name === 'Admin') {
        return next();
      }

      const userOverrides = user.permissions || [];
      const rolePermissions = (user.roleId && user.roleId.permissions) || [];

      // Flag checks parameters
      let isGranted = false;

      // 1. Check if user has direct permission overrides for this module
      const moduleOverride = userOverrides.find(p => p.module === targetModule);
      
      if (moduleOverride) {
        // Direct module overrides replace the role permissions for this module
        isGranted = moduleOverride.actions.includes(requiredAction);
      } else {
        // 2. Check if user's role has permission for this module
        const roleModulePermission = rolePermissions.find(p => p.module === targetModule);
        if (roleModulePermission) {
          isGranted = roleModulePermission.actions.includes(requiredAction);
        }
      }

      if (!isGranted) {
        return next(new ForbiddenError(`Access Denied: You do not have permission to execute '${requiredAction}' on '${targetModule}'.`));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
