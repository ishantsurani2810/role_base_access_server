import { Invitation } from '../models/invitation.model.js';
import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { generateRandomToken, hashPassword } from '../utils/crypto.js';
import { sendInvitationEmail } from './email.service.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

export const createInvitation = async (invitationData, adminUser) => {
  const { name, email, roleId, permissions } = invitationData;

  // 1. Verify target role exists
  const role = await Role.findById(roleId);
  if (!role) {
    throw new NotFoundError('Target Role definition not found.');
  }

  // 2. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.status !== 'Pending') {
    throw new ConflictError('A user with this email address already exists and is active.');
  }

  // 3. Clear any previous pending invitations for this email to avoid duplicates
  await Invitation.deleteMany({ email, status: 'Pending' });

  // 4. Generate random crypto token
  const token = generateRandomToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Invitation valid for 24 hours

  // 5. Create invitation record
  const invitation = await Invitation.create({
    name,
    email,
    roleId,
    permissions: permissions || undefined, // Direct permission overrides chosen at registration
    token,
    invitedBy: adminUser._id,
    expiresAt
  });

  // 6. Create User record in 'Pending' status if it doesn't exist
  let user = existingUser;
  if (!user) {
    user = await User.create({
      name,
      email,
      roleId,
      permissions: permissions || undefined,
      status: 'Pending',
      invitedBy: adminUser._id
    });
  } else {
    // Update existing pending user parameters
    user.name = name;
    user.roleId = roleId;
    user.permissions = permissions || undefined;
    await user.save();
  }

  // 7. Dispatch invitation email (which logs to console for local testing)
  await sendInvitationEmail(email, name, token);

  return invitation;
};

export const validateInvitationToken = async (token) => {
  if (!token) {
    throw new BadRequestError('Verification token is required.');
  }

  const invitation = await Invitation.findOne({ token, status: 'Pending' }).populate('roleId');
  if (!invitation) {
    throw new NotFoundError('Invitation invalid or token has already been accepted/revoked.');
  }

  if (invitation.isExpired()) {
    invitation.status = 'Expired';
    await invitation.save();
    throw new BadRequestError('This invitation has expired. Please request a new invitation link.');
  }

  return invitation;
};

export const acceptInvitation = async (token, password) => {
  // Validate token
  const invitation = await validateInvitationToken(token);

  const user = await User.findOne({ email: invitation.email });
  if (!user) {
    throw new NotFoundError('User profile details not found for this invitation.');
  }

  // Encrypt user password and transition user status to Active
  const hashedPassword = await hashPassword(password);
  user.password = hashedPassword;
  user.status = 'Active';
  await user.save();

  // Mark invitation accepted
  invitation.status = 'Accepted';
  await invitation.save();

  return user;
};

export const resendInvitationLink = async (invitationId, adminUser) => {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw new NotFoundError('Invitation record not found.');
  }

  if (invitation.status === 'Accepted') {
    throw new BadRequestError('Invitation has already been accepted.');
  }

  // Re-generate fresh details
  const token = generateRandomToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  invitation.token = token;
  invitation.status = 'Pending';
  invitation.invitedBy = adminUser._id;
  invitation.expiresAt = expiresAt;
  await invitation.save();

  // Dispatch email again
  await sendInvitationEmail(invitation.email, invitation.name, token);

  return invitation;
};

export const cancelInvitationLink = async (invitationId) => {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    throw new NotFoundError('Invitation record not found.');
  }

  if (invitation.status !== 'Pending') {
    throw new BadRequestError(`Only pending invitations can be canceled. Current status: ${invitation.status}`);
  }

  invitation.status = 'Canceled';
  await invitation.save();

  // Delete the pending user account directly to clear credentials
  await User.deleteOne({ email: invitation.email, status: 'Pending' });

  return invitation;
};
