const fs = require('fs').promises;
const path = require('path');
const SVGO = require('svgo');

// 配置输入和输出目录
const config = {
    inputDirectory: path.join(__dirname, 'svg'),
    outputDirectory: path.join(__dirname, 'src/assets/icons'),
    shouldOptimize: process.argv.includes('--optimize')
};

// 配置 SVGO 插件，用于优化 SVG 文件
const svgo = new SVGO({
    plugins: [
        { removeDimensions: true },
        { removeAttrs: { attrs: '(width|height|xmlns)' } },
        { addAttributesToSVGElement: { attributes: [{ width: '1em' }, { height: '1em' }] } },
        {
            replaceColors: {
                type: 'perItem', fn: (node) => {
                    // if (node.attrs && node.attrs.fill && node.attrs.fill.value !== 'none') {
                    //   node.attrs.fill.value = 'currentColor'; // 替换填充颜色
                    // }
                }
            }
        },
        { removeTitle: true },
        { removeComments: true },
        { removeDesc: true },
    ],
});

const toPascalCase = (str) =>
    str.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');

// 创建输入目录及其子目录
const createDirectories = async () => {
    try {
        const directories = [
            config.inputDirectory,
            path.join(config.inputDirectory, 'filled'),
            path.join(config.inputDirectory, 'outlined')
        ];

        await Promise.all(directories.map(async (dir) => {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }));
    } catch (error) {
        console.error(`目录创建失败: ${error.message}`);
    }
};


// SVG 添加或替换 data-icon 属性
const addDataIconAttribute = (svgContent, fileName) => {
    const dataIconValue = path.basename(fileName, '.svg').toLowerCase();
    const dataIconAttribute = `data-icon="${dataIconValue}"`;

    return svgContent.replace(/<svg\b([^>]*)>/, (match, p1) => {
        return p1.includes('data-icon')
            ? match.replace(/data-icon="[^"]*"/, dataIconAttribute)
            : `<svg${p1} ${dataIconAttribute}>`;
    });
};

// 处理单个 SVG 文件
const processSvgFile = async (filePath, outputDir) => {
    try {
        let svgContent = await fs.readFile(filePath, 'utf-8');
        svgContent = addDataIconAttribute(svgContent, filePath);

        const outputFilePath = path.join(outputDir, path.basename(filePath));

        if (config.shouldOptimize) {
            const result = await svgo.optimize(svgContent, { path: filePath });
            await fs.writeFile(outputFilePath, result.data, 'utf-8');
            console.log(`优化完成: ${path.basename(filePath)}`);
        } else {
            await fs.writeFile(outputFilePath, svgContent, 'utf-8');
            console.log(`跳过优化: ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.error(`处理失败 ${path.basename(filePath)}: ${error.message}`);
    }
};

// 删除输入目录下的所有文件
const cleanInputDirectory = async () => {
    try {
        const directories = [config.inputDirectory];

        while (directories.length > 0) {
            const currentDir = directories.pop();
            const files = await fs.readdir(currentDir);

            for (const file of files) {
                const filePath = path.join(currentDir, file);
                const stat = await fs.lstat(filePath);

                if (stat.isFile()) {
                    await fs.unlink(filePath);
                    console.log(`已删除: ${file}`);
                } else if (stat.isDirectory()) {
                    directories.push(filePath);
                }
            }
        }
    } catch (error) {
        console.error(`清理输入目录失败: ${error.message}`);
    }
};

// 生成 index.js 文件
const generateIndexFile = async () => {
    const indexContent = [];
    const subDirExports = [];

    const traverseOutputDirectory = async (currentDir, relativeDir = '') => {
        const files = await fs.readdir(currentDir);

        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = await fs.lstat(filePath);

            if (stat.isFile() && path.extname(file) === '.svg') {
                const iconName = path.basename(file, '.svg');
                let componentName = toPascalCase(iconName);

                if (relativeDir) {
                    const directoryName = toPascalCase(relativeDir.split(path.sep).pop());
                    componentName += directoryName;
                }

                const exportPath = path.join(relativeDir, file).replace(/\\/g, '/');
                const exportLine = `export { default as ${componentName} } from './${exportPath}';`;

                relativeDir ? subDirExports.push(exportLine) : indexContent.push(exportLine);
            } else if (stat.isDirectory()) {
                await traverseOutputDirectory(filePath, path.join(relativeDir, file));
            }
        }
    };

    await traverseOutputDirectory(config.outputDirectory);

    await fs.writeFile(path.join(config.outputDirectory, 'index.js'), [...indexContent, ...subDirExports].join('\n'), 'utf-8');
    console.log('index.js 文件已生成');
};

// 处理输入目录下的所有 SVG 文件
const processAllSvgFiles = async () => {
    await createDirectories();
    const directories = [config.inputDirectory];

    while (directories.length > 0) {
        const currentDir = directories.pop();
        const files = await fs.readdir(currentDir);

        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = await fs.lstat(filePath);

            if (stat.isFile() && path.extname(file) === '.svg') {
                const relativeDir = path.relative(config.inputDirectory, currentDir);
                const outputDir = path.join(config.outputDirectory, relativeDir).replace('temp/', '');

                await fs.mkdir(outputDir, { recursive: true });
                await processSvgFile(filePath, outputDir);
            } else if (stat.isDirectory()) {
                directories.push(filePath);
            }
        }
    }

    await generateIndexFile();
    await cleanInputDirectory();
};

// 执行 SVG 处理
processAllSvgFiles().catch((error) => console.error(`执行过程出错: ${error.message}`));
