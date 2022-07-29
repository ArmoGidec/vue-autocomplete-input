import { isObject } from 'lodash';

/**
 * @param { unknown } paramValue
 * @return {boolean}
 */
export const isLeaf = (paramValue) => !isObject(paramValue);
