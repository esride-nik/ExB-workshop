# Experience Builder Workshop Extensions Repo
## by Esri Deutschland

Some Widgets and a theme.

## How to use the samples
Clone the sample repo into your Experience Builder Client root folder and restart your watcher.

### Looking for the what3words widget?
This one was moved to its own repo: [w3w-arcgis-exb-widget](https://github.com/EsriDE/w3w-arcgis-exb-widget)

### Polyfills for Node APIs in Experience Builder >= 1.8

Webpack 5 no longer includes polyfills for node core modules. This manifests in the error message ``BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default``, meaning: Packages that use node.js core modules no longer work natively with webpack 5.

Looking for an explanation, the following seemed plausible: "[Webpack 4 automatically polyfilled many node APIs in the browser. This was not a great system, because it could lead to surprisingly giant libraries getting pulled into your app by accident, and it gave you no control over the exact versions of the polyfills you were using. So Webpack 5 removed this functionality.](https://gist.github.com/ef4/d2cf5672a93cf241fd47c020b9b3066a)"

There are many descriptions for the workaround, directly in the error messages in the console and also under the above mentioned source: The required sources have to be entered in webpack.config under resolve.fallback and installed via ``npm i``.

So far so good. Except that this configuration has been chopped up in ExB and spread over several files:

![Webpack config files in ExB](./assets/webpack_configs.png)

From left to right:
* webpack.config.js in the "client" root folder referencing webpack-extensions.config.js in the "webpack" subfolder.
* webpack-extensions.config.js builds the config from references to webpack-extensions.common.js
* in webpack-extensions.common.js the resolve object occurs in 3 places, namely in getTemplatesWebpackConfig(), getWidgetsWebpackConfig() and getThemesWebpackConfig(). Here the property fallback is entered, whose contents (analogous to the other props) are entered in webpack.common.js.
* finally in webpack.common.js the references to the polyfilled packages are under exports.fallback.
* install all referenced NPM packages on "client" level

That works.

The trouble is, that the webpack files on root level of the "client" folder are not in my "exb-web-extension-repo", but are delivered with the ExB. Now if you use NPM packages in your custom widgets that require polyfills, you have to get to the webpack configs, but they are not in the repo. -_-

My solution: In my repository I created a subfolder called "_webpack5-config-updates", which contained the original supplied configs as the first commit. In the second commit are then my additions, so that one can also still understand, what has changed.

![Webpack config files in ExB](./assets/webpack_fallback.png)

This becomes important when you include several repos, each of which needs its own polyfills. Because then you have to look at the configs manually and add all needed polyfills to the webpack-configs in the "client"-folder.

It's an okay solution, but it's also not 100% cool. Suggestions?

[Originally published in the ArcGIS community.](https://community.esri.com/t5/arcgis-experience-builder-questions/npm-packages-in-experience-builder-1-8/m-p/1181885#M4574)