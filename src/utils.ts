export const insertBetween = (arr: any[], item: any) => {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i]);
    if (i < arr.length - 1) {
      result.push(item);
    }
  }
  return result;
};
