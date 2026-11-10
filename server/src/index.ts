import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'JUST' }));

app.listen(3001, () => console.log('API en http://localhost:3001'));