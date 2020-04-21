const mongoose = require('mongoose')
const Store = mongoose.model('Store')
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
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug })
  if (!store) return next()
  
  res.render('store', { title: store.name, store })
}

exports.getStores = async (req, res) => {
  const stores = await Store.find()
  res.render('stores', { "title": "All stores", stores })
}

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  // res.json(req.params.id)
  const store = await Store.findOne({ _id: req.params.id })
  
  // 2. Confirm they are the owner of the store
  // TODO Implment login/logout
  
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