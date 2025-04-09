const db = require('./mysql');
const jwt = require('jsonwebtoken');
const { config } = require('./config');
const logger = require('./log');

module.exports.Authen = async (Username, Password) => {

    let User, UserInfo, Access;

    let query = `select * from ee_users where username='${Username}' and upassword=md5('${Password}')`;
    User = await db.ExecQuery(query);

    if (User.length > 0) {
        query = `select * from vw_staffs where staff_id='${User[0].staff_id}'`;
        UserInfo = await db.ExecQuery(query);
        if (UserInfo) {
            query = `select module, access from ee_access where staff_id='${User[0].staff_id}'`
            Access = await db.ExecQuery(query);

            const result = { Token: GenToken(Username, User[0].staff_id), UserInfo: UserInfo[0], Access: Access }

            return result;
        }
    }
    else{
        return 'user or password incorrect!';
    }
}

const GenToken = (user, id) => {
    const accessToken = jwt.sign(
        {
            UserName: user,
            _id: id
        },
        config.Token.Secret,
        {
            expiresIn: config.Token.Period, algorithm: "HS256"
        }
    )

    return accessToken;
}

module.exports.ValidateToken = (token) => {
    let res;
    jwt.verify(token, config.Token.Secret, (err, decode) => {
        if (!err) {
            res = true;
        }
        else {
            res = false;
        }
    });

    return res;
}