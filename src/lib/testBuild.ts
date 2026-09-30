import Constants from 'expo-constants';

/**
 * Whether this build carries the testing tools.
 *
 * True in development, and true in a TestFlight build while
 * `expo.extra.testBuild` is set in app.json. Set that to false before an App
 * Store submission and the whole Testing section disappears — it is the one
 * switch that takes the tools out of the product.
 */
export const IS_TEST_BUILD: boolean =
  __DEV__ || Constants.expoConfig?.extra?.testBuild === true;
