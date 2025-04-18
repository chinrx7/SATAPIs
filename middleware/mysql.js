const { compareSync } = require('bcrypt');
const { config } = require('./config');
const db = require('mysql');
const logger = require('./log');

module.exports.ExecQuery = async (cmd) => {

    let res;

    try {
        const con = db.createConnection({
            host: config.MYSQL.host,
            user: config.MYSQL.user,
            password: config.MYSQL.password,
            database: config.MYSQL.database
        })

        con.connect();


        const promise = await new Promise((resolve, reject) => {
            con.query(cmd, (err, result) => {
                if (err) throw err;
                resolve(result);
            });
        })

        con.end();

        res = JSON.parse(JSON.stringify(promise));
    }
    catch (err) {
        logger.loginfo(`MySQL error : ${err}`);
    }
    return res;
}