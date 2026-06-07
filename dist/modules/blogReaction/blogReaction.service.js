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
exports.BlogReactionService = void 0;
const database_1 = require("../../database/database");
const catch_errors_1 = require("../../common/utils/catch-errors");
class BlogReactionService {
    /**
     * Add a reaction to a published post resolved by slug.
     * - 404 if the post does not exist (Req 5.3).
     * - Inserts a BlogReaction row then returns the updated reaction count (Req 5.1, 5.2).
     */
    create(slug, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield database_1.db.blogPost.findUnique({
                where: { slug },
                select: { id: true },
            });
            if (!post) {
                throw new catch_errors_1.NotFoundException('Blog post not found');
            }
            yield database_1.db.blogReaction.create({
                data: {
                    blogPostId: post.id,
                    type: data.type,
                },
            });
            const count = yield database_1.db.blogReaction.count({
                where: { blogPostId: post.id },
            });
            return { count };
        });
    }
}
exports.BlogReactionService = BlogReactionService;
