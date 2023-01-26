ember-plausible
==============================================================================

`ember-plausible` is an easy way to integrate and interact with [Plausible analytics](https://plausible.io/) in your Ember applications.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.20 or above
* Ember CLI v3.20 or above
* Node.js v14 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-plausible
```

How it works
------------------------------------------------------------------------------
`ember-plausible` provides a thin wrapper around the [plausible-tracker](https://github.com/plausible/plausible-tracker) npm package. It doesn't use the standalone Plausible script tag that is traditionally used when integrating Plausible. The tracker code will be part of the app bundle which has the benefit that ad-blockers can't block it. The package itself is lazy-loaded so it will only be downloaded by the browser if Plausible is actually enabled.

Configuration
------------------------------------------------------------------------------
`ember-plausible` can be configured by adding an options object to the `config/environment.js` file:

```js
// config/environment.js
module.exports = function (environment) {
  let ENV = {
    // ...
    'ember-plausible': {
      // add options here
    },
  };
};
```

### Configuration options

If you want the same experience as the standalone Plausible script you only need to configure your domain name. Pageviews will automatically be tracked by default. 

For more advanced use cases you can use the following options:

| Name     | Description | Type | Default value | Required |
| -------- | --------    | -------- | --------      | -------- |
| enabled     | if `true`  or `"true"`, Plausible will be enabled and the needed code will be loaded | `boolean` or the string `"true"`     | `true` in production builds  | No |
| domain | The domain(s) you want to link to the events | `string` or an [array of `string`s](https://plausible.io/docs/plausible-script#can-i-send-stats-to-multiple-dashboards-at-the-same-time)* | - | Yes |
| apiHost | The URL of the Plausible instance | `string` | `https://plausible.io` | No |
| trackLocalhost | if `true`, apps running on localhost will send events | `boolean` | `false` | No |
| hashMode | if `true`, pageviews events will be sent when the URL hash changes. Enable this if you use the [`hash` Location'](https://guides.emberjs.com/release/configuring-ember/specifying-url-type/#toc_hash) option in Ember | `boolean` | `false` | No |
| enableAutoPageviewTracking | if `true`, all page changes will send an event | `boolean` | `true` | No |
| enableAutoOutboundTracking | if `true`, all clicks to external websites will send an event | `boolean` | `false` | No |

\* linking events to multiple domains isn't supported yet by the latest stable release of Plausible analytics in case you host your own instance. Only enable this if you are using `https://plausible.io` as your API host or if you verified that your self-hosted version supports this feature.

Usage
------------------------------------------------------------------------------

### Custom event goals
Plausible supports sending [custom events](https://plausible.io/docs/custom-event-goals) if you want to track things other than pageviews. To do this with `ember-plausible` you can use the [`trackEvent`](#trackEvent) method of the PlausibleService.

#### Signup form example

```js
// app/components/signup.js

import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class SignupComponent extends Component {
  @service plausible;

  @action 
  signup(event) {
    event.preventDefault();

    // Store the form data

    this.plausible.trackEvent('Signup');
  }
}
```

```hbs
{{! app/components/signup.hbs }}

<form {{on "submit" this.signup}}>
  {{! form elements }}
</form>
```

If we have multiple signup components in our app and we want to track which one is the most effective, we could provide extra data when sending the custom event.

```diff
- this.plausible.trackEvent('Signup');
+ this.plausible.trackEvent('Signup', { name: this.args.name });
```

Plausible will then show the exact amount of signup events for each unique form.

### Tracking outbound link clicks
Plausible makes it very easy to track outbound link clicks. To enable this functionality you need to set the `enableAutoOutboundTracking` option to `true`. 

Alternatively you can call the [`enableAutoOutboundTracking`](#enableAutoOutboundTracking) method on the Plausible service if Plausible was already enabled without the option being set to `true`.

Once enabled, all external links in the app will send an event to your Plausible instance which can be viewed in the Plausible dashboard by following step 2 of the [official outbound link tracking guide](https://plausible.io/docs/outbound-link-click-tracking#step-2-create-a-custom-event-goal-in-your-plausible-analytics-account).

> There is an [open bug report](https://github.com/plausible/plausible-tracker/issues/12) which might affect your application. Be sure to double check that it doesn't affect you before enabling this functionality on production environments.

### Opt out from counting your own visits
Since `ember-plausible` doesn't use a separate tracking script, [blocking that script with an ad-blocker](https://plausible.io/docs/excluding) isn't an option. [Plausible does provide an alternative option](https://plausible.io/docs/excluding-localstorage) which also works with this addon. You will have to reload the page after setting the localStorage value if Plausible was already enabled.

API
------------------------------------------------------------------------------

### Plausible Service
`ember-plausible` uses the [plausible-tracker](https://github.com/plausible/plausible-tracker) package and exposes it as an easy-to-use service.

#### Methods
##### enable
Enable Plausible if it isn't already. This is only needed if you explicitly disable Plausible through the configuration options.

###### options: `object`
The options object to initialize Plausible with. These are _almost_ the same  as the [configuration options](#Configuration-options) in the `config/environment.js` file. The `enabled` option isn't needed here.

###### Returns
A `Promise` which resolves when the Plausible service is fully functional.

##### trackPageview
Send a Pageview event (for the current page) to the API. This is useful if you want complete control over when pageview events are sent to the server.

###### Returns
A `Promise` which resolves when the pageview event is successfully sent.

##### trackEvent
Send a custom event to the API.

###### eventName: `string`
The name of the custom event. This is the value that you need to use when setting up custom goals in the Plausible dashboard.

###### props: `object`
The extra data that you want to send with your custom event.

###### Returns
A `Promise` which resolves when the custom event is successfully sent.

##### enableAutoPageviewTracking
Enable the functionality that automatically sends pageview events to the API. This is only needed iy you explicitly disable this functionality through the configuration options.

##### disableAutoPageviewTracking
Disable the functionality that automatically sends pageview events to the API.

##### enableAutoOutboundTracking
Enable the functionality that automatically sends outbound click events to the API.

##### disableAutoOutboundTracking
Disable the functionality that automatically sends outbound click events to the API.


#### Properties
##### isEnabled
returns `true` if the Plausible service was enabled by either the configuration option or calling `enable` directly.

##### isAutoPageviewTrackingEnabled
returns `true` if Plausible is automatically tracking page changes.

##### isAutoOutboundTrackingEnabled 
returns `true` if Plausible is automatically tracking outbound link clicks.

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
