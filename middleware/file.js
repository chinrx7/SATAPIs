
const db = require('./mysql');
const fs = require('fs');
const { config } = require('./config');
const { compareSync } = require('bcrypt');

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
    }

    const uploadPath = `${config.FileServer.Path}${Folder}\\${Options.IO}`;

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }

    const filePath = `${uploadPath}\\${Options.filename}`;

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

    const filePath = `${config.FileServer.Path}${fileInfo.folder}\\${fileInfo.IO}\\${fileInfo.filename}`;

    if(fs.existsSync(filePath)){
        res = fs.readFileSync(filePath);
    }
    else{
        res = 'File not found';
    }
    return res;
}

module.exports.delFile = async (fileInfo) => {
    let res;

    const filePath = `${config.FileServer.Path}${fileInfo.folder}\\${fileInfo.IO}\\${fileInfo.filename}`;

    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
        res = 'File deleted'
    }   
    else{
        res = 'File not found';
    }

    return res;
}
