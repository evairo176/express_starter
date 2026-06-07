/**
 * Blog comment deletion sequencing unit test (Req 4.6).
 *
 * Requirement 4.6: WHEN an Admin_User deletes an existing comment, THE
 * Blog_Service SHALL remove the comment and return a success response only
 * after the deletion succeeds.
 *
 * These tests exercise the real `BlogCommentService.delete` against a fake of
 * the Prisma `db.blogComment.delete` method whose resolution we control. By
 * gating the underlying delete behind a deferred promise we can assert that the
 * service's returned promise does NOT settle before the deletion resolves, i.e.
 * success is reported only after (not before) the delete completes.
 */

jest.mock('../src/database/database', () => {
  return {
    db: {
      blogComment: {
        delete: jest.fn(),
      },
    },
  };
});

import { db } from '../src/database/database';
import { BlogCommentService } from '../src/modules/blogComment/blogComment.service';

const mockDelete = (db as unknown as {
  blogComment: { delete: jest.Mock };
}).blogComment.delete;

const service = new BlogCommentService();

describe('BlogCommentService.delete sequencing (Req 4.6)', () => {
  beforeEach(() => {
    mockDelete.mockReset();
  });

  it('does not resolve until the underlying deletion resolves', async () => {
    // A deferred promise representing the in-flight delete. We resolve it
    // manually so we can observe ordering deterministically.
    let resolveDelete!: (value: unknown) => void;
    const deletePromise = new Promise((resolve) => {
      resolveDelete = resolve;
    });
    mockDelete.mockReturnValue(deletePromise);

    const events: string[] = [];

    const servicePromise = service.delete('comment-1').then((result) => {
      events.push('service-resolved');
      return result;
    });

    // Give the microtask queue a chance to run; the service must still be
    // pending because the deletion has not resolved yet.
    await Promise.resolve();
    expect(events).toEqual([]);

    // Now resolve the underlying deletion.
    events.push('delete-resolved');
    resolveDelete({ id: 'comment-1' });

    const result = await servicePromise;

    // Success is reported strictly after the deletion resolved.
    expect(events).toEqual(['delete-resolved', 'service-resolved']);
    expect(result).toEqual({ id: 'comment-1' });
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'comment-1' } });
  });

  it('returns the deleted comment after a successful deletion', async () => {
    const deleted = { id: 'comment-42', body: 'bye' };
    mockDelete.mockResolvedValue(deleted);

    const result = await service.delete('comment-42');

    expect(result).toBe(deleted);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'comment-42' } });
  });

  it('propagates the failure and does not report success when deletion rejects', async () => {
    const error = new Error('record not found');
    mockDelete.mockRejectedValue(error);

    await expect(service.delete('missing')).rejects.toThrow('record not found');
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'missing' } });
  });
});
