import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

import utilRoutes from './routes/shared/utils.routes.js';
import userRoutes from './routes/user.routes.js';
import blogRoutes from "./routes/public/blog.routes.js"
import ideaRoutes from "./routes/public/idea.routes.js"
import subCategoryRoutes from "./routes/public/subcategory.routes.js"
import categoryRoutes from "./routes/public/category.routes.js"
import vendorRoutes from "./routes/vendor.routes.js"
import reviewRoutes from "./routes/shared/reviews.routes.js"
import leadRoutes from "./routes/vendor/leads.routes.js"
import ticketRoutes from "./routes/vendor/tickets.routes.js"
import galleryRoutes from "./routes/vendor/gallery.routes.js"
import packageRoutes from "./routes/vendor/packages.routes.js"
import adminRoutes from "./routes/admin/admin.routes.js"
import bundleRoutes from "./routes/admin/bundles.routes.js"
import bannerRoutes from "./routes/admin/banners.routes.js"
import brandDetailRoutes from "./routes/shared/brandDetails.routes.js"
import referralRoutes from "./routes/user/referral.routes.js"
import contentRoutes from "./routes/public/pages.routes.js"
import analyticsRoutes from "./routes/vendor/analytics.routes.js"
import seoRoutes from "./routes/admin/seo.routes.js"



import bundleStatsRoute from "./routes/admin/analytics/bundleAnalytics.routes.js"
import platformAnalyticsRoute from "./routes/admin/analytics/platformAnalytics.routes.js"
import revenueAnalyticsRoute from "./routes/admin/analytics/revenueAnalytics.routes.js"
import dashboardRoute from "./routes/admin/dashboard.routes.js"


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
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
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);


app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/admin/analytics/bundles', bundleStatsRoute)
app.use('/api/v1/admin/analytics/platform', platformAnalyticsRoute)
app.use('/api/v1/admin/analytics/revenue', revenueAnalyticsRoute)
app.use('/api/v1/admin/dashboard', dashboardRoute)
app.use('/api/v1/admin/seo', seoRoutes)


const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }

};

startServer();