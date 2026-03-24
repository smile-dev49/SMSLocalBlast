import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { verifyRouter } from './routes/verify.js';

const port = Number(process.env.PORT) || 3001;
const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'SMS LocalBlast License Server',
    version: '1.0.0',
    verify: 'POST /api/v1/verify-license',
  });
});

app.use('/api/v1', verifyRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`License server listening on http://localhost:${port}`);
});
