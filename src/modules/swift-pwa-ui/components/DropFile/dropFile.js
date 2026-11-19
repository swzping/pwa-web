import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useDropFile } from '../../../peregrine/talons/DropFile/useDropFile';
import defaultClasses from './dropFile.module.css';

const DropFile = ({
    acceptedFile,
    dropValue,
    error,
    label,
    maxSize,
    maxWidth,
    maxHeight,
    multiple,
    noStyle,
    onDropFile,
    onGetFileBase64,
    setValue,
    showListFile,
    title,
    value,
}) => {
    const { formatMessage } = useIntl();
    const {
        dropFiles,
        getInputProps,
        isDragActive,
        rootProps,
        open
    } = useDropFile({
        acceptedFile,
        maxSize,
        maxWidth,
        maxHeight,
        multiple,
        noStyle,
        onDropFile,
        onGetFileBase64,
        dropValue,
        setValue,
    });

    const dropFilePlaceholder =  useMemo(() => {
        if(!noStyle) {
            return isDragActive
            ? formatMessage({ 
                id: 'dropFile:placeholder:dragActive',
                defaultMessage: `Drag 'n' drop some files here, or click to select files`
            })
            : formatMessage({ 
                id: 'dropFile:placeholder:dragNonActive',
                defaultMessage: 'click to select files'
            });
        }

        return `Drag 'n' drop some files here, or click to select files`;
    }, [noStyle, isDragActive, formatMessage]); 

    const droppedFiles = useMemo(() => {
        if(showListFile) {
            if (value && value.length > 0) {
                return value;
            } else if (dropFiles && dropFiles.length > 0) {
                return dropFiles;
            }
        }

        return [];
    }, [value, dropFiles]);

    const dropFileMessageClasses = useMemo(() => {
        const classes = [defaultClasses.dropfile_message];
        if(error) {
            classes.push(defaultClasses.error);
        }

        return classes.join(" ");
    }, [error]);
    
    const maybeTitle =  title && title !== '' 
        ? (
            <p variant="label" type="semiBold" color={error ? 'red' : 'default'}>
                {title}
            </p>
        ) : null;

    const maybeDropFileButton = noStyle 
        ? (
            <button type="button" onClick={open}>
                Choose file
            </button>
        ) : null;

    return (
        <>
            {maybeTitle}
            <div {...rootProps}>
                <input {...getInputProps()} />
                {maybeDropFileButton}
                <p>{dropFilePlaceholder}</p>
            </div>
            <p className={dropFileMessageClasses}>
                {`*${acceptedFile} less than ${maxSize/1000000}MB`}
            </p>
            <ul className={defaultClasses.dropped_file_list}>
                {droppedFiles.map((file, index) => (
                    <li
                        className={defaultClasses.dropped_file_item}
                        key={index}
                    >
                        {file.name}
                    </li>
                ))}
            </ul>
        </>
    )
};

DropFile.defaultProps = {
    acceptedFile: 'image/*,.pdf,.doc,.docx,xls,xlsx,.zip,.rar',
    dropValue: [],
    error: false,
    label: '',
    maxSize: 2000000,
    multiple: true,
    onDropFile: () => {},
    onGetFileBase64: () => {},
    setValue: () => {},
    showListFile: true,
    title: '',
    value: [],
};

export default DropFile;
