const mongoose = require('mongoose');
/**
 * User Schema Definition
 * Defines the structure and validation for user documents
 */
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    profilePicture: {
      type: String, // Store the file path of the image
      default: 'default-profile.png', // Default image in case no picture is uploaded
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    address1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
    },
    address2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate email uniqueness
userSchema.path('email').validate(async function (value) {
  const count = await this.model('User').countDocuments({
    email: value,
    _id: { $ne: this._id },
  });
  return count === 0;
}, 'Email is already registered');

module.exports = mongoose.model('User', userSchema);
