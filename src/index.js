import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db.js';

import userRoutes from './routes/user.routes.js';
import blogRoutes from "./routes/blog.route.js"
import ideaRoutes from "./routes/idea.routes.js"
import subCategoryRoutes from "./routes/subCategory.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import vendorRoutes from "./routes/vendor.routes.js"
import contactRoutes from "./routes/contact.route.js"

import cookieParser from 'cookie-parser';

import { seed } from './utils/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({origin : process.env.CLIENT_URL, credentials : true}))
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Karyaa Event Vendor Marketplace Server is running');
});


app.use('/api/v1/user', userRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/idea', ideaRoutes);
app.use('/api/v1/subcategories', subCategoryRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/contact', contactRoutes);


const startServer = async () => {
  try {
    await connectDB();
    // await seed()
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }

};

startServer();