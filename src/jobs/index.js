import cron from 'node-cron';
import { expireVendors } from './vendorExpiration.job.js';
import { deactivateBanners } from './bannerDeactivation.job.js';

/**
 * Initialize all cron jobs
 * Both jobs run daily at 12:00 PM (noon)
 */
export function initializeCronJobs() {
    // Cron expression: '0 12 * * *' means:
    // - 0: minute 0
    // - 12: hour 12 (12 PM)
    // - *: every day of month
    // - *: every month
    // - *: every day of week

    // Job 1: Expire vendors at 12:00 PM daily
    cron.schedule('0 12 * * *', async () => {
        console.log('\n[CRON] Running scheduled vendor expiration job...');
        await expireVendors();
    }, {
        timezone: "Asia/Dubai" // Adjust timezone as needed
    });

    // Job 2: Deactivate banners at 12:00 PM daily
    cron.schedule('0 12 * * *', async () => {
        console.log('\n[CRON] Running scheduled banner deactivation job...');
        await deactivateBanners();
    }, {
        timezone: "Asia/Dubai" // Adjust timezone as needed
    });

    console.log('[CRON] Cron jobs initialized successfully');
    console.log('[CRON] - Vendor expiration: Daily at 12:00 PM');
    console.log('[CRON] - Banner deactivation: Daily at 12:00 PM');
}

// Export individual jobs for manual testing
export { expireVendors, deactivateBanners };
