import * as invitationService from '../services/invitation.service.js';
import { AuditLog } from '../models/audit.model.js';
import { Invitation } from '../models/invitation.model.js';

export const create = async (req, res, next) => {
  try {
    const invitation = await invitationService.createInvitation(req.body, req.user);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'INVITATION_CREATED',
      module: 'Invitations',
      details: { email: invitation.email, roleId: invitation.roleId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      status: 'success',
      message: 'Invitation sent successfully.',
      data: { invitation }
    });
  } catch (err) {
    next(err);
  }
};

export const validate = async (req, res, next) => {
  try {
    const { token } = req.query;
    const invitation = await invitationService.validateInvitationToken(token);

    res.status(200).json({
      status: 'success',
      data: {
        email: invitation.email,
        name: invitation.name,
        role: invitation.roleId
      }
    });
  } catch (err) {
    next(err);
  }
};

export const accept = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const user = await invitationService.acceptInvitation(token, password);

    await AuditLog.create({
      actorId: user._id,
      action: 'INVITATION_ACCEPTED',
      module: 'Invitations',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Password created and account activated successfully.',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const resend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitation = await invitationService.resendInvitationLink(id, req.user);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'INVITATION_RESENT',
      module: 'Invitations',
      details: { email: invitation.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Invitation resent successfully.',
      data: { invitation }
    });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitation = await invitationService.cancelInvitationLink(id);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'INVITATION_CANCELED',
      module: 'Invitations',
      details: { email: invitation.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      status: 'success',
      message: 'Invitation canceled and pending profile deleted.',
      data: { invitation }
    });
  } catch (err) {
    next(err);
  }
};

export const listAllPending = async (req, res, next) => {
  try {
    // Return invitations to display in user admin listings
    const list = await Invitation.find().populate('roleId').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: { invitations: list }
    });
  } catch (error) {
    next(error);
  }
};
