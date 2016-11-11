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

  cases: [
    {
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
    }
  ],
  assets: [
    {
      dnaCode: {
        type: 'String',
        required: true
      },
      assetCode: {
        type: String,
        required: true
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
      }
    }
  ]
});
userSchema.plugin(uniqueValidator);

export default mongoose.model('User', userSchema);
