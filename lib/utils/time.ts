export const now = () => Math.floor(Date.now() / 1000);
export const fromUnix = (ts: number) => new Date(ts * 1000);
export const toUnix = (date: Date) => Math.floor(date.getTime() / 1000);
