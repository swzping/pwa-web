const formatDate = value => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(
        2,
        '0',
    )}.${date.getFullYear()}`;
};

export const formatDateRange = (fromDate, toDate) => {
    const start = formatDate(fromDate);
    const end = formatDate(toDate);

    return start && end ? `${start} - ${end}` : start || end;
};
