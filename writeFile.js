const fs = require("fs");
const iconv = require("iconv-lite");
/**
 * CSV导出
 * @param {*} path 导入路径
 * @param {*} outputPath 导出路径
 */
function outputFile(path, outputPath) {
    fs.readFile(path, "utf8", (err, data) => {
        if (err) {
            console.error("读取文件时出错:", err);
            return;
        }

        try {
            const jsonData = JSON.parse(data);

            let keys = [];
            Object.values(jsonData).forEach((dataArray) => {
                if (dataArray.length > 0) {
                    const obj = dataArray[0];
                    const objKeys = Object.keys(obj);
                    keys = keys.concat(objKeys);
                }
            });

            const output = [];
            output.push(keys);
            const maxArrayLength = Math.max(...Object.values(jsonData).map((arr) => arr.length));

            for (let i = 0; i < maxArrayLength; i++) {
                const valuesForRow = Object.values(jsonData).flatMap((arr) => {
                    if (arr[i]) {
                        return Object.values(arr[i]);
                    } else {
                        return Array.from({ length: Object.keys(arr[0]).length }, (_) => "");
                    }
                });
                output.push(valuesForRow);
            }
            const csvString = output.map((row) => row.map((item) => item.replace(/"/g, "")).join(",")).join("\n");
            //导出为GBK
            const csvBuffer = iconv.encode(csvString, "gbk");
            fs.writeFileSync(outputPath, csvBuffer, (err) => {
                if (err) {
                    console.error("Error during file writing:", err);
                } else {
                    console.log("CSV has been successfully written to output.csv");
                }
            });
        } catch (error) {
            console.error("解析JSON时出错:", error);
        }
    });
}
/**
 * 将对象或数组导出为JSON
 * @param {*} outputPath 导出路径
 * @param {*} strName 需要导出的对象或数组
 */
function outputJSON(outputPath, strName) {
    strName = typeof strName == "object" ? JSON.stringify(strName) : strName;
    fs.writeFileSync(outputPath, strName, (err) => {
        if (err) {
            console.error("Error writing to file:", err);
        } else {
        }
    });
}
module.exports = {
    outputFile,
    outputJSON,
};
