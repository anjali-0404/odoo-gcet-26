import * as productService from '../services/product.service.js';
import { sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  sendSuccess(res, await productService.list(req.valid.query));
}

export async function get(req, res) {
  sendSuccess(res, await productService.getById(req.valid.params.id));
}

export async function create(req, res) {
  sendSuccess(res, await productService.create(req.valid.body, req.user), 201);
}

export async function update(req, res) {
  sendSuccess(res, await productService.update(req.valid.params.id, req.valid.body));
}

export async function archive(req, res) {
  sendSuccess(res, await productService.archive(req.valid.params.id));
}

export async function listStock(req, res) {
  sendSuccess(res, await productService.listStock(req.valid.query));
}
