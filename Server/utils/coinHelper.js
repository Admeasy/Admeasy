const COINS_PER_RUPEE = 10; //10 coins = 1 rupee
const MAX_MONTHLY_EARNINGS_INR = 500;
const MAX_MONTHLY_COINS = MAX_MONTHLY_EARNINGS_INR * COINS_PER_RUPEE; //5000 //5000 coins = 500 rupees
const COINS_PER_REFERRAL = 10;

const coinsToRupees = (coins) => coins / COINS_PER_RUPEE;

const rupeesToCoins = (rupees) => rupees * COINS_PER_RUPEE;

//How many coins can a user earn in a month?
const getRemainingMonthlyCoins = (coinsEarnedThisMonth) => {
  return Math.max(0, MAX_MONTHLY_COINS - coinsEarnedThisMonth);
};

//How many coins can actually be awarded (respects cap)
const getAwardableCoins = (coinsEarnedThisMonth, coinsToAward) => {
  const remaining = getRemainingMonthlyCoins(coinsEarnedThisMonth);
  return Math.min(remaining, coinsToAward);
};

module.exports = {
  COINS_PER_RUPEE,
  MAX_MONTHLY_EARNINGS_INR,
  MAX_MONTHLY_COINS,
  COINS_PER_REFERRAL,
  coinsToRupees,
  rupeesToCoins,
  getRemainingMonthlyCoins,
  getAwardableCoins,
};
