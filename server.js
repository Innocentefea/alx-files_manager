import express from 'express';
import indexRoutes from './routes/index';

// create app object
const app = express();
app.use(express.json());
app.use('/', indexRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`);
});
