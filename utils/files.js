const fs = require('fs');
const download = require('download');

module.exports = {
  /**
   * Download file from url
   * @param url
   * @param dest
   * @returns {Promise.<TResult>}
   */
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
  /**
   * Read file synchronous
   * @param location
   * @returns {Promise.<TResult>}
   */
  read: (location) => {
    return Promise.resolve().then(() => {
      try {
        return fs.readFileSync(location, 'utf8');
      } catch(err) {
        return Promise.reject(`An error ocurr reading file: ${err}`);
      }
    });
  },
  /**
   * Create dir synchronous
   * @param dirPath
   * @returns {Promise.<TResult>}
   */
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
  /**
   * Check if file exists
   * @param filePath
   * @returns {Promise.<TResult>}
   */
  fileExists: (filePath) => {
    return Promise.resolve().then(() => {
      return fs.existsSync(filePath);
    });
  },
  /**
   * Create a createReadStream
   * @param filePath
   */
  createReadStream: filePath => fs.createReadStream(filePath),
  /**
   * Write file synchronous
   * @param filePath
   * @param content
   * @returns {*}
   */
  writeFile: (filePath, content) => {
    return fs.writeFileSync(filePath, content);
  },
};