import { format } from 'date-fns';

export const formatDate = (date = new Date(), dateFormat = 'D MMMM YYYY, HH:mm:ss') => format(date, dateFormat);
