import express from 'express';
import { expireVendors, deactivateBanners } from '../../jobs/index.js';

const router = express.Router();

/**
 * Test route to manually trigger vendor expiration job
 * GET /api/v1/test/cron/expire-vendors
 */
router.get('/expire-vendors', async (req, res) => {
    try {
        const result = await expireVendors();
        res.json({
            message: 'Vendor expiration job executed',
            ...result
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error executing vendor expiration job',
            error: error.message
        });
    }
});

/**
 * Test route to manually trigger banner deactivation job
 * GET /api/v1/test/cron/deactivate-banners
 */
router.get('/deactivate-banners', async (req, res) => {
    try {
        const result = await deactivateBanners();
        res.json({
            message: 'Banner deactivation job executed',
            ...result
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error executing banner deactivation job',
            error: error.message
        });
    }
});

/**
 * Test route to run both jobs
 * GET /api/v1/test/cron/run-all
 */
router.get('/run-all', async (req, res) => {
    try {
        const vendorResult = await expireVendors();
        const bannerResult = await deactivateBanners();

        res.json({
            message: 'All cron jobs executed',
            vendors: vendorResult,
            banners: bannerResult
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error executing cron jobs',
            error: error.message
        });
    }
});

export default router;
