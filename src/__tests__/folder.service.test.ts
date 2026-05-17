import * as folderService from '../../services/folder';
import pool from '../../db/client';

jest.mock('../../db/client', () => ({ query: jest.fn() }));
const mockQuery = pool.query as jest.Mock;

describe('folderService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getFolderByAddress', () => {
    it('returns null when no row found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await folderService.getFolderByAddress('GABC');
      expect(result).toBeNull();
    });

    it('maps snake_case columns to camelCase', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ owner: 'GABC', name: 'alice', cid: 'Qm1', template_id: 1, updated_at: new Date() }],
      });
      const result = await folderService.getFolderByAddress('GABC');
      expect(result?.templateId).toBe(1);
    });
  });

  describe('getCredentials', () => {
    it('returns empty array when no credentials', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await folderService.getCredentials('GABC');
      expect(result).toEqual([]);
    });
  });
});
