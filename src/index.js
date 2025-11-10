import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db.js';

import utilRoutes from './routes/util.route.js';
import userRoutes from './routes/user.routes.js';
import blogRoutes from "./routes/blog.route.js"
import ideaRoutes from "./routes/idea.routes.js"
import subCategoryRoutes from "./routes/subCategory.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import vendorRoutes from "./routes/vendor.routes.js"
import reviewRoutes from "./routes/review.route.js"
import leadRoutes from "./routes/lead.route.js"
import ticketRoutes from "./routes/ticket.route.js"
import galleryRoutes from "./routes/gallery.routes.js"
import packageRoutes from "./routes/package.routes.js"
import adminRoutes from "./routes/admin/admin.routes.js"
import bundleRoutes from "./routes/bundle.routes.js"
import bannerRoutes from "./routes/adBanner.routes.js"
import brandDetailRoutes from "./routes/brandDetails.routes.js"
import referralRoutes from "./routes/refferral.routes.js"


import bundleStatsRoute from "./routes/admin/analytics/bundleAnalytics.routes.js"


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

app.use('/api/v1/util', utilRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/ideas', ideaRoutes);
app.use('/api/v1/subcategories', subCategoryRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/support-tickets', ticketRoutes)
app.use('/api/v1/gallery', galleryRoutes)
app.use('/api/v1/packages', packageRoutes)
app.use('/api/v1/bundles', bundleRoutes)
app.use("/api/v1/banners", bannerRoutes)
app.use("/api/v1/brand-details", brandDetailRoutes);
app.use("/api/v1/referrals", referralRoutes);

app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/admin/analytics', bundleStatsRoute)


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