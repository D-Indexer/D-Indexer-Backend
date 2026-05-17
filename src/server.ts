import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import folderRoutes from './routes/folder.routes';
import templateRoutes from './routes/template.routes';
import uploadRoutes from './routes/upload.routes';
import healthRoutes from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';
import { startIndexer } from './indexer/stellar';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/folders', folderRoutes);
app.use('/templates', templateRoutes);
app.use('/upload', uploadRoutes);
app.use('/health', healthRoutes);

// Global error handler — must be last
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startIndexer();
});

export default app;
