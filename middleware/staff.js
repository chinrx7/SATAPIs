const db = require('./mysql');
const logger = require('./log');
const crypto = require('crypto');

module.exports.AddStaff = async (Staff) => {
    let res;
    try {
        let query = `SELECT ID FROM ee_staffs WHERE Fname='${Staff.FirstName}' AND Lname='${Staff.SurName}'`;

        const exist = await db.ExecQuery(query);

        const hexID = crypto.randomBytes(16).toString('hex');

        if (exist.length === 0) {
            query = `INSERT INTO ee_staffs (staff_id, Fname, Lname, Department, Position) VALUES ('${hexID}', '${Staff.FirstName}', '${Staff.SurName}', 
            '${Staff.Department}', '${Staff.Position}')`;

            await db.ExecQuery(query);

            query = `INSERT INTO ee_users (staff_id, username, upassword) VALUES ('${hexID}', '${Staff.uname}', 
            MD5('${Staff.password}'))`;

            await db.ExecQuery(query);

            for await(const a of Staff.access){
                query = `INSERT INTO ee_access (staff_id, module, access) VALUES ('${hexID}', '${a.module}', '${a.access}')`;
                await db.ExecQuery(query);
            }

            res = 'ok'
        }
        else{
            res = 'Staff is duplicated'
        }


    }
    catch (err) {
        logger.loginfo(`Add Staff error : ${err}`);
        res = 'error';
    }

    return res;
}