/**
 * Shared in-memory fake of the Prisma `db` client for the blog modules.
 *
 * This fake honors the subset of the Prisma query surface that the blog
 * services actually use (`where`/`include`/`orderBy`/`select`/compound unique
 * keys). It is installed in a test file via:
 *
 *   jest.mock('../src/database/database', () =>
 *     require('./helpers/blogDbMock').createBlogDbMock(),
 *   );
 *
 * Each created mock owns its own in-memory store. Seed it through the
 * `__seed`/`__reset` accessors exposed on the returned `db`.
 *
 * Modeled tables: blogPost, blogCategory, blogTag, blogTagOnBlogPost,
 * blogComment, blogReaction, blogPostView.
 */

export interface BlogPostRow {
  id: string;
  slug: string;
  title?: string;
  excerpt?: string | null;
  content?: string;
  isPublished: boolean;
  totalViews: number;
  totalLikes?: number;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
}

export interface TagRow {
  id: string;
  name: string;
  slug: string;
}

export interface TagOnPostRow {
  blogPostId: string;
  tagId: string;
}

export interface CommentRow {
  id: string;
  blogPostId: string;
  name: string;
  email: string;
  body: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ReactionRow {
  id: string;
  blogPostId: string;
  type: string;
  createdAt: string;
}

export interface ViewRow {
  id: string;
  blogPostId: string;
  sessionId: string;
  createdAt: string;
}

interface Store {
  posts: BlogPostRow[];
  categories: CategoryRow[];
  tags: TagRow[];
  tagsOnPost: TagOnPostRow[];
  comments: CommentRow[];
  reactions: ReactionRow[];
  views: ViewRow[];
}

export function createBlogDbMock() {
  const store: Store = {
    posts: [],
    categories: [],
    tags: [],
    tagsOnPost: [],
    comments: [],
    reactions: [],
    views: [],
  };

  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}-gen-${++idCounter}`;

  // --- where matching -------------------------------------------------------

  function matchPost(p: BlogPostRow, where: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      const val = where[key];
      if (key === 'isPublished') {
        if (p.isPublished !== val) return false;
      } else if (key === 'id') {
        if (typeof val === 'object' && val !== null && 'not' in val) {
          if (p.id === val.not) return false;
        } else if (p.id !== val) {
          return false;
        }
      } else if (key === 'slug') {
        if (p.slug !== val) return false;
      } else if (key === 'categoryId') {
        if (p.categoryId !== val) return false;
      } else if (key === 'category') {
        // val = { slug }
        const cat = store.categories.find((c) => c.id === p.categoryId);
        if (!cat || cat.slug !== val.slug) return false;
      } else if (key === 'tags') {
        // val = { some: { tag: { slug } } } | { some: { tagId: { in: [...] } } }
        const some = val.some;
        const joins = store.tagsOnPost.filter((j) => j.blogPostId === p.id);
        if (some.tag?.slug !== undefined) {
          const ok = joins.some((j) => {
            const tag = store.tags.find((t) => t.id === j.tagId);
            return tag?.slug === some.tag.slug;
          });
          if (!ok) return false;
        } else if (some.tagId?.in !== undefined) {
          const ok = joins.some((j) => some.tagId.in.includes(j.tagId));
          if (!ok) return false;
        }
      } else if (key === 'OR') {
        if (!val.some((c: any) => matchPost(p, c))) return false;
      } else if (key === 'AND') {
        if (!val.every((c: any) => matchPost(p, c))) return false;
      } else if (key === 'title' || key === 'excerpt' || key === 'slug') {
        const text: string = (p as any)[key] ?? '';
        const needle: string = val.contains ?? '';
        if (val.mode === 'insensitive') {
          if (!text.toLowerCase().includes(needle.toLowerCase())) return false;
        } else if (!text.includes(needle)) {
          return false;
        }
      }
    }
    return true;
  }

  // --- post projection (include/select) ------------------------------------

  function projectPost(p: BlogPostRow, opts: { include?: any; select?: any }) {
    if (opts.select) {
      const out: any = {};
      for (const field of Object.keys(opts.select)) {
        if (opts.select[field]) out[field] = (p as any)[field];
      }
      return out;
    }
    const result: any = { ...p };
    const include = opts.include;
    if (include?.category) {
      result.category =
        store.categories.find((c) => c.id === p.categoryId) ?? null;
    }
    if (include?.tags) {
      const joins = store.tagsOnPost.filter((j) => j.blogPostId === p.id);
      result.tags = joins.map((j) => {
        const row: any = { blogPostId: j.blogPostId, tagId: j.tagId };
        if (include.tags.include?.tag) {
          row.tag = store.tags.find((t) => t.id === j.tagId) ?? null;
        }
        return row;
      });
    }
    return result;
  }

  function sortRows<T>(rows: T[], orderBy: any): T[] {
    if (!orderBy) return rows;
    const [field, dir] = Object.entries(orderBy)[0] as [string, string];
    return [...rows].sort((a: any, b: any) => {
      const av = a[field];
      const bv = b[field];
      let cmp: number;
      if (field === 'createdAt' || field === 'updatedAt') {
        cmp = new Date(av).getTime() - new Date(bv).getTime();
      } else {
        cmp = av < bv ? -1 : av > bv ? 1 : 0;
      }
      return dir === 'desc' ? -cmp : cmp;
    });
  }

  // --- db surface -----------------------------------------------------------

  const db: any = {
    __reset() {
      store.posts = [];
      store.categories = [];
      store.tags = [];
      store.tagsOnPost = [];
      store.comments = [];
      store.reactions = [];
      store.views = [];
      idCounter = 0;
    },
    __seed(seed: Partial<Store>) {
      db.__reset();
      Object.assign(store, {
        posts: seed.posts ?? [],
        categories: seed.categories ?? [],
        tags: seed.tags ?? [],
        tagsOnPost: seed.tagsOnPost ?? [],
        comments: seed.comments ?? [],
        reactions: seed.reactions ?? [],
        views: seed.views ?? [],
      });
    },
    __store: store,

    blogPost: {
      create: jest.fn(async ({ data }: any) => {
        const row: BlogPostRow = {
          id: data.id ?? nextId('post'),
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt ?? null,
          content: data.content,
          isPublished: data.isPublished ?? false,
          totalViews: data.totalViews ?? 0,
          totalLikes: data.totalLikes ?? 0,
          categoryId: data.categoryId ?? null,
          createdAt: data.createdAt ?? new Date().toISOString(),
          updatedAt: data.updatedAt ?? new Date().toISOString(),
        };
        store.posts.push(row);
        return { ...row };
      }),
      count: jest.fn(
        async ({ where }: any = {}) =>
          store.posts.filter((p) => matchPost(p, where)).length,
      ),
      findMany: jest.fn(
        async ({ where, orderBy, skip = 0, take, include, select }: any = {}) => {
          let rows = store.posts.filter((p) => matchPost(p, where));
          rows = sortRows(rows, orderBy);
          if (skip) rows = rows.slice(skip);
          if (take !== undefined) rows = rows.slice(0, take);
          return rows.map((p) => projectPost(p, { include, select }));
        },
      ),
      findUnique: jest.fn(async ({ where, include, select }: any) => {
        const found = store.posts.find(
          (p) =>
            (where.id !== undefined && p.id === where.id) ||
            (where.slug !== undefined && p.slug === where.slug),
        );
        if (!found) return null;
        return projectPost(found, { include, select });
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const row = store.posts.find((p) => p.id === where.id);
        if (!row) throw new Error('Post not found');
        for (const key of Object.keys(data)) {
          const val = data[key];
          if (
            val !== null &&
            typeof val === 'object' &&
            'increment' in val
          ) {
            (row as any)[key] = ((row as any)[key] ?? 0) + val.increment;
          } else {
            (row as any)[key] = val;
          }
        }
        return { ...row };
      }),
      updateMany: jest.fn(async ({ where, data }: any = {}) => {
        const rows = store.posts.filter((p) => matchPost(p, where));
        for (const row of rows) {
          for (const key of Object.keys(data)) {
            (row as any)[key] = data[key];
          }
        }
        return { count: rows.length };
      }),
      delete: jest.fn(async ({ where }: any) => {
        const idx = store.posts.findIndex((p) => p.id === where.id);
        if (idx === -1) throw new Error('Post not found');
        const [removed] = store.posts.splice(idx, 1);
        return { ...removed };
      }),
    },

    blogCategory: {
      findUnique: jest.fn(async ({ where }: any) => {
        return store.categories.find((c) => c.id === where.id) ?? null;
      }),
    },

    blogTagOnBlogPost: {
      createMany: jest.fn(async ({ data, skipDuplicates }: any) => {
        let count = 0;
        for (const entry of data) {
          const exists = store.tagsOnPost.some(
            (j) =>
              j.blogPostId === entry.blogPostId && j.tagId === entry.tagId,
          );
          if (exists && skipDuplicates) continue;
          store.tagsOnPost.push({
            blogPostId: entry.blogPostId,
            tagId: entry.tagId,
          });
          count++;
        }
        return { count };
      }),
      deleteMany: jest.fn(async ({ where }: any) => {
        const before = store.tagsOnPost.length;
        store.tagsOnPost = store.tagsOnPost.filter(
          (j) => j.blogPostId !== where.blogPostId,
        );
        return { count: before - store.tagsOnPost.length };
      }),
    },

    blogComment: {
      create: jest.fn(async ({ data }: any) => {
        const row: CommentRow = {
          id: data.id ?? nextId('comment'),
          blogPostId: data.blogPostId,
          name: data.name,
          email: data.email,
          body: data.body,
          isApproved: data.isApproved ?? false,
          createdAt: data.createdAt ?? new Date().toISOString(),
        };
        store.comments.push(row);
        return { ...row };
      }),
      findMany: jest.fn(async ({ where, orderBy }: any = {}) => {
        let rows = store.comments.filter((c) => {
          if (where?.blogPostId !== undefined && c.blogPostId !== where.blogPostId)
            return false;
          if (where?.isApproved !== undefined && c.isApproved !== where.isApproved)
            return false;
          return true;
        });
        rows = sortRows(rows, orderBy);
        return rows.map((c) => ({ ...c }));
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const row = store.comments.find((c) => c.id === where.id);
        if (!row) throw new Error('Comment not found');
        Object.assign(row, data);
        return { ...row };
      }),
      delete: jest.fn(async ({ where }: any) => {
        const idx = store.comments.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error('Comment not found');
        const [removed] = store.comments.splice(idx, 1);
        return { ...removed };
      }),
    },

    blogReaction: {
      create: jest.fn(async ({ data }: any) => {
        const row: ReactionRow = {
          id: data.id ?? nextId('reaction'),
          blogPostId: data.blogPostId,
          type: data.type ?? 'like',
          createdAt: data.createdAt ?? new Date().toISOString(),
        };
        store.reactions.push(row);
        return { ...row };
      }),
      count: jest.fn(
        async ({ where }: any = {}) =>
          store.reactions.filter(
            (r) => where?.blogPostId === undefined || r.blogPostId === where.blogPostId,
          ).length,
      ),
    },

    blogPostView: {
      findUnique: jest.fn(async ({ where }: any) => {
        const key = where.blogPostId_sessionId;
        return (
          store.views.find(
            (v) =>
              v.blogPostId === key.blogPostId && v.sessionId === key.sessionId,
          ) ?? null
        );
      }),
      create: jest.fn(async ({ data }: any) => {
        const exists = store.views.some(
          (v) => v.blogPostId === data.blogPostId && v.sessionId === data.sessionId,
        );
        if (exists) {
          throw new Error('Unique constraint failed on blogPostId_sessionId');
        }
        const row: ViewRow = {
          id: data.id ?? nextId('view'),
          blogPostId: data.blogPostId,
          sessionId: data.sessionId,
          createdAt: data.createdAt ?? new Date().toISOString(),
        };
        store.views.push(row);
        return { ...row };
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const key = where.blogPostId_sessionId;
        const row = store.views.find(
          (v) =>
            v.blogPostId === key.blogPostId && v.sessionId === key.sessionId,
        );
        if (!row) throw new Error('View not found');
        if (data.createdAt) {
          row.createdAt =
            data.createdAt instanceof Date
              ? data.createdAt.toISOString()
              : data.createdAt;
        }
        return { ...row };
      }),
    },

    $disconnect: jest.fn(async () => {}),
  };

  return { db };
}
