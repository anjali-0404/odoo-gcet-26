/**
 * Seeds demo data through the real services (so stock and ledger stay consistent).
 *   npm run seed            -> refuses to run if users already exist
 *   npm run seed -- --reset -> wipes all StockSense collections first
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import * as operationService from '../services/operation.service.js';
import * as productService from '../services/product.service.js';
import * as warehouseService from '../services/warehouse.service.js';

const DEMO_USER = {
  name: 'Admin',
  loginId: 'admin01',
  email: 'admin@stocksense.local',
  password: 'Admin@12345',
};

async function main() {
  await connectDB(env.mongodbUri);
  const reset = process.argv.includes('--reset');

  if (reset) {
    for (const model of Object.values(mongoose.models)) await model.deleteMany({});
    console.log('[seed] Existing data removed');
  } else if (await User.exists({})) {
    console.log('[seed] Database already has users. Run "npm run seed -- --reset" to wipe and reseed.');
    return;
  }
  // Create collections/indexes up front (transactions cannot rely on implicit index builds).
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

  const user = await User.create(DEMO_USER);

  const mainWarehouse = await warehouseService.createWarehouse({
    name: 'Main Warehouse',
    code: 'WH',
    address: '12 Industrial Estate, Pune',
  });
  const stock = mainWarehouse.locations.find((l) => l.isDefault);
  const rack = await warehouseService.createLocation({ name: 'Production Rack', code: 'PROD', warehouse: mainWarehouse._id });
  await warehouseService.createLocation({ name: 'Rack A', code: 'RACKA', warehouse: mainWarehouse._id });
  await warehouseService.createWarehouse({ name: 'Secondary Warehouse', code: 'WH2', address: 'Mumbai' });

  const [raw, furniture, packaging] = await Category.create([
    { name: 'Raw Materials' },
    { name: 'Furniture' },
    { name: 'Packaging' },
  ]);

  const product = (name, sku, category, uom, unitCost, reorderLevel, qty) =>
    productService.create(
      { name, sku, category: category._id, uom, unitCost, reorderLevel, initialStock: { quantity: qty, location: stock._id } },
      user
    );

  const desk = await product('Desk', 'DESK001', furniture, 'Units', 3000, 10, 50);
  await product('Table', 'TABLE001', furniture, 'Units', 3000, 10, 50);
  const chair = await product('Chair', 'CHAIR001', furniture, 'Units', 800, 10, 8); // low stock
  await product('Iron Frame', 'FRAME001', raw, 'kg', 120, 25, 200);
  await product('Cardboard Box', 'BOX001', packaging, 'Units', 15, 50, 0); // out of stock

  await operationService.create(
    'receipt',
    { contact: 'Azure Interior', destLocation: stock._id, lines: [{ product: desk._id, quantity: 6 }] },
    user
  );
  const delivery = await operationService.create(
    'delivery',
    {
      contact: 'Azure Interior',
      deliveryAddress: '221B Baker Street',
      sourceLocation: stock._id,
      lines: [{ product: desk._id, quantity: 5 }],
    },
    user
  );
  await operationService.confirm('delivery', delivery._id);
  await operationService.create(
    'transfer',
    { sourceLocation: stock._id, destLocation: rack._id, lines: [{ product: chair._id, quantity: 2 }] },
    user
  );

  console.log('[seed] Done. Log in with:');
  console.log(`       Login ID: ${DEMO_USER.loginId}`);
  console.log(`       Password: ${DEMO_USER.password}`);
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
