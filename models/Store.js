const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const slug = require('slugs')

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates' 
    }],
    address: {
      type: String,
      required: 'You must supply an address'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Define our indexes
storeSchema.index({
  name: 'text',
  description: 'text'
})

storeSchema.index({ location: '2dsphere' })

storeSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    this.slug = slug(this.name)
    // Find other stores that have a slug of foo, foo-1, foo-2, etc
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?)$`, 'i')
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx })
    if (storesWithSlug.length) {
      this.slug = `${this.slug}-${storesWithSlug.length}`
    }
  }

  next()
})

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
}

// Find reviews where the store's _id property === review's store property
storeSchema.virtual('reviews', {
  ref: 'Review', // What model to link?
  localField: '_id', // Which field on the store?
  foreignField: 'store' // Which field on the review?
})

module.exports = mongoose.model('Store', storeSchema)