const crypto = require('crypto')

let algorithm = 'aes-128-cbc';
let encipher = function (password,callback){
    let key = crypto.randomBytes(16).toString('hex');
    let salt = crypto.randomBytes(16).toString('hex');
    let iv = Buffer.alloc(16,0);

    crypto.scrypt(key, salt,16,(err, derivedKey)=>{
        if(err) {
            console.log(err);
        }
        let cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
        let cipher_text = cipher.update(password, 'utf8','hex');

        /* 加入信息 */
        cipher_text+=cipher.final('hex');
        cipher_text+=(key+salt+iv);

        callback(cipher_text)
    })
}
let decipher =  function (scrypt_str, callback){
    let iv = scrypt_str.slice(-16);
    let salt = scrypt_str.slice(-48, -16);
    let key = scrypt_str.slice(-80, -48);
    let info = scrypt_str.slice(0, -80);

    crypto.scrypt(key, salt, 16,(err, derivedKey)=>{
        if(err){
            console.log(err);
        }else{
            let decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
            let data = decipher.update(info, 'hex', 'utf8');
            data +=decipher.final('utf8');
            callback(data);
        }
    })
}

module.exports={
    encipher,
    decipher
};