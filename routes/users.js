var express = require('express');
const tools = require("../util/utils");
var router = express.Router();
const img = require("../util/img_control");

/* GET users listing. */


router.post('/login', (req, res)=>{
  if(req.cookies.captcha){
    if((req.body.captcha).toLowerCase() !== req.cookies.captcha){
      res.send({
        error_code:'B03',
        msg:'您的验证码输入错误'
      })
    }else{
      tools.login(req,res)
    }
  }


})
router.post('/captcha',(req, res)=>{
  tools.captcha(req,res);
})


router.post('/register', (req, res)=>{
  if(req.cookies.captcha){
    if((req.body.captcha).toLowerCase() !== req.cookies.captcha){
      res.send({
        error_code:'B03',
        msg:'您的验证码输入错误'
      })
    }else{
      tools.register(req,res);
    }
  }

});

// router.post('/jwt_check',(req,res)=>{
//   jwt.jwt_check(req,res)
// })

router.get('/get_user_info',(req,res)=>{
  if(req.auth) {
    res.send({
      error_code: '0',
      info: req.auth
    });
  }else{
    res.send({
      error_code: 'C03',
      msg:'您的登录已过期，请重新登录'
    })
  }
})

router.post('/load_model',(req, res)=>{
  img.load_model(req,res).then();
})

module.exports = router;
