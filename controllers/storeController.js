exports.homePage = (req, res) => {
  res.render('index', { title: 'Home' })
}

exports.addStore = (req, res) => {
  res.render('addEditStore', { title: 'Add store' })
}

exports.createStore = (req, res) => {
  res.json(req.body)
}
