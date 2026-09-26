import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, Postman) which send no Origin header.
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      callback(null, false);
    },
  })
);
if (!env.isProduction) app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
