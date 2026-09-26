import * as adjustmentService from '../services/adjustment.service.js';
import * as operationService from '../services/operation.service.js';
import { sendSuccess } from '../utils/response.js';

/** Handlers for receipts, deliveries and transfers ("kind" = receipt | delivery | transfer). */
export function operationController(kind) {
  return {
    list: async (req, res) => sendSuccess(res, await operationService.list(kind, req.valid.query)),
    get: async (req, res) => sendSuccess(res, await operationService.getById(kind, req.valid.params.id)),
    create: async (req, res) =>
      sendSuccess(res, await operationService.create(kind, req.valid.body, req.user), 201),
    update: async (req, res) =>
      sendSuccess(res, await operationService.update(kind, req.valid.params.id, req.valid.body)),
    confirm: async (req, res) => sendSuccess(res, await operationService.confirm(kind, req.valid.params.id)),
    validate: async (req, res) =>
      sendSuccess(res, await operationService.validate(kind, req.valid.params.id, req.user)),
    cancel: async (req, res) => sendSuccess(res, await operationService.cancel(kind, req.valid.params.id)),
  };
}

export const deliverySteps = {
  pick: async (req, res) => sendSuccess(res, await operationService.markDeliveryStep(req.valid.params.id, 'pick')),
  pack: async (req, res) => sendSuccess(res, await operationService.markDeliveryStep(req.valid.params.id, 'pack')),
};

export const adjustmentController = {
  list: async (req, res) => sendSuccess(res, await adjustmentService.list(req.valid.query)),
  get: async (req, res) => sendSuccess(res, await adjustmentService.getById(req.valid.params.id)),
  create: async (req, res) => sendSuccess(res, await adjustmentService.create(req.valid.body, req.user), 201),
  update: async (req, res) =>
    sendSuccess(res, await adjustmentService.update(req.valid.params.id, req.valid.body)),
  validate: async (req, res) =>
    sendSuccess(res, await adjustmentService.validate(req.valid.params.id, req.user)),
  cancel: async (req, res) => sendSuccess(res, await adjustmentService.cancel(req.valid.params.id)),
};
