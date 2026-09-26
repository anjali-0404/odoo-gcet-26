import { Router } from 'express';
import * as wh from '../controllers/warehouse.controller.js';
import validate from '../middleware/validate.js';
import { idParams } from '../validators/common.js';
import {
  locationCreateSchema,
  locationListQuery,
  locationUpdateSchema,
  warehouseCreateSchema,
  warehouseUpdateSchema,
} from '../validators/warehouse.validators.js';

export const warehouseRoutes = Router()
  .get('/', wh.listWarehouses)
  .post('/', validate({ body: warehouseCreateSchema }), wh.createWarehouse)
  .get('/:id', validate({ params: idParams }), wh.getWarehouse)
  .patch('/:id', validate({ params: idParams, body: warehouseUpdateSchema }), wh.updateWarehouse)
  .delete('/:id', validate({ params: idParams }), wh.deleteWarehouse);

export const locationRoutes = Router()
  .get('/', validate({ query: locationListQuery }), wh.listLocations)
  .post('/', validate({ body: locationCreateSchema }), wh.createLocation)
  .get('/:id', validate({ params: idParams }), wh.getLocation)
  .patch('/:id', validate({ params: idParams, body: locationUpdateSchema }), wh.updateLocation)
  .delete('/:id', validate({ params: idParams }), wh.deleteLocation);
