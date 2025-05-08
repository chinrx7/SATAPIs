
const db = require('./mysql');
const fs = require('fs');
const { config } = require('./config');
const { compareSync } = require('bcrypt');
const { el } = require('date-fns/locale');
const { resolve } = require('path');

module.exports.SaveFiles = async (Options, File) => {

    let res;
    const Type = Options.IO.substring(0, 2);
    let Folder;
    switch (Type) {
        case 'PJ':
            Folder = 'Project';
            break;
        case 'EN':
            Folder = 'Engineering';
            break;
        case 'PD':
            Folder = 'Product'
            break;
        case 'MA':
            Folder = 'MA'
            break;
        case 'IN':
            Folder = 'Internal'
    }

    let q = `SELECT type from pj_file_type WHERE ID=${Options.type}`;

    let subfoler = 'etc';

    const ft = await db.ExecQuery(q);
    if (ft.length > 0) {
        subfoler = ft[0].type;
    }

    const uploadPath1 = `${config.FileServer.Path}${Folder}\\${Options.IO}`;
    const uploadPath2 = `${config.FileServer.Path}${Folder}\\${Options.IO}\\${subfoler}`;


    if (!fs.existsSync(uploadPath1)) {
        fs.mkdirSync(uploadPath1);
    }

    if (!fs.existsSync(uploadPath2)) {
        fs.mkdirSync(uploadPath2);
    }

    const filePath = `${uploadPath2}\\${Options.filename}`;

    if (!fs.existsSync(filePath)) {

        const promise = await new Promise((resolve, reject) => {
            File.mv(filePath, (err) => {
                resolve(err);
            })
        })

        if (promise) {
            res = 'error'
        }
        else {
            const query = `INSERT INTO pj_files (pj_io, filename, docname, doc_no, folder, description, type, group_file) VALUES ('${Options.IO}', 
        '${Options.filename}', '${Options.docname}', '${Options.doc_no}', '${Folder}', '${Options.description}', '${Options.type}', '${Options.groupfile}')`;

            await db.ExecQuery(query);


            res = 'file uploaded'
        }
    }
    else {
        res = 'file existed';
    }

    return res;

}

module.exports.GetFile = async (fileInfo) => {
    let res;

    const query = `SELECT type, filename, pj_id FROM vw_files WHERE ID=${fileInfo.ID}`
    const fobj = await db.ExecQuery(query);

    const PIO = fobj[0].pj_id.substring(0, 2);
    let Folder;
    switch (PIO) {
        case 'PJ':
            Folder = 'Project';
            break;
        case 'EN':
            Folder = 'Engineering';
            break;
        case 'PD':
            Folder = 'Product'
            break;
        case 'MA':
            Folder = 'MA'
            break;
        case 'IN':
            Folder = 'Internal'
    }

    const filePath = `${config.FileServer.Path}${Folder}\\${fobj[0].IO}\\${fobj[0].type}\\${fobj[0].filename}`;

    console.log(filePath)

    if (fs.existsSync(filePath)) {
        res = fs.readFileSync(filePath);
    }
    else {
        res = 'File not found';
    }
    return res;
}

module.exports.delFile = async (fileInfo) => {
    let res;

    const query = `SELECT type, filename, pj_id FROM vw_files WHERE ID=${fileInfo.ID}`
    const fobj = await db.ExecQuery(query);

    const filePath = `${config.FileServer.Path}${fileInfo.folder}\\${fileInfo.IO}\\${fobj[0].type}\\${fileInfo.filename}`;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res = 'File deleted'
    }
    else {
        res = 'File not found';
    }

    return res;
}

module.exports.getQT = async (Info) => {
    let res;
    const QYear = new Date(Info.create_date).getFullYear();
    const filePath = `${config.FileServer.Path}\\${QYear}\\${Info.no}_${Info.rev}${Info.file_extension}`

    if (fs.existsSync(filePath)) {
        res = fs.readFileSync(filePath);
    }
    else {
        res = 'File not found';
    }
    return res;
}

module.exports.delQT = async (Info) => {
    let res;
    const cYear = new Date(Info.qt_date).getFullYear();
    const uploadPath = `${config.FileServer.Path}Quotation\\${cYear}\\${Info.no}\\${Info.rev}\\${Info.filename}`;

    if(fs.existsSync(uploadPath)){
        fs.unlinkSync(uploadPath);
        const query = `DELETE FROM sl_qt_files WHERE qt_no='${Info.no}' AND rev='${Info.rev}' AND filename='${Info.filename}'`;
        await db.ExecQuery(query);
        res = 'file deleted'
    }
    else{
        res = 'file not found';
    }

}

module.exports.saveQT = async (File, fName, Info) => {
    let res;

    const cYear = new Date(Info.qt_date).getFullYear();
    const uploadPath1 = `${config.FileServer.Path}Quotation\\${cYear}`;
    const uploadPath2 = `${config.FileServer.Path}Quotation\\${cYear}\\${Info.no}`;
    const uploadPath3 = `${config.FileServer.Path}Quotation\\${cYear}\\${Info.no}\\${Info.rev}`;

    if (!fs.existsSync(`${config.FileServer.Path}\\Quotation`)) {
        fs.mkdirSync(`${config.FileServer.Path}\\Quotation`);
    }
    if (!fs.existsSync(uploadPath1)) {
        fs.mkdirSync(uploadPath1);
    }
    if (!fs.existsSync(uploadPath2)) {
        fs.mkdirSync(uploadPath2);
    }
    if (!fs.existsSync(uploadPath3)) {
        fs.mkdirSync(uploadPath3);
    }

    const filePath = `${uploadPath3}\\${fName}`;

    if (!fs.filePath) {
        const promise = await new Promise((resolve, reject) => {
            File.mv(filePath, (err) => {
                resolve(err);
            })
        });

        if (promise) {
            res = 'error'
        }
        else {
            res = 'file uploaded'
        }
    }
    else {
        res = 'file existed'
    }

}
