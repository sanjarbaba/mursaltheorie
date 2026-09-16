import test from 'node:test';
import assert from 'node:assert/strict';
import {gameAccess} from '../api/v1/_game-access.js';
const now=Date.parse('2026-09-16T12:00:00Z');
const user={access_status:'none'};
const grant={product_key:'theory_b_nl_30d',status:'active',starts_at:'2026-09-01T12:00:00Z',ends_at:'2026-10-01T12:00:00Z'};
test('both paid packages include the same thirty-day game access',()=>{for(const product_key of ['theory_b_nl_30d','theory_b_nl_fa_30d'])assert.equal(gameAccess(user,[{...grant,product_key}],now),new Date(grant.ends_at).toISOString());});
test('anonymous, beta, expired, future, revoked and book-only access are denied',()=>{
 assert.equal(gameAccess(null,[grant],now),null);
 assert.equal(gameAccess({access_status:'beta'},[],now),null);
 assert.equal(gameAccess({access_status:'blocked'},[grant],now),null);
 for(const patch of [{ends_at:'2026-09-15'},{starts_at:'2026-09-17'},{status:'revoked'},{product_key:'theory_b_book'},{ends_at:null}])assert.equal(gameAccess(user,[{...grant,...patch}],now),null);
});
test('new purchase starts a new month; revoked entitlement cannot fall back to legacy access',()=>{
 assert.ok(gameAccess(user,[{...grant,status:'expired'},{...grant,starts_at:'2026-09-16',ends_at:'2026-10-16'}],now));
 assert.equal(gameAccess({access_status:'active',access_starts_at:grant.starts_at,access_ends_at:grant.ends_at},[{...grant,status:'revoked'}],now),null);
 assert.equal(gameAccess(user,[{...grant,ends_at:'2027-01-01'}],now),new Date(grant.ends_at).toISOString());
});

