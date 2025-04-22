const db = require('./mysql');
const logger = require('./log');
const crypto = require('crypto');
const { el } = require('date-fns/locale');

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

            for await (const a of Staff.access) {
                query = `INSERT INTO ee_access (staff_id, module, access) VALUES ('${hexID}', '${a.module}', '${a.access}')`;
                await db.ExecQuery(query);
            }

            res = 'ok'
        }
        else {
            res = 'Staff is duplicated'
        }


    }
    catch (err) {
        logger.loginfo(`Add Staff error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.EditStaff = async (Staff) => {
    let res;
    try {
        let query = `UPDATE ee_staffs SET Fname='${Staff.FirstName}', Lname='${Staff.SurName}', Department='${Staff.Department}',
         Position='${Staff.Position}' WHERE staff_id='${Staff.staff_id}'`;

        await db.ExecQuery(query);

        for await (const a of Staff.access) {
            query = `SELECT ID FROM ee_access WHERE staff_id='${Staff.staff_id}' AND module='${a.module}'`;

            const exist = await db.ExecQuery(query);

            if (exist.length > 0) {
                query = `UPDATE ee_access SET access='${a.access}' WHERE staff_id='${Staff.staff_id}' AND module='${a.module}'`;

                await db.ExecQuery(query);
            }
            else {
                query = `INSERT INTO ee_access (staff_id, module, access) VALUES ('${Staff.staff_id}', '${a.module}', '${a.access}')`;

                await db.ExecQuery(query);
            }
        }

        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Update user error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.getlist = async () => {
    let res;
    try {
        let query = `SELECT * FROM vw_staffs`;
        const staffs = await db.ExecQuery(query);

        res = staffs;
    }
    catch (err) {
        logger.loginfo(`get staff list error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.getStaff = async (staff_id) => {
    let res;
    try {
        let query = `SELECT * FROM vw_staffs WHERE staff_id='${staff_id}'`;
        const staff = await db.ExecQuery(query);

        if (staff.length > 0) {
            query = `SELECT * FROM ee_access WHERE staff_id='${staff_id}'`;
            const access = await db.ExecQuery(query);

            res = { staff: staff, access: access }
        }
        else {
            res = 'staff not found!';
        }
    }
    catch (err) {
        logger.loginfo(`get staff error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.removeStaff = async (staff_id) => {
    let res;
    try{
        let query = `DELETE FROM ee_staffs WHERE staff_id='${staff_id}'`;
        
        await db.ExecQuery(query);

        query = `DELETE FROM ee_users WHERE staff_id='${staff_id}'`;

        await db.ExecQuery(query);

        query = `DELETE FROM ee_access WHERE staff_id='${staff_id}'`;

        await db.ExecQuery(query);

        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Delete staff error : ${err}`);
        res = 'error';
    }

    return res;
}

module.exports.changePassword = async (Staff) => {
    let res;
    try{
        let query = `SELECT username FROM ee_users WHERE staff_id='${Staff.staff_id}' AND upassword=md5('${Staff.old_password}')`;

        const user = await db.ExecQuery(query);

        if (user.length > 0) {
            query = `UPDATE ee_users SET upassword=md5('${Staff.new_password}') WHERE staff_id='${Staff.staff_id}'`;
            await db.ExecQuery(query);
            res = 'ok';
        }
        else {
            res = 'incorrect password!';
        }

    }
    catch(err){
        logger.loginfo(`Change password error : ${err}`);
        res = 'error';
    }

    return res;
}