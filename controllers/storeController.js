const mongoose = require('mongoose')
const Store = mongoose.model('Store')

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
