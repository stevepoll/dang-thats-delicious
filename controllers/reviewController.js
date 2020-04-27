const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const Review = mongoose.model('Review')

exports.addReview = async (req, res) => {
  req.body.author = req.user._id
  req.body.store = req.params.id

  const newReview = new Review(req.body)
  await newReview.save()
  req.flash('success', 'Successfully saved review')
  res.redirect('back')
}