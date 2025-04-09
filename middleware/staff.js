const db = require('./mysql');
const logger = require('./log');

module.exports.AddStaff = async (Staff) => {
    let res;
    try {
        let query = `SELECT ID FROM ee_staffs WHERE Fname='${Staff.FirstName}' AND Lname='${Staff.SurName}'`;

        const exist = await db.ExecQuery(query);

        if (exist.length === 0) {
            query = `INSERT INTO ee_staffs (staff_id, Fname, Lname, Department, Position) VALUES ('${Staff.staff_id}', '${Staff.FirstName}', '${Staff.SurName}', 
            '${Staff.Department}', '${Staff.Position}')`;

            await db.ExecQuery(query);

            query = `INSERT INTO ee_users (staff_id, username, upassword) VALUES ('${Staff.staff_id}', '${Staff.uname}', 
            MD5('${Staff.password}'))`;

            await db.ExecQuery(query);

            for await(const a of Staff.access){
                query = `INSERT INTO ee_access (staff_id, module, access) VALUES ('${Staff.staff_id}', '${a.module}', '${a.access}')`;
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