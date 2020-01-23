// options for controlling search performance
export const NORMAL_SEARCH_OPTIONS: Fuzzysort.Options = {
  limit: 50, // don't return more results than you need!
  allowTypo: false, // if you don't care about allowing typos
  threshold: -10000 // don't return bad results
};

// options for controlling search performance
export const SUPER_QUICK_SEARCH_OPTIONS: Fuzzysort.Options = {
  limit: 5, // don't return more results than you need!
  allowTypo: false, // if you don't care about allowing typos
  threshold: -10000 // don't return bad results
};
