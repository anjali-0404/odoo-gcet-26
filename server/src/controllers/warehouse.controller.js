import * as warehouseService from '../services/warehouse.service.js';
import { sendSuccess } from '../utils/response.js';

// Warehouses
export async function listWarehouses(req, res) {
  sendSuccess(res, await warehouseService.listWarehouses());
}

export async function getWarehouse(req, res) {
  sendSuccess(res, await warehouseService.getWarehouse(req.valid.params.id));
}

export async function createWarehouse(req, res) {
  sendSuccess(res, await warehouseService.createWarehouse(req.valid.body), 201);
}

export async function updateWarehouse(req, res) {
  sendSuccess(res, await warehouseService.updateWarehouse(req.valid.params.id, req.valid.body));
}

export async function deleteWarehouse(req, res) {
  sendSuccess(res, await warehouseService.deleteWarehouse(req.valid.params.id));
}

// Locations
export async function listLocations(req, res) {
  sendSuccess(res, await warehouseService.listLocations(req.valid.query));
}

export async function getLocation(req, res) {
  sendSuccess(res, await warehouseService.getLocation(req.valid.params.id));
}

export async function createLocation(req, res) {
  sendSuccess(res, await warehouseService.createLocation(req.valid.body), 201);
}

export async function updateLocation(req, res) {
  sendSuccess(res, await warehouseService.updateLocation(req.valid.params.id, req.valid.body));
}

export async function deleteLocation(req, res) {
  sendSuccess(res, await warehouseService.deleteLocation(req.valid.params.id));
}
