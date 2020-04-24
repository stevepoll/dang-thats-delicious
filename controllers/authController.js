const passport = require('passport')
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')
const mail = require('../handlers/mail')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed login',
  successRedirect: '/' ,
  successFlash: 'You are now logged in'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'You are now logged out. 👋')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  // first check if usesr is authenticated
  if (!req.isAuthenticated()) {
    req.flash('error', 'You must be logged in to do that')
    res.redirect('/login')
  } else {
    next()
  }
}

exports.forgot = async (req, res) => {
  // 1. See if a user with that email exists
  const user = await User.findOne({ email: req.body.email_forgot })
  if (!user) {
    req.flash('error', 'No account with that email exists')
    return res.redirect('/login')
  }

  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + 3600000 // 1 hour from now
  await user.save()

  // 3. Send them an email with the token
  const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  await mail.send({
    user,
    filename: 'password-reset',
    subject: 'Password Reset',
    resetUrl
  })

  req.flash('success', `You have been sent a password reset link.`)
  // 4. Redirect to login page
  res.redirect('/login')
}

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired')
    res.redirect('/login')
  }
  // If there is a user, show the reset password form
  res.render('reset', { title: 'Reset your password' })
}

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password !== req.body['password-confirm']) {
    req.flash('error', 'Passwords do not match')
    res.redirect('back')
  } else {
    next()
  }
}

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    req.flash('error', 'Password reset is invalid or has expired')
    res.redirect('/login')
  }

  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)

  // Clear out token and expiry
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined

  // Update user in database and log them in
  const updatedUser = await user.save()
  await req.login(updatedUser)
  req.flash('success', 'Your password has been reset and you are now logged in')
  res.redirect('/')
}