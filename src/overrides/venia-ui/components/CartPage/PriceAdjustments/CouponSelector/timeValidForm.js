export const formatDateRange=(from_date, to_date)=> {
  const format = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return `${format(from_date)} - ${format(to_date)}`;
}