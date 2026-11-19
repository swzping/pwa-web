const fs = require('fs');
const { exec } = require('child_process');

// cmd line arguments
const args = process.argv.slice(2);
const veniaTypes = ['-vu', 'veniaui', 'venia', 'venia-ui'];
const peregrineTypes = ['-pg', 'peregrine'];
const pagebuilderTypes = ['-pb', 'pagebuilder'];
let type;
if (veniaTypes.includes(args[0])) type = 'venia';
if (peregrineTypes.includes(args[0])) type = 'peregrine';
if (pagebuilderTypes.includes(args[0])) type = 'pagebuilder';
if (!type) {
    console.log('Undefined copy type! Read ./readme.md for docs!');
    return;
}

// generate fileName
const separator  = args[1].indexOf('/') >= 0 ? '/' : '\\';
const inputArrDir = args[1].split(separator);
const fileName = inputArrDir[inputArrDir.length-1];

// generate input directory
const inputDir = inputArrDir.slice(0, inputArrDir.length-1).join('/');

// generate output directory
const outputDir = inputDir
    .replace('node_modules/', '')
    .replace('@magento/venia-ui/lib', 'src/overrides/venia-ui')
    .replace('@magento/peregrine/lib', 'src/overrides/peregrine')
    .replace('@magento/pagebuilder/lib', 'src/overrides/pagebuilder')

// for debugging only
// console.log({
//     args,
//     fileName,
//     inputDir,
//     outputDir
// });

// create output directory when doesn't exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});

// copy file
fs.copyFile(
    `${inputDir}/${fileName}`,
    `${outputDir}/${fileName}`,
    (err) => {
        if (err) throw err;
    }
);

// execute import transformation for output file
exec(`jscodeshift -t nodeTransform.js ${outputDir}`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error(`Error: ${error || stderr}`);
      return;
    }
    console.log('Success!');
    console.log('\x1b[36m%s\x1b[0m', `${outputDir}/${fileName}`);
});
