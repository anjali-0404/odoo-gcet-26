import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  sendSuccess(res, await categoryService.list());
}

export async function create(req, res) {
  sendSuccess(res, await categoryService.create(req.valid.body), 201);
}

export async function update(req, res) {
  sendSuccess(res, await categoryService.update(req.valid.params.id, req.valid.body));
}

export async function remove(req, res) {
  sendSuccess(res, await categoryService.remove(req.valid.params.id));
}
