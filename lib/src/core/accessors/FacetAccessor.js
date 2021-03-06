var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var state_1 = require("../state");
var FilterBasedAccessor_1 = require("./FilterBasedAccessor");
var query_1 = require("../query");
var assign = require("lodash/assign");
var map = require("lodash/map");
var FacetAccessor = (function (_super) {
    __extends(FacetAccessor, _super);
    function FacetAccessor(key, options) {
        _super.call(this, key, options.id);
        this.state = new state_1.ArrayState();
        this.translations = FacetAccessor.translations;
        this.options = options;
        this.defaultSize = options.size;
        this.options.facetsPerPage = this.options.facetsPerPage || 50;
        this.size = this.defaultSize;
        if (options.translations) {
            this.translations = assign({}, this.translations, options.translations);
        }
    }
    FacetAccessor.prototype.getBuckets = function () {
        return this.getAggregations([this.key, this.key, "buckets"], []);
    };
    FacetAccessor.prototype.setViewMoreOption = function (option) {
        this.size = option.size;
    };
    FacetAccessor.prototype.getMoreSizeOption = function () {
        var option = { size: 0, label: "" };
        var total = this.getCount();
        var facetsPerPage = this.options.facetsPerPage;
        if (total <= this.defaultSize)
            return null;
        if (total <= this.size) {
            option = { size: this.defaultSize, label: this.translate("facets.view_less") };
        }
        else if ((this.size + facetsPerPage) > total) {
            option = { size: total, label: this.translate("facets.view_all") };
        }
        else if ((this.size + facetsPerPage) < total) {
            option = { size: this.size + facetsPerPage, label: this.translate("facets.view_more") };
        }
        else if (total) {
            option = null;
        }
        return option;
    };
    FacetAccessor.prototype.getCount = function () {
        return this.getAggregations([this.key, this.key + "_count", "value"], 0);
    };
    FacetAccessor.prototype.isOrOperator = function () {
        return this.options.operator === "OR";
    };
    FacetAccessor.prototype.getBoolBuilder = function () {
        return this.isOrOperator() ? query_1.BoolShould : query_1.BoolMust;
    };
    FacetAccessor.prototype.buildSharedQuery = function (query) {
        var _this = this;
        var filters = this.state.getValue();
        var filterTerms = map(filters, query_1.TermQuery.bind(null, this.key));
        var selectedFilters = map(filters, function (filter) {
            return {
                name: _this.options.title || _this.translate(_this.key),
                value: _this.translate(filter),
                id: _this.options.id,
                remove: function () { return _this.state = _this.state.remove(filter); }
            };
        });
        var boolBuilder = this.getBoolBuilder();
        if (filterTerms.length > 0) {
            query = query.addFilter(this.uuid, boolBuilder(filterTerms))
                .addSelectedFilters(selectedFilters);
        }
        return query;
    };
    FacetAccessor.prototype.buildOwnQuery = function (query) {
        var filters = this.state.getValue();
        var excludedKey = (this.isOrOperator()) ? this.uuid : undefined;
        return query
            .setAggs(query_1.FilterBucket(this.key, query.getFiltersWithoutKeys(excludedKey), query_1.TermsBucket(this.key, this.key, { size: this.size }), query_1.CardinalityMetric(this.key + "_count", this.key)));
    };
    FacetAccessor.translations = {
        "facets.view_more": "View more",
        "facets.view_less": "View less",
        "facets.view_all": "View all"
    };
    return FacetAccessor;
})(FilterBasedAccessor_1.FilterBasedAccessor);
exports.FacetAccessor = FacetAccessor;
//# sourceMappingURL=FacetAccessor.js.map