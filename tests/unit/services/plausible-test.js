import { settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import { preventAutoPlausibleEnable } from '../../utils/environment-config';

module('Unit | Service | plausible', function (hooks) {
  setupTest(hooks);

  // TODO: this doesn't actually work. The instance initializer is executed before the test hooks are.
  // This means that the tests fail if `enabled` is set to true in the environment config, even if we overwrite that config in the hook.
  preventAutoPlausibleEnable(hooks);

  test('it throws an error if no domain is specified', function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    assert.throws(() => {
      plausibleService.enable({});
    }, /"domain" should be a string or an array of strings/);
  });

  test('it combines an array of domains into a comma separated list', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    let mockPlausible = mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: ['foo.test', 'bar.test'],
    });

    assert.strictEqual(mockPlausible.lastArg.domain, 'foo.test,bar.test');
  });

  test('it auto tracks pageviews', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoPageviewTracking');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
    });

    assert.ok(plausibleService.enableAutoPageviewTracking.calledOnce);
  });

  test("it doesn't auto tracks pageviews if the option is disabled", async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoPageviewTracking');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
      enableAutoPageviewTracking: false,
    });

    assert.ok(plausibleService.enableAutoPageviewTracking.notCalled);
  });

  test("it doesn't auto track outbound clicks", async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoOutboundTracking');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
    });

    assert.ok(plausibleService.enableAutoOutboundTracking.notCalled);
  });

  test('it auto tracks outbound clicks if the option is set', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');
    sinon.spy(plausibleService, 'enableAutoOutboundTracking');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
      enableAutoOutboundTracking: true,
    });

    assert.ok(plausibleService.enableAutoOutboundTracking.calledOnce);
  });

  test('it has a trackPageview method that calls the same method on the wrapped package', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
    });

    plausibleService.trackPageview();

    assert.ok(plausibleService._plausible.trackPageview.calledOnce);
  });

  test('trackPageview accepts extra eventData and props arguments', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
    });

    const eventData = {
      url: 'https://foo-bar.baz',
    };
    const props = { foo: 'bar' };
    plausibleService.trackPageview(eventData, props);

    assert.ok(plausibleService._plausible.trackPageview.calledOnce);

    const callArgs = plausibleService._plausible.trackPageview.firstCall.args;
    assert.strictEqual(
      callArgs.at(0),
      eventData,
      'it passes the eventData argument into the trackPageview util'
    );
    assert.strictEqual(
      callArgs.at(1)?.props,
      props,
      'it passes the props argument as options.props to the trackPageview util'
    );
  });

  test('it has a trackEvent method that calls the same method on the wrapped package', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
    });

    plausibleService.trackEvent('foo');

    assert.ok(plausibleService._plausible.trackEvent.calledOnce);
    assert.ok(plausibleService._plausible.trackEvent.calledWith('foo'));
  });

  test('trackEvent accepts extra props and eventData arguments', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    plausibleService.enable({
      domain: 'foo.test',
    });

    const eventData = {
      url: 'https://foo-bar.baz',
    };
    const props = { foo: 'bar' };
    plausibleService.trackEvent('foo', props, eventData);

    assert.ok(plausibleService._plausible.trackEvent.calledOnce);
    const callArgs = plausibleService._plausible.trackEvent.firstCall.args;
    assert.strictEqual(
      callArgs.at(1)?.props,
      props,
      'it passes the props argument as options.props to the trackPageview util'
    );
    assert.strictEqual(
      callArgs.at(2),
      eventData,
      'it passes the eventData argument into the trackPageview util'
    );
  });

  test('it cleans up any active autotrackers when the service is destroyed', async function (assert) {
    let plausibleService = this.owner.lookup('service:plausible');

    mockPlausiblePackage(plausibleService);

    assert.strictEqual(plausibleService._autoPageviewTrackingCleanup, null);
    assert.strictEqual(plausibleService._autoOutboundTrackingCleanup, null);

    plausibleService.enable({
      domain: 'foo.test',
      enableAutoPageviewTracking: true,
      enableAutoOutboundTracking: true,
    });

    assert.ok(plausibleService._autoPageviewTrackingCleanup);
    assert.ok(plausibleService._autoOutboundTrackingCleanup);

    plausibleService.destroy();
    await settled();

    assert.strictEqual(plausibleService._autoPageviewTrackingCleanup, null);
    assert.strictEqual(plausibleService._autoOutboundTrackingCleanup, null);
  });
});

function mockPlausiblePackage(plausibleService) {
  const mockPlausible = sinon.fake.returns({
    trackEvent: sinon.fake(),
    trackPageview: sinon.fake(),
    enableAutoPageviews: sinon.fake.returns(() => {}),
    enableAutoOutboundTracking: sinon.fake.returns(() => {}),
  });

  sinon.replace(plausibleService, '_createPlausibleTracker', mockPlausible);

  return mockPlausible;
}
