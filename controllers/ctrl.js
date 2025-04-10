const auth = require('../middleware/authen');
const data = require('../middleware/data');
const logger = require('../middleware/log');
const fileService = require('../middleware/file');
const { config } = require('../middleware/config');
const fs = require('fs');
const staff = require('../middleware/staff');

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

module.exports.Authen = async (req, res) => {
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

module.exports.Customer = async (req, res) => {

    const token = req.headers["authorization"];

    if (token) {
        if (req.body) {
            const { mode, Data } = req.body;
            if (mode === 'new') {
                logger.debuglog('New customer');
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
    if (token) {
        if (req.body) {
            const { mode, contacts } = req.body;
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
    if (token) {
        if (req.body) {
            let request;
            if (req.body.datas) {
                request = JSON.parse(req.body.datas);
            }
            else {
                request = req.body
            }
            let { mode, Data } = request;
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
    if (token) {
        if (req.body) {

            let result;
            const { mode, Data } = req.body;
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
    if (token) {
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

    if (token) {
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

    if (token) {

        const datas = JSON.parse(req.body.data)

        const file = req.files.file;

        if (datas) {
            const result = await data.UploadFile(datas, file);
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
        const filePath = `${config.FileServer.Path}${Info.folder}\\${Info.IO}\\${Info.filename}`;
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
    if (token) {
        const { Info } = req.body;
        const result = await data.DelFile(Info);
        res.status(200).json(result);
    }
    else {
        res.status(errors.err[1].code).json(errors.err[1].msg);
    }
}


module.exports.GetProjectLists = async (req, res) => {
    logger.debuglog('Get project lists');
    const token = req.headers["authorization"];

    if (token) {
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

    if (token) {
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

    if (token) {
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

    if (token) {
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
    if (token) {
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
    logger.debuglog('Add user');

    const token = req.headers["authorization"];
    if (token) {
        if (req.body) {
            let result;
            const { mode, Data } = req.body;
            if(mode === 'new'){
                result = await staff.AddStaff(Data);
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