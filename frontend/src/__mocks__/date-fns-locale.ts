// Mock for date-fns/locale with full localize functions
const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const createLocalize = () => ({
  ordinalNumber: (n: number) => `${n}`,
  era: () => '',
  quarter: () => '',
  month: (n: number) => months[n] || '',
  day: (n: number) => days[n] || '',
  dayPeriod: () => '',
});

const createMatch = () => ({
  ordinalNumber: () => ({ value: 1, rest: '' }),
  era: () => null,
  quarter: () => null,
  month: () => null,
  day: () => null,
  dayPeriod: () => null,
});

const createFormatLong = () => ({
  date: () => 'dd/MM/yyyy',
  time: () => 'HH:mm',
  dateTime: () => 'dd/MM/yyyy HH:mm',
});

export const vi = {
  code: 'vi',
  formatDistance: () => '',
  formatLong: createFormatLong(),
  formatRelative: () => '',
  localize: createLocalize(),
  match: createMatch(),
  options: {
    weekStartsOn: 1 as const,
    firstWeekContainsDate: 1 as const,
  },
};

export const enUS = {
  code: 'en-US',
  formatDistance: () => '',
  formatLong: createFormatLong(),
  formatRelative: () => '',
  localize: createLocalize(),
  match: createMatch(),
  options: {
    weekStartsOn: 0 as const,
    firstWeekContainsDate: 1 as const,
  },
};

export default { vi, enUS };


