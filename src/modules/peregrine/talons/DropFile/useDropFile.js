import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useIntl } from 'react-intl';

import { useToasts } from '@magento/peregrine';

const toBase64 = file =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

export const useDropFile = ({
    acceptedFile,
    maxSize,
    multiple,
    onDropFile,
    onGetFileBase64,
    dropValue,
    setValue,
    noStyle,
    maxWidth,
    maxHeight
}) => {
    const { formatMessage } = useIntl();
    const [dropFiles, setDropFiles] = useState(dropValue);
    const [, { addToast }] = useToasts();

    const maxFileSizeLabel = formatMessage({
        id: 'dropFile:maxSizeImage',
        defaultMessage: 'Max file'
    });

    const rejectedFileTypeLabel = formatMessage({
        id: 'dropFile:rejectFileType',
        defaultMessage: 'File type not allowed'
    });

    const checkImage = async files => {
        const promises = [];
        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];

            if (file.type && file.type.match(/image/)) {
                const promise = new Promise(resolve => {
                    const url = URL.createObjectURL(file);
                    const image = new Image();
                    image.src = url;
                    image.onload = () => {
                        file.width = image.width;
                        file.height = image.height;
                        resolve(file);
                    };
                });
                promises.push(promise);
            }
        }

        const dataFiles = await Promise.all(promises);
        let errorImage;
        for (let index = 0; index < dataFiles.length; index += 1) {
            const file = files[index];
            if (
                file.type &&
                file.type.match(/image/) &&
                maxWidth &&
                maxHeight
            ) {
                if (file.width >= maxWidth || file.height >= maxHeight) {
                    errorImage = `${maxFileSizeLabel} ${maxWidth}X${maxHeight} pixel`;
                }
            }
        }

        return errorImage;
    };
    const handleOnDrop = useCallback(async files => {
        if (files && files.length > 0) {
            const errorImage = await checkImage(files);
            if (!errorImage) {
                if (multiple) {
                    setDropFiles([...dropFiles, ...files]);
                    if (setValue) setValue([...dropFiles, ...files]);
                } else {
                    setDropFiles([files[0]]);
                    if (setValue) setValue([files[0]]);
                }
                onDropFile(files);
            } else {
                addToast({
                    type: 'error',
                    message: errorImage,
                    timeout: 5000
                });
            }
        }
        // Do something with the files
    }, []);
    const handleOnDropAccepted = async files => {
        // eslint-disable-next-line array-callback-return
        let filebase64 = [];
        for (let ind = 0; ind < files.length; ind += 1) {
            // eslint-disable-next-line no-await-in-loop
            const baseCode = await toBase64(files[ind]);
            if (baseCode) {
                filebase64 = [
                    ...filebase64,
                    {
                        baseCode,
                        file: files[ind]
                    }
                ];
            }
        }

        const errorImage = await checkImage(files);
        if (!errorImage) {
            onGetFileBase64(filebase64);
        }
    };
    const handleOnDropRejected = () => {
        const messageError = `${rejectedFileTypeLabel} ${acceptedFile} & max file ${maxSize /
            1000000}Mb`;
        addToast({
            type: 'error',
            message: messageError,
            timeout: 5000
        });
    };

    const baseStyle = {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        borderWidth: 2,
        borderRadius: 2,
        borderColor: '#eeeeee',
        borderStyle: 'dashed',
        backgroundColor: '#fafafa',
        color: '#bdbdbd',
        outline: 'none',
        transition: 'border .24s ease-in-out',
        cursor: 'pointer'
    };
    const activeStyle = {
        borderColor: '#2196f3'
    };
    const acceptStyle = {
        borderColor: '#00e676'
    };
    const rejectStyle = {
        borderColor: '#ff1744'
    };

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject,
        open
    } = useDropzone({
        accept: acceptedFile,
        onDrop: handleOnDrop,
        onDropAccepted: handleOnDropAccepted,
        onDropRejected: handleOnDropRejected,
        maxSize
    });

    const style = useMemo(() => {
        if (noStyle) return {};

        return {
            ...baseStyle,
            ...(isDragActive ? activeStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {})
        };
    }, [isDragActive, isDragReject, isDragAccept, noStyle]);
    const rootProps = getRootProps({ style });

    return {
        dropFiles,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject,
        open,
        rootProps,
        style
    };
};
