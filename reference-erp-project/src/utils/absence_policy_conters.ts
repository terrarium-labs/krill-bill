const COUNTER_TYPES = [
  {value: "fixed_balance", label: "Fixed Balance"},
  {value: "additional_time", label: "Additional Time"},
  {value: "time_worked", label: "Time Worked"},
];

const CYCLE_START = [
  {value: "january", label: "January"},
  {value: "february", label: "February"},
  {value: "march", label: "March"},
  {value: "april", label: "April"},
  {value: "may", label: "May"},
  {value: "june", label: "June"},
  {value: "july", label: "July"},
  {value: "august", label: "August"},
  {value: "september", label: "September"},
  {value: "october", label: "October"},
  {value: "november", label: "November"},
  {value: "december", label: "December"},
  {value: "first_day_of_contract", label: "First Day of Contract"},
];

const CYCLE_DURATION = [
  {value: "1", label: "1"},
  {value: "2", label: "2"},
  {value: "3", label: "3"},
  {value: "4", label: "4"},
  {value: "6", label: "6"},
  {value: "12", label: "12"},
];

const UNITS = [
  {value: "days", label: "Days"},
  {value: "hours", label: "Hours"},
];

const DAY_GENERATION = [
  {value: "first_day_of_the_cycle", label: "First Day of Cycle"},
  {value: "daily", label: "Daily"},
  {value: "last_day_of_the_month", label: "Last Day of Month"},
  {value: "first_day_of_the_month", label: "First Day of Month"},
  {value: "15th_of_the_month", label: "15th of Month"},
  {value: "1st_and_15th_of_the_month", label: "1st and 15th of Month"},
  {value: "15th_and_last_day_of_the_month", label: "15th and Last Day of Month"},
];

const WHEN_TO_USE = [
  {value: "same_cycle", label: "Same Cycle"},
  {value: "next_cycle", label: "Next Cycle"},
];

const DAYS_SHOWN_AS = [
  {value: "days_and_half_days", label: "Days and Half Days"},
  {value: "days_with_decimals", label: "Days with Decimals"},
  {value: "rounding", label: "Rounding"},
];

const EXPIRATION_PERIOD = [
  {value: "1", label: "1 month"},
  {value: "2", label: "2 months"},
  {value: "3", label: "3 months"},
  {value: "4", label: "4 months"},
  {value: "5", label: "5 months"},
  {value: "6", label: "6 months"},
  {value: "7", label: "7 months"},
  {value: "8", label: "8 months"},
  {value: "9", label: "9 months"},
  {value: "10", label: "10 months"},
  {value: "11", label: "11 months"},
  {value: "12", label: "12 months"},
  {value: "15", label: "15 months"},
  {value: "18", label: "18 months"},
  {value: "24", label: "24 months"},
  {value: "36", label: "36 months"},
  {value: "48", label: "48 months"},
  {value: "60", label: "60 months"},
];

export { COUNTER_TYPES, CYCLE_START, CYCLE_DURATION, UNITS, DAY_GENERATION, WHEN_TO_USE, DAYS_SHOWN_AS, EXPIRATION_PERIOD };