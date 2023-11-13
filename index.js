
const express = require('express');
const app = express();
const port = 3000;
const c = require('ansi-colors');
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const config = require('./config.json');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

async function uploadVideo(videoBuffer) {
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
            Key: `${uuidv4()}.mp4`,
            Body: videoBuffer,
            ContentType: 'video/mp4',
        },
    });

    return await upload.done();
}

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index', { title: 'Upload video'})
})

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.single('video'), async (req, res) => {
    const file = req.file;

    if (!file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    try {
        const result = await uploadVideo(file.buffer);
        res.redirect('/sucess?video=' + result.Key)
    } catch {
        res.send('Error on upload');
    } finally {
        console.log(file.path)
        // fs.unlinkSync(file.path);
    }

});

app.get('/sucess', (req, res) => {
    const url = new URL(config.customDomain)
    url.pathname = req.query.video
    res.render('sucess', {
            title: 'Upload sucess',
            message: `Video uploaded`,
            videoUrl: url.toString()
        })
})

app.listen(port, () => {
    console.log(c.bold.red(`Running http://localhost:${port}`))
});

