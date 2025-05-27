const db = require('./mysql');
const logger = require('./log');

module.exports.getProjectCategory = async () => {
    let res = [];
    try{
        let query = `SELECT ID, type FROM pj_type`;
        const PTS = await db.ExecQuery(query);

        for await (const PT of PTS){
            query = `SELECT ID, sub_type FROM pj_subtype WHERE main_type='${PT.ID}'`;
            const ST = await db.ExecQuery(query);
            const r = { ID : PT.ID, Type: PT.type, Subtype: ST };
            res.push(r);
        }
    }
    catch(err){
        logger.loginfo(`Get project category error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.addSubCategory = async (t) => {
    let res;
    try{
        const query = `INSERT INTO pj_subtype (main_type, sub_type) VALUES ('${t.mID}', '${t.Subtype}')`;
        await db.ExecQuery(query);
        res = 'ok';
    }
    catch(err){
        logger.loginfo(`Add sub category error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.editSubCategory = async (t) => {
    let res;
    try{
        let query = `SELECT COUNT(*) AS cnt FROM pj_projects WHERE subtype='${t.ID}'`;
        const cnt = await db.ExecQuery(query);
        if(!cnt[0].cnt > 0){
            query = `UPDATE pj_subtype SET sub_type='${t.Subtype}' WHERE ID='${t.ID}'`;
            await db.ExecQuery(query);
            res = 'ok';
        }
        else{
            res = 'in use';
        }
    }
    catch(err){
        logger.loginfo(`Edit sub category error : ${err}`);
        res = 'error';
    }
    return res;
}

module.exports.delSubCategory = async (t) => {
    let res;
    try{
        let query = `SELECT COUNT(*) AS cnt FROM pj_projects WHERE subtype='${t.ID}'`;
        const cnt = await db.ExecQuery(query);
        if(!cnt[0].cnt > 0){
            query = `DELETE FROM pj_subtype WHERE ID='${t.ID}'`;
            await db.ExecQuery(query);
            res = 'ok';
        }
        else{
            res = 'in use';
        }
    }
    catch(err){
        logger.loginfo(`Edit sub category error : ${err}`);
        res = 'error';
    }
    return res;
}