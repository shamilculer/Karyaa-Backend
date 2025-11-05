import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: [true, 'A subject is required.'],
        trim: true,
        minlength: [5, 'Subject must be at least 5 characters long.']
    },

    category: {
        type: String,
        enum: ['Leads', 'profile', 'technical', 'content', 'other'],
        required: [true, 'A category is required.']
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        required: [true, 'A priority level is required.']
    },
    
    description: {
        type: String,
        required: [true, 'A detailed description is required.'],
        minlength: [20, 'Description must be at least 20 characters long.']
    },

    contactEmail: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                // Allows empty string but checks format if value is present
                if (v === '') return true; 
                return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: false, // Set to true if submission requires authentication
    },

    // Status tracking for the support team
    status: {
        type: String,
        enum: ['open', 'in-progress', 'pending', 'closed'],
        default: 'open'
    },

    // Timestamps for tracking
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
ticketSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Ticket = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);

export default Ticket;