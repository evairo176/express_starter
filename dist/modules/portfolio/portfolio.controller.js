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
exports.PortfolioController = void 0;
const middlewares_1 = require("../../middlewares");
const portofolio_validator_1 = require("../../cummon/validators/portofolio.validator");
const response_1 = __importDefault(require("../../cummon/utils/response"));
class PortfolioController {
    constructor(portfolioService) {
        this.create = (0, middlewares_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const parsed = portofolio_validator_1.CreatePortfolioSchema.parse(req.body);
            const result = yield this.portfolioService.create(parsed);
            return response_1.default.success(res, result, `Retrieved all portfolio successfully`, 201);
        }));
        this.portfolioService = portfolioService;
    }
}
exports.PortfolioController = PortfolioController;
