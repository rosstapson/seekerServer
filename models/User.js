import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const userSchema = new Schema({

    username: {
        type: 'String',
        required: [
            true, "Username required"
        ],
        unique: [true, "Username is not available"]
    },
    email: {
        type: 'String',
        required: true
    },
    password: {
        type: 'String',
        required: true
    },
    isVerified: {
        type: 'Boolean',
        default: false
    },
    accessLevel: {
        type: 'Number',
        required: true
    },

    companyName: {
        type: 'String',
        required: false
    },
    telephone: {
        type: 'String',
        required: false
    },
    contactPerson: {
        type: 'String',
        required: false
    },
    mobile: {
        type: 'String',
        required: false
    },

    address: {
        line1: {
            type: 'String',
            required: false
        },
        line2: {
            type: 'String',
            required: false
        },
        line3: {
            type: 'String',
            required: false
        },
        state: {
            type: 'String',
            required: false
        },
        country: {
            type: 'String',
            required: false
        }
    },

    fax: {
        type: 'String',
        required: false
    },

    slug: {
        type: 'String',
        required: true
    },
    cuid: {
        type: 'String',
        required: true,
        unique: true
    },
    dateAdded: {
        type: 'Date',
        default: Date.now,
        required: true
    },
    dateUpdated: {
        type: 'Date',
        default: Date.now,
        required: true
    },

    cases: [{
        caseNumber: {
            type: 'String',
            required: true
        },
        assetId: {
            type: 'String',
            required: true
        },
        dateReported: {
            type: 'Date',
            default: Date.now,
            required: true
        },
        reportedAtPoliceStation: {
            type: 'String',
            required: true
        }
    }],
    assets: [{
        dnaCode: {
            type: 'String',
            required: true
        },
        assetCode: {
            type: String,
            required: true
        },
        itemCode: {
            type: String,
            required: false
        },
        images: [{
            url: {
                type: String,
                required: false
            },
            dateUploaded: {
                type: 'Date',
                default: Date.now
            },
            imageDescription: {
                type: String,
                required: false
            }
        }],
        location: {
            type: String,
            required: false
        },
        unitOfMeasure: {
            type: String,
            required: false
        },
        audited: {
            type: String,
            required: false
        },
        status: {
            type: String,
            required: false
        },
        pendingTransfer: {
            type: 'Boolean',
            default: false
        },
        pendingTransferToUser: {
            type: String,
            required: false
        },
        dateTransferred: {
            type: 'Date',
            default: Date.now,
            required: false
        },
        transferredToUser: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        dateAdded: {
            type: 'Date',
            default: Date.now,
            required: true
        },
        dateUpdated: {
            type: 'Date',
            default: Date.now,
            required: true
        },
        capturedOrModifiedBy: {
            type: String,
            required: false
        },
        dateReported: {
            type: 'Date',
            required: false
        },
        caseNumber: {
            type: String,
            required: false
        },
        atPoliceStation: {
            type: String,
            required: false
        },
        nextAuditDate: {
            type: Date,
            required: false
        },
        appliedBy: {
            type: String,
            required: false
        },
        checkedBy: {
            type: String,
            required: false
        },
    }]
});
userSchema.plugin(uniqueValidator);

export default mongoose.model('User', userSchema);