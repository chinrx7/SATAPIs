const { compareSync } = require('bcrypt');
const { config } = require('./config');
const db = require('mysql');

module.exports.ExecQuery = async (cmd) => {

    let res;

    const con = db.createConnection({
        host: config.MYSQL.host,
        user: config.MYSQL.user,
        password: config.MYSQL.password,
        database: config.MYSQL.database
    })

    con.connect();


    const promise = await new Promise((resolve, reject) => {
        con.query(cmd, (err, result) => {
            if(err) throw err;
            //console.log(result)
            resolve(result);
        });
    })

    con.end();

    res = JSON.parse(JSON.stringify(promise));

    //console.log(res[0].cnt)

    return res;
}