export const storeCreditDateFormat = date => {
    const isoFormattedDate = date.replace(' ', 'T');
    const formattedDate = new Date(isoFormattedDate).toLocaleDateString(
        'en-ZA',
        {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: 'numeric',
            second: 'numeric'
        }
    );
    return formattedDate.replace( /\./g, ':');
};