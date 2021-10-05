import { module, skip, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import { preventAutoPlausibleEnable } from '../../utils/environment-config';

module('Unit | Service | plausible', function (hooks) {
  setupTest(hooks);

  // TODO: this doesn't actually work. The instance initializer is executed before the test hooks are.
  // This means that the tests fail if `enabled` is set to true in the environment config, even if we overwrite that config in the hook.
  preventAutoPlausibleEnable(hooks);

  test('it lazy-loads the plausible-tracker module', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, '_loadPlausible');

    assert.notOk(plausibleService._plausible);
    await plausibleService.enable({
      domain: 'foo.test',
    });

    assert.ok(plausibleService._loadPlausible.calledOnce);
    assert.ok(plausibleService._plausible);
  });

  skip('it throws an error if no domain is specified', function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    // TODO: assert.throws doesn't work for async methods it seems
    assert.throws(() => {
      plausibleService.enable({});
    });
  });

  test('it combines an array of domains into a comma separated list', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    let { mockPlausible } = mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: ['foo.test', 'bar.test'],
    });

    assert.equal(mockPlausible.lastArg.domain, 'foo.test,bar.test');
  });

  test('it auto tracks pageviews', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoPageviewTracking');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
    });

    assert.ok(plausibleService.enableAutoPageviewTracking.calledOnce);
  });

  test("it doesn't auto tracks pageviews if the option is disabled", async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoPageviewTracking');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
      enableAutoPageviewTracking: false,
    });

    assert.ok(plausibleService.enableAutoPageviewTracking.notCalled);
  });

  test("it doesn't auto track outbound clicks", async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoOutboundTracking');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
    });

    assert.ok(plausibleService.enableAutoOutboundTracking.notCalled);
  });

  test('it auto tracks outbound clicks if the option is set', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoOutboundTracking');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
      enableAutoOutboundTracking: true,
    });

    assert.ok(plausibleService.enableAutoOutboundTracking.calledOnce);
  });

  test("it doesn't track user activity if the plausible_ignore localStorage value is set", async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    localStorage.setItem('plausible_ignore', 'true');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
      enableAutoOutboundTracking: true,
    });

    assert.notOk(plausibleService.isEnabled);
    localStorage.removeItem('plausible_ignore');
  });

  test('it has a trackPageview method that calls the same method on the wrapped package', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
    });

    plausibleService.trackPageview();

    assert.ok(plausibleService._plausible.trackPageview.calledOnce);
  });

  test('it has a trackEvent method that calls the same method on the wrapped package', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    await plausibleService.enable({
      domain: 'foo.test',
    });

    plausibleService.trackEvent('foo');

    assert.ok(plausibleService._plausible.trackEvent.calledOnce);
  });
});

function mockPlausiblePackage(plausibleService) {
  const mockPlausible = sinon.fake.returns({
    trackEvent: sinon.fake(),
    trackPageview: sinon.fake(),
    enableAutoPageviews: sinon.fake(),
    enableAutoOutboundTracking: sinon.fake(),
  });

  let fakeLoadPlausible = sinon.fake.resolves(mockPlausible);
  sinon.replace(plausibleService, '_loadPlausible', fakeLoadPlausible);

  return {
    mockPlausible,
    fakeLoadPlausible,
  };
}
