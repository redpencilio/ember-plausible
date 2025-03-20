import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'test-app/tests/helpers';

module('Acceptance | auto start', function (hooks) {
  setupApplicationTest(hooks);

  test(`it doesn't auto start the service when the app starts`, async function (assert) {
    await visit('/');

    const plausible = this.owner.lookup('service:plausible');

    assert.false(plausible.isEnabled);
  });
});
