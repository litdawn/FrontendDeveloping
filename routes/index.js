var express = require('express');
var router = express.Router();

/* GET home page. */

router.get('/', function (req, res) {
  res.render('login');

})
router.get('/mainpage.html', function (req, res) {
  res.render('mainpage');
})
router.get('/register.html', function (req, res) {
  res.render('register')
})
router.get('/detail_picture_page/detail_picture_1.html', function (req, res) {
  res.render('detail_picture_page/detail_picture_1.html');
})
router.get('/detail_picture_page/detail_picture_2.html', function (req, res) {
  res.render('detail_picture_page/detail_picture_2.html');
})
router.get('/detail_picture_page/detail_picture_3.html', function (req, res) {
  res.render('detail_picture_page/detail_picture_3.html');
})
router.get('/style_transfer.html', function (req, res) {
  res.render('style_transfer');
})
module.exports = router;
