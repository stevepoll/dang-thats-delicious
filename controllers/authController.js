const passport = require('passport')

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