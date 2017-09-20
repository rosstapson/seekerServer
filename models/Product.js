import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const productSchema = new Schema({

    productName: {
        type: 'String'
    },
    dnaCode: { // this is the dna Pin
      type: 'String',
      required: [
            true, "DNA pin required"
        ],
        unique: [true, "DNA pin is not available"]
    },
    status: { // options are 'unallocated', 'allocated', 'sold'
        type: 'String'
    },
    allocatedTo: {
        type: 'String'
    },
    addedBy: {
        type: 'String'
    },
    // User descriptor is not required, but could be handy - once allocated to a user,
    // it could be a descriptive name, but preferably username or email.
    userDescriptor: {
      type: 'String'
    }
    
});
productSchema.plugin(uniqueValidator);

export default mongoose.model('Product', productSchema);