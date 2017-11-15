const fs = require('fs');
const download = require('download');

module.exports = {
  downloadFile: (url, dest) => {
    return Promise.resolve().then(() => {
      return download(url).then(data => {
        fs.writeFileSync(dest, data);

        console.log(data);

        return true;
      }).catch(err => {
        return Promise.reject(`An error ocurr trying to download the file: ${err}`);
      });
    });
  }
};