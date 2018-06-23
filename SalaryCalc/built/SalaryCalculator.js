/// <reference path ="../node_modules/@types/jquery/index.d.ts"/> 
/// <reference path ="../node_modules/@types/knockout/index.d.ts"/> 
var InputField = /** @class */ (function () {
    function InputField(text, value, type, readonly) {
        if (type === void 0) { type = '$'; }
        if (readonly === void 0) { readonly = false; }
        this.text = text;
        this.value = value;
        this.type = type;
        this.readonly = readonly;
    }
    return InputField;
}());
var TaxBracket = /** @class */ (function () {
    function TaxBracket(from, to, value) {
        this.from = from;
        this.to = to;
        this.value = value;
        this.text = toPercent(value) + ': ';
        if (from === 0) {
            this.text += ('$0 - $' + to.toLocaleString());
        }
        else if (to === Infinity) {
            this.text += ('$' + from.toLocaleString() + '+');
        }
        else {
            this.text += ('$' + from.toLocaleString() + ' - $' + to.toLocaleString());
        }
    }
    return TaxBracket;
}());
var YearData = /** @class */ (function () {
    function YearData(salaryVM, year) {
        var _this = this;
        this.baseSalary = ko.pureComputed({
            owner: this,
            read: function () {
                return salaryVM.baseSalary() * Math.pow((1 + salaryVM.annualRaise()), year - 1);
            }
        });
        this.bonus = ko.pureComputed({
            owner: this,
            read: function () {
                if (year === 1) {
                    return salaryVM.annualBonus() + salaryVM.signOnBonus();
                }
                return salaryVM.annualBonus();
            }
        });
        this.other = ko.pureComputed({
            owner: this,
            read: function () {
                return salaryVM.otherPerks();
            }
        });
        this.retirementMatch = ko.pureComputed({
            owner: this,
            read: function () {
                return salaryVM.retirementMatch();
            }
        });
        this.totalGross = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.baseSalary() + _this.bonus() + _this.other() + _this.retirementMatch();
            }
        });
        this.tax = ko.pureComputed({
            owner: this,
            read: function () {
                return -(_this.baseSalary() + _this.bonus() - _this.retirementMatch() - salaryVM.taxDeduction()) * salaryVM.taxBracket();
            }
        });
        this.totalNet = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.totalGross() + _this.tax();
            }
        });
        this.equityVested = ko.pureComputed({
            owner: this,
            read: function () {
                return salaryVM.signOnEquity() / 4 * year;
            }
        });
        this.equityCost = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.equityVested() * salaryVM.exercisePrice();
            }
        });
        this.equityGrossProfit = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.equityVested() * salaryVM.pricePerShareAtExit() - _this.equityCost();
            }
        });
        this.equityTax = ko.pureComputed({
            owner: this,
            read: function () {
                return -_this.equityGrossProfit() * 0.15;
            }
        });
        this.equityNetProfit = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.equityGrossProfit() + _this.equityTax();
            }
        });
        this.totalComp = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.totalNet() + _this.equityNetProfit();
            }
        });
    }
    return YearData;
}());
var SalaryViewModel = /** @class */ (function () {
    function SalaryViewModel() {
        var _this = this;
        this.setDefaultDeduction = function () {
            _this.taxDeduction(12000);
        };
        this.taxBracketSelected = function (data, event) {
            _this.taxBracket(data.value);
        };
        this.baseSalary = ko.observable();
        this.annualBonus = ko.observable();
        this.annualRaise = ko.observable();
        this.signOnBonus = ko.observable();
        this.retirementMatch = ko.observable();
        this.otherPerks = ko.observable();
        this.taxDeduction = ko.observable();
        this.taxBracket = ko.observable();
        this.signOnEquity = ko.observable();
        this.exercisePrice = ko.observable();
        this.sharesOutstanding = ko.observable();
        this.currentValuation = ko.observable();
        this.expectedExitValuation = ko.observable();
        this.expectedDilution = ko.observable();
        this.years = ko.observableArray([
            new YearData(this, 1),
            new YearData(this, 2),
            new YearData(this, 3),
            new YearData(this, 4),
        ]);
        this.currentPricePerShare = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.currentValuation() / _this.sharesOutstanding();
            }
        });
        this.pricePerShareAtExit = ko.pureComputed({
            owner: this,
            read: function () {
                return _this.expectedExitValuation() / (_this.sharesOutstanding() * (1 + _this.expectedDilution()));
            }
        });
        this.baseSalary.subscribe(function (newBaseSalary) {
            var newComp = newBaseSalary + _this.annualBonus();
            for (var i = 0; i < _this.taxBrackets().length; i++) {
                var bracket = _this.taxBrackets()[i];
                if ((newComp >= bracket.from) && (newComp <= bracket.to)) {
                    _this.taxBracket(bracket.value);
                    break;
                }
            }
        });
        this.annualBonus.subscribe(function (newBonus) {
            var newComp = newBonus + _this.baseSalary();
            for (var i = 0; i < _this.taxBrackets().length; i++) {
                var bracket = _this.taxBrackets()[i];
                if ((newComp >= bracket.from) && (newComp <= bracket.to)) {
                    _this.taxBracket(bracket.value);
                    break;
                }
            }
        });
        this.cashInputFields = ko.observableArray();
        this.cashInputFields.push(new InputField('Base salary', this.baseSalary));
        this.cashInputFields.push(new InputField('Annual bonus', this.annualBonus));
        this.cashInputFields.push(new InputField('Annual raise %', this.annualRaise, '%'));
        this.cashInputFields.push(new InputField('Sign on bonus', this.signOnBonus));
        this.cashInputFields.push(new InputField('', null, '-'));
        this.cashInputFields.push(new InputField('401k match', this.retirementMatch));
        this.cashInputFields.push(new InputField('', null, '-'));
        this.cashInputFields.push(new InputField('Other perks', this.otherPerks));
        this.equityInputFields = ko.observableArray();
        this.equityInputFields.push(new InputField('Sign on equity', this.retirementMatch, '0'));
        this.equityInputFields.push(new InputField('Exercise price', this.exercisePrice));
        this.equityInputFields.push(new InputField('', null, '-'));
        this.equityInputFields.push(new InputField('Shares outstanding', this.sharesOutstanding, '0'));
        this.equityInputFields.push(new InputField('Current valuation', this.currentValuation));
        this.equityInputFields.push(new InputField('Current share price', this.currentPricePerShare, '$', true));
        this.equityInputFields.push(new InputField('', null, '-'));
        this.equityInputFields.push(new InputField('Expected dilution', this.expectedDilution, '%'));
        this.equityInputFields.push(new InputField('', null, '-'));
        this.equityInputFields.push(new InputField('~Valuation @ exit', this.expectedExitValuation));
        this.equityInputFields.push(new InputField('~Share price @ exit', this.pricePerShareAtExit, '$', true));
        this.taxBrackets = ko.observableArray([
            new TaxBracket(0, 9255, 0.10),
            new TaxBracket(9256, 38700, 0.12),
            new TaxBracket(38701, 82500, 0.22),
            new TaxBracket(82501, 157500, 0.24),
            new TaxBracket(157501, 200000, 0.32),
            new TaxBracket(200001, 500000, 0.35),
            new TaxBracket(500000, Infinity, 0.37)
        ]);
        // Set defaults:
        this.baseSalary(150000);
        this.annualBonus(10000);
        this.annualRaise(0.06);
        this.signOnBonus(20000);
        this.retirementMatch(9000);
        this.otherPerks(1000);
        this.signOnEquity(25000);
        this.exercisePrice(2.01);
        this.sharesOutstanding(64000000);
        this.currentValuation(360000000);
        this.expectedExitValuation(1000000000);
        this.expectedDilution(0.2);
        this.setDefaultDeduction();
    }
    return SalaryViewModel;
}());
function toMoney(num) {
    if (num !== null) {
        return (num.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
    }
    return '0.00';
}
;
function toPercent(num) {
    return (num * 100).toFixed() + '%';
}
ko.bindingHandlers.money = {
    update: function (element, valueAccessor, allBindings) {
        // Gives us the real value if it is a computed observable or not
        var valueUnwrapped = ko.unwrap(valueAccessor());
        if ($(element).is(':input')) {
            $(element).val('$' + toMoney(valueUnwrapped));
        }
        else {
            $(element).text('$' + toMoney(valueUnwrapped));
        }
    },
    init: function (element, valueAccessor) {
        if ($(element).is(':input')) {
            $(element).change(function () {
                var text = $(element).val();
                var value = valueAccessor();
                value(parseFloat(text.replace('$', '').replace(new RegExp(',', 'g'), '')));
            });
        }
    }
};
ko.bindingHandlers.bigNumber = {
    update: function (element, valueAccessor, allBindings) {
        // Gives us the real value if it is a computed observable or not
        var valueUnwrapped = ko.unwrap(valueAccessor());
        if ($(element).is(':input')) {
            $(element).val(valueUnwrapped.toLocaleString());
        }
        else {
            $(element).text(valueUnwrapped.toLocaleString());
        }
    },
    init: function (element, valueAccessor) {
        if ($(element).is(':input')) {
            $(element).change(function () {
                var text = $(element).val();
                var value = valueAccessor();
                value(parseFloat(text.replace(new RegExp(',', 'g'), '')));
            });
        }
    }
};
ko.bindingHandlers.percent = {
    update: function (element, valueAccessor, allBindings) {
        // Gives us the real value if it is a computed observable or not
        var valueUnwrapped = ko.unwrap(valueAccessor());
        if ($(element).is(':input')) {
            $(element).val(toPercent(valueUnwrapped));
        }
        else {
            $(element).text(toPercent(valueUnwrapped));
        }
    },
    init: function (element, valueAccessor) {
        if ($(element).is(':input')) {
            $(element).change(function () {
                var text = $(element).val();
                var value = valueAccessor();
                value(parseFloat(text.replace('%', '')) / 100.0);
            });
        }
    }
};
var vm = new SalaryViewModel();
ko.applyBindings(vm);
//# sourceMappingURL=SalaryCalculator.js.map