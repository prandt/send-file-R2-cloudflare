const express = require('express');
const app = express();
const port = 3000;
const c = require('ansi-colors');
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const config = require('./config.json');
const path = require('path');
const multer = require('multer');

async function uploadFile(fileBuffer, fileName = null, contentType) {
    const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        }
    });

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: config.bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: contentType,
        },
    });

    return await upload.done();
}

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', { title: 'Upload file'})
})

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;

    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    const fileName = file.originalname;
    const contentType = file.mimetype;

    try {
        const result = await uploadFile(file.buffer, fileName, contentType);
        res.redirect('/sucess?file=' + result.Key)
    } catch {
        res.send('Error on upload');
    }

});

app.get('/sucess', (req, res) => {
    const url = new URL(config.customDomain)
    url.pathname = req.query.file
    res.render('sucess', {
            title: 'Upload sucess',
            message: `File uploaded`,
            fileUrl: url.toString()
        })
})

app.listen(port, () => {
    console.log(c.bold.red(`Running http://localhost:${port}`))
});

