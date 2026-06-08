"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortDirection = void 0;
const graphql_1 = require("@nestjs/graphql");
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "ASC";
    SortDirection["DESC"] = "DESC";
})(SortDirection || (exports.SortDirection = SortDirection = {}));
(0, graphql_1.registerEnumType)(SortDirection, {
    name: 'SortDirection',
});
//# sourceMappingURL=sort-direction.input.js.map