// Query string rỗng (?search=&minPrice=) được coi như không truyền

export const toText = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  return text === '' ? undefined : text;
};

export const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  return Number(value);
};

// "true" / "false" trên URL thành boolean, giá trị khác giữ nguyên để validator báo lỗi
export const toBoolean = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '') return undefined;
  return value;
};
