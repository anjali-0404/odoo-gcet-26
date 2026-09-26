import * as dashboardService from '../services/dashboard.service.js';
import * as ledgerService from '../services/ledger.service.js';
import { sendSuccess } from '../utils/response.js';

export async function ledger(req, res) {
  sendSuccess(res, await ledgerService.list(req.valid.query));
}

export async function dashboardSummary(req, res) {
  sendSuccess(res, await dashboardService.summary(req.valid.query));
}

export async function dashboardOperations(req, res) {
  sendSuccess(res, await dashboardService.operations(req.valid.query));
}
