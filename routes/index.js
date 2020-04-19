const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const phil = {name: 'Phil', age: 33, cool: true}
  
  // res.send('Hey! It works!');
  // res.json(phil)
  // res.send(req.query.name)
  // res.json(req.query)

  res.render('hello', {
    name: 'Boo',
    dog: 'Snickers',
    title: 'I love food'
  })
});

router.get('/reverse/:name', (req, res) => {
  const rev = [...req.params.name].reverse().join('')
  res.send(rev)
})

module.exports = router;
