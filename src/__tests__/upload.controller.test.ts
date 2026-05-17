import { Request, Response } from 'express';
import * as ipfsService from '../../services/ipfs';
import { upload } from '../../controllers/upload.controller';

jest.mock('../../services/ipfs');
const mockPin = ipfsService.pinFile as jest.Mock;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('upload controller', () => {
  it('returns 400 when no file attached', async () => {
    const req = {} as Request;
    const res = mockRes();
    // asyncHandler unwraps — call the inner fn directly via the route
    // TODO: wire supertest for full integration test
    expect(req).toBeDefined(); // placeholder
  });

  it('returns cid on successful upload', async () => {
    mockPin.mockResolvedValue('QmTestCID');
    const req = {
      file: { buffer: Buffer.from('data'), originalname: 'test.png', mimetype: 'image/png', size: 100 },
    } as unknown as Request;
    const res = mockRes();
    // TODO: call handler and assert res.json({ cid: 'QmTestCID' })
    expect(mockPin).toBeDefined(); // placeholder
  });
});
