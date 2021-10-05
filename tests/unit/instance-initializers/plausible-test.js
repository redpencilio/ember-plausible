import Application from '@ember/application';
import { run } from '@ember/runloop';
import config from 'dummy/config/environment';
import { initialize } from 'dummy/instance-initializers/plausible';
import Resolver from 'ember-resolver';
import { module, test } from 'qunit';
import sinon from 'sinon';
import { restorePlausibleConfig } from '../../utils/environment-config';

module('Unit | Instance Initializer | plausible', function (hooks) {
  hooks.beforeEach(function () {
    this.TestApplication = class TestApplication extends Application {
      modulePrefix = config.modulePrefix;
      podModulePrefix = config.podModulePrefix;
      Resolver = Resolver;
    };
    this.TestApplication.instanceInitializer({
      name: 'initializer under test',
      initialize,
    });
    this.application = this.TestApplication.create({ autoboot: false });
    this.instance = this.application.buildInstance();
  });
  hooks.afterEach(function () {
    run(this.instance, 'destroy');
    run(this.application, 'destroy');
  });

  restoreEnvironmentName(hooks);
  restorePlausibleConfig(hooks);

  test("it doesn't enable Plausible in non-production builds if `enabled` isn't set in the environment config", async function (assert) {
    config['ember-plausible'] = {};

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.notCalled);
  });

  test("it enables Plausible in production builds if `enabled` isn't set in the environment config", async function (assert) {
    config['ember-plausible'] = {};
    config.environment = 'production';

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.calledOnce);
  });

  test('it enables Plausible if `enabled` is set to `true`', async function (assert) {
    config['ember-plausible'] = {
      enabled: true,
    };

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.calledOnce);
  });

  test('it enables Plausible if `enabled` is set to the string "true"', async function (assert) {
    config['ember-plausible'] = {
      enabled: 'true',
    };

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.calledOnce);
  });

  test("it doesn't enable Plausible if `enabled` is set to `false`", async function (assert) {
    config['ember-plausible'] = {
      enabled: false,
    };

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.notCalled);
  });

  test("it doesn't enable Plausible if `enabled` is set to a random string value", async function (assert) {
    config['ember-plausible'] = {
      enabled: 'truthy-string',
    };

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.notCalled);
  });

  test("it doesn't enable Plausible if `enabled` is set to different truthy value", async function (assert) {
    config['ember-plausible'] = {
      enabled: 1,
    };

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.notCalled);
  });

  test('it passes the Plausible environment config into the enable method', async function (assert) {
    config['ember-plausible'] = {
      enabled: true,
      domain: 'test-domain.be',
      trackLocalhost: true,
    };

    let plausible = getPlausibleServiceWithEnableStub(this.instance);

    await this.instance.boot();
    assert.ok(plausible.enable.calledOnce);
    assert.ok(plausible.enable.calledWith(config['ember-plausible']));
  });
});

function restoreEnvironmentName(hooks) {
  hooks.afterEach(function () {
    config.environment = 'test';
  });
}

function getPlausibleServiceWithEnableStub(owner) {
  let plausibleService = owner.lookup('service:plausible');
  sinon.stub(plausibleService, 'enable');
  return plausibleService;
}
