const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const User = mongoose.model('User')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    if (isPhoto) {
      next(null, true)
    } else {
      next({ message: 'That filetype is not supported'}, false)
    }
  }
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => {
  // Check if there is a new file to resize
  if (req.file) {
    const extension = req.file.mimetype.split('/')[1]
    req.body.photo = uuid.v4() + '.' + extension
    // Now we resize
    const photo = await jimp.read(req.file.buffer)
    await photo.resize(800, jimp.AUTO)
    await photo.write(`./public/uploads/${req.body.photo}`)
  }
  
  // Whether or not we have written the photo to our filesystem, keep going
  next()
}

exports.homePage = (req, res) => {
  res.render('index', { title: 'Home' })
}

exports.addStore = (req, res) => {
  res.render('addEditStore', { title: 'Add store' })
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store
    .findOne({ slug: req.params.slug })
    .populate('author reviews')
  if (!store) return next()

  res.render('store', { title: store.name, store })
}

exports.getStores = async (req, res) => {
  const page = req.params.page || 1
  const limit = 4
  const skip = (page * limit) - limit

  // Query the database for stores
  const storesPromise = await Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' })

  const countPromise = Store.count()
  const [stores, count] = await Promise.all([storesPromise, countPromise])

  // User Math.ceil: If we have 17 stores and 4 per page, we will need 5 pages
  const pages = Math.ceil(count / limit)

  // Guard against users entering invalid page number in URL
  // if (!stores.length && skip) {
  if(page > pages) {
    req.flash('info', `You asked for page ${page}, but that doesn't exist. Redirecting to last page.`)
    res.redirect(`/stores/page/${pages}`)
    return
  }

  res.render('stores', { "title": "All stores", stores, page, pages, count })
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it')
  }
}

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  // res.json(req.params.id)
  const store = await Store.findOne({ _id: req.params.id })
  
  // 2. Confirm they are the owner of the store
  confirmOwner(store, req.user)
  
  // 3. Render the edit form so that the user can update their store
  res.render('addEditStore', { title: 'Edit store', store })
}

exports.updateStore = async (req, res) => {
  // 0. Set location to be a point
  req.body.location.type = 'Point'
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate(
    { _id: req.params.id }, 
    req.body, 
    { new: true, runValidators: true }).exec()

  req.flash('success', `Successfully updated ${store.name}. <a href="/stores/${store.slug}">View Store</a>`)

  // 2. Redirect user to the store and tell them it worked
  res.redirect(`/stores/${store._id}/edit`)
}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag
  const tagQuery = tag || { $exists: true }
  const tagsPromise = Store.getTagsList()
  const storesPromise = Store.find({ tags: tagQuery })

  const [tags, stores] = await Promise.all([tagsPromise, storesPromise])
  
  res.render('tag', { tags, stores, tag, title: 'Tags' })
}

exports.getHeartedStores = async (req, res) => {
  const stores = await Store.find({ _id: { $in: req.user.hearts } })
  res.render('stores', { title: 'Favorite Stores', stores })
}

exports.searchStores = async (req, res) => {
  const stores = await Store
  .find(
    { $text: { $search: req.query.q } }, 
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(5)

  res.json(stores)
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat)
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10 km
      }
    }
  }

  const stores = await Store.find(q)
    .select('slug name description location photo')
    .limit(10)
  res.json(stores)
}

exports.mapPage = async (req, res) => {
  res.render('map', { title: 'Map' })
}

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString())
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'
  const user = await User.findByIdAndUpdate(
    req.user._id, 
    { [operator]: { hearts: req.params.id } },
    { new: true }
  )
  res.json(user)
}

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores()
  res.render('topStores', { stores, title: `Top ${stores.length} Stores` })
}