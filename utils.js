const fs = require("fs");
const papaparse = require("papaparse");
const iconv = require("iconv-lite");

const readTabFile = (file_path) =>
    new Promise((resolve, reject) => {
        if (!fs.existsSync(file_path)) return resolve([]);
        papaparse.parse(iconv.decode(fs.readFileSync(file_path), "gbk"), {
            complete: function (results) {
                let result = [];
                let data = results.data;
                let head = data.shift();
                data.pop();
                for (let d of data) {
                    let obj = {};
                    for (let i = 0; i < d.length; i++) {
                        if (d[i] === "" || d[i] === " ") d[i] = null;
                        obj[head[i]] = d[i];
                    }
                    result.push(obj);
                }
                resolve(result);
            },
            delimiter: "\t",
        });
    });

module.exports = {
    readTabFile,
};
