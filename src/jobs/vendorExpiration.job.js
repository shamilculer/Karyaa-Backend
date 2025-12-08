import Vendor from '../models/Vendor.model.js';

/**
 * Cron Job: Expire vendors whose subscription end date has passed
 * Runs daily at 12:00 PM
 */
export async function expireVendors() {
    try {
        const now = new Date();

        // Find approved vendors whose subscriptionEndDate has passed
        const result = await Vendor.updateMany(
            {
                vendorStatus: 'approved',
                subscriptionEndDate: { $lt: now, $ne: null }
            },
            {
                $set: { vendorStatus: 'expired' }
            }
        );

        console.log(`[CRON] Vendor Expiration Job - ${new Date().toISOString()}`);
        console.log(`[CRON] Expired ${result.modifiedCount} vendor(s)`);

        return {
            success: true,
            expiredCount: result.modifiedCount,
            timestamp: now
        };
    } catch (error) {
        console.error('[CRON] Error in vendor expiration job:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date()
        };
    }
}
