import Vendor from '../models/Vendor.model.js';
import { sendEmail, prepareVendorData } from '../services/email.service.js';

/**
 * Cron Job: Handle vendor subscription expirations and warnings
 * Runs daily at 12:00 PM
 * 
 * Logic:
 * 1. Identify vendors expiring in 30 days, 7 days, and 2 days -> Send Warning Emails
 * 2. Identify vendors expiring today (or already expired but active) -> Send Expiration Email & Update Status
 */
export async function expireVendors() {
    try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const results = {
            warningsSent: 0,
            expiredCount: 0,
            errors: []
        };

        console.log(`[CRON] Starting Subscription Check Job - ${now.toISOString()}`);

        // --- 1. SEND WARNING NOTIFICATIONS (30, 7, 2 Days Before) ---
        const warningDays = [30, 7, 2];

        for (const days of warningDays) {
            // Calculate target date range (start and end of that specific day)
            const targetDateStart = new Date(todayStart);
            targetDateStart.setDate(todayStart.getDate() + days);

            const targetDateEnd = new Date(targetDateStart);
            targetDateEnd.setHours(23, 59, 59, 999);

            try {
                // Find active vendors expiring on this specific day
                const vendors = await Vendor.find({
                    vendorStatus: 'approved',
                    subscriptionEndDate: {
                        $gte: targetDateStart,
                        $lte: targetDateEnd
                    }
                }).populate('selectedBundle');

                if (vendors.length > 0) {
                    console.log(`[CRON] Found ${vendors.length} vendors expiring in ${days} days.`);

                    for (const vendor of vendors) {
                        const emailData = {
                            ...prepareVendorData(vendor),
                            daysRemaining: days,
                            bundleName: vendor.selectedBundle?.name,
                            bundlePrice: vendor.selectedBundle?.price,
                            renewalUrl: `${process.env.FRONTEND_URL}/vendor/dashboard/subscription`
                        };

                        // Send Vendor Warning
                        await sendEmail({
                            to: vendor.email,
                            template: 'vendor-subscription-warning',
                            data: emailData
                        });

                        // Send Admin Aler (only for 2 days remaining to avoid spam)
                        if (days === 2) {
                            await sendEmail({
                                template: 'admin-subscription-warning',
                                data: emailData
                            });
                        }

                        results.warningsSent++;
                    }
                }
            } catch (err) {
                console.error(`[CRON] Error processing ${days}-day warnings:`, err);
                results.errors.push(`${days}-day warning error: ${err.message}`);
            }
        }

        // --- 2. HANDLE EXPIRED SUBSCRIPTIONS (Today or Past) ---
        // Find approved vendors whose subscriptionEndDate is BEFORE now
        const expiredVendors = await Vendor.find({
            vendorStatus: 'approved',
            subscriptionEndDate: { $lt: now, $ne: null }
        }).populate('selectedBundle');

        if (expiredVendors.length > 0) {
            console.log(`[CRON] Found ${expiredVendors.length} vendors to expire.`);

            for (const vendor of expiredVendors) {
                try {
                    // Update status to expired
                    vendor.vendorStatus = 'expired';
                    await vendor.save(); // Triggers post-save hooks if any

                    const emailData = {
                        ...prepareVendorData(vendor),
                        bundleName: vendor.selectedBundle?.name,
                        renewalUrl: `${process.env.FRONTEND_URL}/vendor/dashboard/subscription`
                    };

                    // Send Vendor Expiration Email
                    await sendEmail({
                        to: vendor.email,
                        template: 'vendor-expired',
                        data: emailData
                    });

                    results.expiredCount++;

                } catch (err) {
                    console.error(`[CRON] Failed to expire vendor ${vendor._id}:`, err);
                    results.errors.push(`Expire error for ${vendor._id}: ${err.message}`);
                }
            }
        }

        console.log(`[CRON] Job Completed. Sent ${results.warningsSent} warnings. Expired ${results.expiredCount} vendors.`);

        return {
            success: true,
            ...results,
            timestamp: new Date()
        };

    } catch (error) {
        console.error('[CRON] Critical error in subscription job:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date()
        };
    }
}
