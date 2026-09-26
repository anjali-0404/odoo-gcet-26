import { Router } from 'express';
import * as reports from '../controllers/report.controller.js';
import validate from '../middleware/validate.js';
import {
  dashboardOperationsQuery,
  dashboardSummaryQuery,
  ledgerListQuery,
} from '../validators/operation.validators.js';

export const ledgerRoutes = Router().get('/', validate({ query: ledgerListQuery }), reports.ledger);

export const dashboardRoutes = Router()
  .get('/summary', validate({ query: dashboardSummaryQuery }), reports.dashboardSummary)
  .get('/operations', validate({ query: dashboardOperationsQuery }), reports.dashboardOperations);
