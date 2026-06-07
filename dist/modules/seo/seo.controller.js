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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoController = void 0;
const middlewares_1 = require("../../middlewares");
class SeoController {
    constructor(seoService) {
        this.sitemap = (0, middlewares_1.asyncHandler)((_req, res) => __awaiter(this, void 0, void 0, function* () {
            const xml = yield this.seoService.generateSitemap();
            res.header('Content-Type', 'application/xml');
            return res.status(200).send(xml);
        }));
        this.seoService = seoService;
    }
}
exports.SeoController = SeoController;
