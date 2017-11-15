const fs = require('fs');
const download = require('download');

module.exports = {
  downloadFile: (url, dest) => {
    return Promise.resolve().then(() => {
      return download(url).then(data => {
        fs.writeFileSync(dest, data);
        return true;
      }).catch(err => {
        return Promise.reject(`An error ocurr trying to download the file: ${err}`);
      });
    });
  },
  read: (location) => {
    return Promise.resolve().then(() => {
      try {
        return fs.readFileSync(location, 'utf8');
      } catch(err) {
        return Promise.reject(`An error ocurr reading file: ${err}`);
      }
    });
  },
  createDir: (dirPath) => {
    return Promise.resolve().then(() => {
      try {
        if (!fs.existsSync(dirPath)){
          fs.mkdirSync(dirPath);
        }

        return true;
      } catch (err) {
        return Promise.reject(`An error ocurr creating directory: ${err}`);
      }
    });
  },
  fileExists: (filePath) => {
    return Promise.resolve().then(() => {
      return fs.existsSync(filePath);
    });
  }
};