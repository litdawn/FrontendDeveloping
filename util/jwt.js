const jwt = require('jsonwebtoken');
const express_jwt = require('express-jwt')

const secret_key = 'nodejs is too difficult QAQ';
const expiresTime = 10*60*60;

let jwt_sign = function (data){
    return jwt.sign(data, secret_key, {expiresIn: expiresTime});
}

let jwt_check = function (req, res, next){
    const token = req.headers.authorization.slice(6);
    jwt.verify(token, secret_key,{expiresIn: expiresTime},(err, data)=>{
        if(err){
            res.send({
                error_code: 'C01',
                msg:'token失效'
            })
        }else{
            req.jwt = data;
            next();
        }
    })
}

module.exports = {
    jwt_check,
    jwt_sign,
    secret_key
}