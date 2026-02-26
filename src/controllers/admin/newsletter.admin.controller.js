import NewsletterSubscriber from "../../models/NewsletterSubscriber.model.js";
import ExcelJS from "exceljs";

// Get all newsletter subscribers (Paginated)
export const getAllSubscribers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const search = req.query.search || "";

        const matchQuery = {};
        if (search) {
            const searchRegex = new RegExp(search, "i");
            matchQuery.$or = [
                { email: searchRegex },
                { name: searchRegex }
            ];
        }

        const skip = (page - 1) * limit;

        const subscribers = await NewsletterSubscriber.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await NewsletterSubscriber.countDocuments(matchQuery);

        res.status(200).json({
            success: true,
            data: subscribers,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            },
            message: "Newsletter subscribers fetched successfully."
        });
    } catch (error) {
        console.error("Error fetching newsletter subscribers:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching subscribers."
        });
    }
};

// Export newsletter subscribers to Excel
export const exportSubscribersToExcel = async (req, res) => {
    try {
        const search = req.query.search || "";

        const matchQuery = {};
        if (search) {
            const searchRegex = new RegExp(search, "i");
            matchQuery.$or = [
                { email: searchRegex },
                { name: searchRegex }
            ];
        }

        // Fetch all matching subscribers without pagination
        const subscribers = await NewsletterSubscriber.find(matchQuery)
            .sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Karyaa Admin';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Newsletter Subscribers', {
            views: [{ state: 'frozen', ySplit: 1 }]
        });

        worksheet.columns = [
            { header: 'Email Address', key: 'email', width: 35 },
            { header: 'Name', key: 'name', width: 30 },
            { header: 'Subscribed Date', key: 'subscribedAt', width: 25 },
        ];

        // Style the header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Indigo color
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Date formatter
        const formatDate = (date) => {
            if (!date) return 'N/A';
            const d = new Date(date);
            // Format to match vendor export (e.g. DD/MM/YYYY)
            return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-GB');
        };

        // Add rows
        subscribers.forEach((sub) => {
            worksheet.addRow({
                email: sub.email || "N/A",
                name: sub.name || "N/A",
                subscribedAt: formatDate(sub.createdAt),
            });
        });

        // Set response headers and send workbook
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=newsletter_subscribers_${new Date().getTime()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error exporting newsletter subscribers:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while exporting subscribers."
        });
    }
};
