export const detailFormatDate = date => {
    const isoFormattedDate = date.replace(' ', 'T');
    const formattedDate = new Date(isoFormattedDate).toLocaleDateString(
        'id-ID',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: 'numeric',
            second: 'numeric'
        }
    );
    return formattedDate.replace( /\./g, ':');
};