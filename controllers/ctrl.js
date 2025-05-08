const auth = require('../middleware/authen');
const data = require('../middleware/data');
const logger = require('../middleware/log');
const fileService = require('../middleware/file');
const { config } = require('../middleware/config');
const fs = require('fs');
const staff = require('../middleware/staff');
const sale = require('../middleware/sale');
const csv = require('../middleware/csv');
const ee = require('../middleware/employee');
const notice = require('../middleware/notification');
const db = require('../middleware/mysql');
const fdata =  require('../middleware/file');
const { log } = require('console');
const { kill } = require('process');

const errors = {
    err: [
        {
            code: 400,
            msg: 'invalid request!'
        },
        {
            code: 401,
            msg: 'authentication require!'
        },
        {
            code: 401,
            msg: 'invalid token!'
        }
    ]
}

let dblog = { module: '', action: '', staff: 0 };

module.exports.Authen = async (req, res) => {
    //notice.mailSend();
    logger.debuglog('User authen');
    if (req.body) {
        const { User, Password } = req.body;
        const result = await auth.Authen(User, Password);
        res.status(200).json(result);

    }
    else {
        res.status(errors.err[0].code).json(errors.err[0].msg);
    }
}

module.exports.eventlog = async (req,res) => {
    let result;
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        const { module, action, user_id } = req.body;
        dblog.module = module;
        dblog.action = action;
        dblog.staff = user_id;

        const result = await logger.DBlog(dblog);
        res.status(200).json(result);
    }
    else{
        res.status(errors.err[2].code).json(errors.err[2].msg);
    }
}

module.exports.importCustomer = async (req,res)=>{
    //csv.importCustomer();
}

module.exports.Tasks = async (req, res) => {
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        const { mode, Data } = req.body;
        let result;
        if(mode === 'new'){
            result = await data.addTask(Data);
        }
        else if(mode === 'edit'){
            result =  await data.editTask(Data);
        }
        else if(mode === 'get'){
            result = await data.getTask(Data);
        }
        res.status(200).json(result);
    }
    else{
        res.status(errors.err[2].code).json(errors.err[2].msg);
    }
}

module.exports.Timesheet = async (req,res) => {
    let result;
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        const { mode, Data } = req.body;
        if(mode === 'new'){
            result = await ee.newTimeSheet(Data);
        }
        else if(mode === 'update'){
            result = await ee.updateTimeSheet(Data);
        }
        else if(mode === 'get'){
            result = await ee.getTimesheet(Data);
        }
        else if(mode === 'get_pjtask'){
            result = await ee.getPJtask(Data);
        }

        if(result){
            res.status(200).json(result);
        }
    }
    else{
        res.status(errors.err[2].code).json(errors.err[2].msg);
    }
}

module.exports.Quotation = async (req, res) => {
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        let request;
        if (req.body.datas) {
            request = JSON.parse(req.body.datas);
        }
        else {
            request = req.body
        }
        const { mode, Data } = request;
        let result;
        if (mode === 'new') {
            result = await sale.CreateQT(Data, req.files);
        }
        else if(mode === 'get'){
            result = await sale.getQT(Data);
        }
        else if(mode === 'update'){
            result = await sale.updateQT(Data);
        }
        else if(mode === 'upload'){
            result = await sale.uploadFile(Data, req.files);
        }
        else if(mode === 'removefile'){
            result = await fdata.delQT(Data);
        }
        else if(mode === 'getfile'){
            const QYear = new Date(Data.qt_date).getFullYear();
    
            const filePath = `${config.FileServer.Path}\\Quotation\\${QYear}\\${Data.no}\\${Data.rev}\\${Data.filename}`
            if(fs.existsSync(filePath)){
                res.download(filePath, `${Data.no}_${Data.rev}${Data.file_extension}`);
            }
            else{
                res.status(500).json('file not dound')
            }
        }

        if(result){
            res.status(200).json(result);
        }
    }
    else {
        res.status(errors.err[2].code).json(errors.err[2].msg);
    }
}

module.exports.Customer = async (req, res) => {

    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { mode, Data } = req.body;

            const Mname = 'Customer';
            if (mode !== 'get') {
                if(Data.user_id === undefined){
                    Data.user_id = 0;
                }
                dblog = { module: Mname, action: `${mode} ${Data.name}`, staff: Data.user_id };
                logger.DBlog(dblog);
            }

            if (mode === 'new') {
                logger.debuglog(action);
                const result = await data.NewCustomer(Data);
                if (result.affectedRows === 1) {
                    res.status(200).json('ok');
                }
                else {
                    res.status(200).json('error')
                }
            }
            else if (mode === 'update') {
                logger.debuglog('Update customer');
                try {
                    await data.UpdateCustomer(Data);
                    res.status(200).json('ok');
                }
                catch (err) {
                    logger.loginfo(`Update Customer error : ${err}`);
                    res.status(200).json('error');
                }
            }
            else if (mode === 'get') {
                logger.debuglog('Get Customer');
                try {
                    const { cm_id } = req.body;
                    const result = await data.GetCustomer(cm_id)
                    res.status(200).json(result);
                }
                catch (err) {
                    logger.loginfo(`Get customer error : ${err}`);
                    res.status(200).json('error');
                }
            }
            else if(mode === 'add_ship') {
                logger.debuglog('Add shipping address');
                const result =  await data.AddShipAddr(Data);
                res.status(200).json(result);
            }
            else if(mode === 'edit_ship') {
                logger.debuglog('Edit shipping address');
                const result =  await data.EditShipAddr(Data);
                res.status(200).json(result);
            }
            else if(mode === 'del_ship') {
                logger.debuglog('Delete shipping address');
                const result =  await data.DeleteShipAddr(Data);
                res.status(200).json(result);
            }
            else if(mode === 'get_ship'){
                logger.debuglog('Get shipping address');
                const result = await data.getShipAddr(Data);
                res.status(200).json(result);
            }
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }

}

module.exports.Contact = async (req, res) => {
    const token = req.headers["authorization"];
    let result;
    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { mode, contacts } = req.body;
            console.log(contacts)

            const Mname = 'Contact';
            if(contacts.user_id === undefined){
                contacts.user_id = 0;
            }
            dblog = { module: Mname, action: `${mode} ${contacts.name}`, staff: contacts.user_id};
            logger.DBlog(dblog);

            if (mode === 'new') {
                result = await data.NewContact(contacts);
            }
            else if (mode === 'update') {
                result = await data.UpdateContact(contacts);
            }
            else if (mode === 'delete') {
                const { ID } = req.body;
                result = await data.DelContact(ID);
            }

            res.status(200).json(result);
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.Project = async (req, res) => {

    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        if (req.body) {
            let request;
            if (req.body.datas) {
                request = JSON.parse(req.body.datas);
            }
            else {
                request = req.body
            }
            let { mode, Data } = request;

            const Mname = 'Project';
            if(Data.user_id === undefined){
                Data.user_id = 0;
            }
            dblog = { module: Mname, action: `${mode} ${Data.Name}`, staff: Data.user_id};
            logger.DBlog(dblog);

            if (mode === 'new') {
                logger.debuglog('New Project');
                Data = replaceJsonNull(Data);
                const result = await data.NewProject(Data, req.files);
                res.status(200).json(result);
            }
            else if (mode === 'update') {
                logger.debuglog('Update Project');

                const result = await data.UpdateProject(Data);
                res.status(200).json(result);
            }
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

replaceJsonNull = (Json) => {
    for (let key in Json) {
        if (Json[key] === '') {
            Json[key] = '-';
        }
    }
    return Json;
}

module.exports.DO = async (req, res) => {
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        if (req.body) {

            let result;
            const { mode, Data } = req.body;

            const Mname = 'DO';
            if (mode !== 'get') {
                if (mode !== 'list') {
                    if (Data.user_id === undefined) {
                        Data.user_id = 0;
                    }
                    dblog = { module: Mname, action: `${mode} ${Data.pj_id}`, staff: Data.user_id }
                    logger.DBlog(dblog);
                }
            }

            if (mode === 'new') {
                logger.debuglog('Create DO');
                result = await data.createDO(Data);
                res.status(200).json(result);
            }
            else if (mode === 'update') {
                logger.debuglog('Update DO');
                result = await data.updateDO(Data);
                res.status(200).json(result);
            }
            else if (mode === 'get') {
                logger.debuglog('Get DO');
                result = await data.getDO(Data.do_no);
                res.status(200).json(result);
            }
            else if (mode === 'list') {
                logger.debuglog('Get Do List');
                result = await data.getDOList(Data.pj_id);
                res.status(200).json(result);
            }
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.getProjectDetail = async (req, res) => {
    logger.debuglog('Get project detail')
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { pj_id } = req.body;
            const result = await data.getProjectDetail(pj_id);
            res.status(200).json(result);
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.Info = async (req, res) => {
    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { mode } = req.body;
            if (mode === 'project') {
                logger.debuglog('Get Project Require Info');
                const result = await data.GetRequireInfo();
                res.status(200).json(result);
            }
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }


}

module.exports.SaveFiles = async (req, res) => {

    logger.debuglog('Upload file')

    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {

        const datas = JSON.parse(req.body.data)

        const file = req.files.file;

        if (datas) {
            const result = await data.UploadFile(datas, file);

            const Mname = 'File';
            if(datas.user_id === undefined){
                datas.user_id = 0;
            }
            dblog = { module: Mname, action: `Upload file ${datas.IO} ${datas.docname} ${datas.doc_no}`, staff: datas.user_id };
            logger.DBlog(dblog);

            res.status(200).json(result)
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.getFile = async (req, res) => {
    logger.debuglog('Get file');
    const token = req.headers["authorization"];
    if (token) {
        const { Info } = req.body;
        const filePath = `${config.FileServer.Path}${Info.folder}\\${Info.pj_id}\\${Info.type}\\${Info.filename}`;
        if (fs.existsSync(filePath)) {
            res.download(filePath, Info.filename);
        }
        else {
            res.status(500).json('file not dound')
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.delFile = async (req, res) => {
    logger.debuglog('Delete file');
    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        const { Info } = req.body;
        const result = await data.DelFile(Info);
        const Mname = 'File';
        if(!Info.user_id){
            Info.user_id = 0;
        }
        dblog = { module : Mname, action : `Delete File ${Info.ID} ${Info.IO}`, staff: Info.user_id};
        logger.DBlog(dblog);
        res.status(200).json(result);
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}


module.exports.GetProjectLists = async (req, res) => {
    logger.debuglog('Get project lists');
    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {
        const result = await data.GetProjectLists();
        res.status(200).json(result);
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.SaveProducts = async (req, res) => {
    logger.debuglog('Save master product');
    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { Products } = req.body;
            const result = await data.SaveProducts(Products);
            res.status(200).json(result);
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.SaveProjectProducts = async (req, res) => {
    logger.debuglog('Save master product');
    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { Products } = req.body;
            const result = await data.SaveProjectProduct(Products);
            res.status(200).json(result);
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.getProduct = async (req, res) => {
    logger.debuglog('Get product');
    const token = req.headers["authorization"];

    if (auth.ValidateToken(token)) {
        const result = await data.GetProducts();
        res.status(200).json(result);
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.getProjectProduct = async (req, res) => {
    logger.debuglog('Get project product');

    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)) {
        if (req.body) {
            const { pj_id } = req.body;
            const result = await data.getProjectProduct(pj_id);
            res.status(200).json(result);
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}

module.exports.Staff = async (req, res) => {

    const token = req.headers["authorization"];
    if (auth.ValidateToken(token)   ) {
        if (req.body) {
            let result;
            const { mode, Data } = req.body;

            if(mode === 'new'){
                logger.debuglog('Add user');
                result = await staff.AddStaff(Data);
            }
            else if(mode === 'update'){
                logger.debuglog('update user');
                result = await staff.EditStaff(Data);
            }
            else if(mode === 'delete'){
                logger.debuglog('delete user');
                result = await staff.removeStaff(Data.staff_id)
            }
            else if(mode === 'list'){
                logger.debuglog('get staff list');
                result = await staff.getlist();
            }
            else if(mode ==='getstaff'){
                logger.debuglog('get staff');
                result = await staff.getStaff(Data.staff_id);
            }
            else if(mode === 'chgpass'){
                logger.debuglog('staff change password');
                result = await staff.changePassword(Data);
            }

            res.status(200).json(result);
        }
        else {
            res.status(errors.err[0].code).json(errors.err[0].msg);
        }
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}