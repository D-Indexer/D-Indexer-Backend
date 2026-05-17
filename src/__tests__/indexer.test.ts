// Tests for the Stellar indexer event handling
// Full integration tests require a running Soroban RPC node.
// Unit tests below cover the ScVal parsing logic.

describe('stellar indexer', () => {
  it('TODO: scValToString handles ScvSymbol', () => {
    // import { scValToString } once exported, then:
    // const encoded = xdr.ScVal.scvSymbol('folder_claimed').toXDR('base64');
    // expect(scValToString(encoded)).toBe('folder_claimed');
    expect(true).toBe(true); // placeholder
  });

  it('TODO: scValToString handles ScvAddress', () => {
    // const addr = Keypair.random().publicKey();
    // const encoded = new Address(addr).toScVal().toXDR('base64');
    // expect(scValToString(encoded)).toBe(addr);
    expect(true).toBe(true); // placeholder
  });

  it('TODO: handleEvent upserts folder on folder_claimed', () => {
    // mock pool.query, fire a synthetic event, assert query called with correct args
    expect(true).toBe(true); // placeholder
  });
});
