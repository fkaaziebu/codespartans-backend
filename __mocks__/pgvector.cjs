'use strict';
module.exports = {
  toSql: (arr) => `[${Array.from(arr).join(',')}]`,
  SparseVector: class SparseVector {},
};
