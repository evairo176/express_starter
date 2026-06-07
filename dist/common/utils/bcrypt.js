"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareValue = exports.hashValue = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const hashValue = (value_1, ...args_1) => __awaiter(void 0, [value_1, ...args_1], void 0, function* (value, salt = 10) {
    const hashPassword = yield bcryptjs_1.default.hash(value, salt);
    return hashPassword;
});
exports.hashValue = hashValue;
const compareValue = (value, hashedValue) => __awaiter(void 0, void 0, void 0, function* () {
    const compare = yield bcryptjs_1.default.compare(value, hashedValue);
    return compare;
});
exports.compareValue = compareValue;
