const scrypt = require('./scrypt')
const {jwt_sign} = require('./jwt')
const svg_captcha = require('svg-captcha')
const mysql = require("mysql");

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'user_info'
})

db.query('select * from user_info',(err, result)=>{
    console.log(result)
})

const sql_select_email = 'select * from user_info where email=?';
const sql_select_name = 'select * from user_info where name=?';
const sql_insert = 'insert into user_info set ?';

exports.login = (req, res) => {
    const user_info = req.body;
    db.query(sql_select_email, user_info.email, (err1, result1) => {
        db.query(sql_select_name, user_info.name, (err2, result2) => {
            let result;
            if (err1 || result1.length !== 1) {
                if (err2 || result2.length !== 1) {
                    res.send({
                        error_code: 'B01',
                        msg: '您尚未注册，或输入的邮箱/用户名有误'
                    })
                    console.log(result2.err);
                    return;
                } else {
                    result = result2[0];
                }
            } else {
                result = result1[0]
            }

            scrypt.decipher(result.password, (pw) => {
                if (pw === user_info.password) {
                    const token = jwt_sign({
                        username:result.name
                    })
                    res.send({
                        error_code: '0',
                        data: {
                            token: token
                        },
                        msg: '登录成功'
                    })
                } else {
                    res.send({
                        error_code: 'B02',
                        msg: '您输入的密码有误'
                    })
                }
            })
        })
    })
}

exports.register = (req, res) => {
    const user_info = req.body;

    db.query(sql_select_email, user_info.email, (err1, result1) => {
        db.query(sql_select_name, user_info.name, (err2, result2) => {
            if (err1||err2) {
                res.send({
                    error_code: 'A00',
                    msg: '注册失败，请重试'
                })
                return;
            }
            if (result1.length > 0) {
                res.send({
                    error_code: 'A01',
                    msg: '您已注册，请选择登录'
                })
                return;
            }else if(result2.length>0){
                res.send({
                    error_code: 'A02',
                    msg: '用户名重复'
                })
                return;
            }
            scrypt.encipher(user_info.password, (scrypt_str) => {
                db.query(sql_insert, {
                    email: user_info.email,
                    name:  user_info.name,
                    password: scrypt_str,
                    //wait to add
                }, (err, result) => {
                    if (err) {
                        res.send({
                            error_code: 'A00',
                            msg: '注册失败，请重试'
                        })
                    } else if (result.affectedRows !== 1) {
                        res.send({
                            error_code: 'A00',
                            msg: '注册失败，请重试'
                        })
                        console.log('add to db err: ' + err);
                    } else {
                        res.send({
                            error_code: '0',
                            msg: '注册成功'
                        })
                    }
                })
            })
        })
    })
}
exports.captcha = (req, res) => {
    const config = {
        size: 4,
        ignoreChars: 'Oo01ilI',
        noise: 3,
        width: 100,
        height: 26,
        fontSize: 25,
        background: '#eee'
    };
    const captcha = svg_captcha.create(config);
    res.cookie('captcha',captcha.text.toLowerCase());
    res.send({
        error_code: '0',
        msg: '验证码已生成',
        data: {
            svg: captcha.data
        }
    })
}
