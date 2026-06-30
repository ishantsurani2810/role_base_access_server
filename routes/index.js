import express from 'express';
import authRoutes from './auth.routes.js';
import invitationRoutes from './invitation.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './product.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/invitations', invitationRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'System is operational.',
    timestamp: new Date()
  });
});

export default router;
