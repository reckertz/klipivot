const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse incoming request bodies in JSON format
app.use(express.json({
    limit: '5mb'
})); // Increase the limit to 5MB


app.get('/api/files', (req, res) => {
    let initdir = path.join("c:", "Projekte", "klimaapp", "public", "data");
    let filePath = req.query.path;
    if (typeof filePath === "undefined" || filePath === null) {
        filePath = __dirname;
    }
    if (typeof filePath === "object" && Array.isArray(filePath) && filePath.length > 0) {
        let dir = filePath[0];
        for (let i = 1; i < filePath.length; i++) {
            dir = path.join(dir, filePath[i]);
        }
        filePath = dir;
    }
    let dirname = path.dirname(filePath);
    if (filePath.endsWith("..")) {
        let realPath = path.resolve(filePath);
        filePath = realPath;
    }
    if (filePath.length < initdir.length) {
        filePath = initdir;
    }
    const files = fs.readdirSync(filePath);
    const fileInfo = files.map((file) => ({
        path: filePath + path.sep,
        name: file,
        isDirectory: fs.statSync(path.join(filePath, file)).isDirectory(),
        size: fs.statSync(path.join(filePath, file)).size
    }));
    res.json(fileInfo);
});

app.get('/api/file', (req, res) => {
    const fullfilepath = req.query.fullfilepath;
    const source = req.query.source;
    const fileContent = fs.readFileSync(fullfilepath, 'utf-8');
    let result =  {
        fullfilepath: fullfilepath,
        source: source,
        fileContent: fileContent,
        filename: path.basename(fullfilepath)
    }
    res.json(result);
    /*
    const [metadata, header, ...data] = fileContent.split('\n');
    const columns = header.split(/[;|]/);
    const parsedData = data.map((line) => {
        const values = line.split(/[;|]/);
        return columns.reduce((row, column, index) => {
            row[column] = values[index];
            return row;
        }, {});
    });
    res.json(parsedData);
    */

});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});