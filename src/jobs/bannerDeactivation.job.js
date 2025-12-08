import AdBanner from '../models/AdBanner.model.js';

/**
 * Cron Job: Deactivate ad banners whose activeUntil date has passed
 * Runs daily at 12:00 PM
 */
export async function deactivateBanners() {
    try {
        const now = new Date();

        // Find active banners whose activeUntil date has passed
        const result = await AdBanner.updateMany(
            {
                status: 'Active',
                activeUntil: { $lt: now, $ne: null }
            },
            {
                $set: { status: 'Inactive' }
            }
        );

        console.log(`[CRON] Banner Deactivation Job - ${new Date().toISOString()}`);
        console.log(`[CRON] Deactivated ${result.modifiedCount} banner(s)`);

        return {
            success: true,
            deactivatedCount: result.modifiedCount,
            timestamp: now
        };
    } catch (error) {
        console.error('[CRON] Error in banner deactivation job:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date()
        };
    }
}
