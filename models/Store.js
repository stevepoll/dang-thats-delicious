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
  photo: String
})

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

storeSchema.statics.getStoresByTag = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
}

module.exports = mongoose.model('Store', storeSchema)