import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const productSchema = new Schema({

    dnaCode: {
        type: 'String',
        required: [
            true, "DNA code required"
        ],
        unique: [true, "DNA code is not available"]
    },
    dnaPin: {
      type: 'String',
      required: [
            true, "DNA pin required"
        ],
        unique: [true, "DNA pin is not available"]
    },

    // User descriptor is not required, but could be handy - once allocated to a user,
    // it could be a descriptive name, but preferably username or email.
    userDescriptor: {
      type: 'String'
    }
    
});
productSchema.plugin(uniqueValidator);

export default mongoose.model('Product', productSchema);