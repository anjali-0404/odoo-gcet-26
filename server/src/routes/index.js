import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import authRoutes from './auth.routes.js';
import { categoryRoutes, productRoutes, stockRoutes } from './catalog.routes.js';
import healthRoutes from './health.routes.js';
import { adjustmentRoutes, deliveryRoutes, receiptRoutes, transferRoutes } from './operation.routes.js';
import { dashboardRoutes, ledgerRoutes } from './report.routes.js';
import { locationRoutes, warehouseRoutes } from './warehouse.routes.js';

const router = Router();

// Public (auth.routes protects its own /me endpoints)
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Everything below requires a valid JWT
router.use('/categories', requireAuth, categoryRoutes);
router.use('/products', requireAuth, productRoutes);
router.use('/stock', requireAuth, stockRoutes);
router.use('/warehouses', requireAuth, warehouseRoutes);
router.use('/locations', requireAuth, locationRoutes);
router.use('/receipts', requireAuth, receiptRoutes);
router.use('/deliveries', requireAuth, deliveryRoutes);
router.use('/transfers', requireAuth, transferRoutes);
router.use('/adjustments', requireAuth, adjustmentRoutes);
router.use('/ledger', requireAuth, ledgerRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);

export default router;
