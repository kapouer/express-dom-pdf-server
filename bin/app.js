const rc = require('rc');
const toml = require('toml');
const dom = require('express-dom');
const Path = require('path');

const moduleRoot = Path.dirname(Path.dirname(module.filename));
const pkgOpts = Object.assign({}, require(Path.join(moduleRoot, 'package.json')));
const opts = rc(pkgOpts.name, {
	cwd: process.cwd(),
	env: pkgOpts.env || process.env.NODE_ENV || 'development',
	name: pkgOpts.name,
	version: pkgOpts.version.split('.').slice(0, 2).join('.'),
	pool: {
		min: 0,
		max: 4
	}
}, null, toml.parse);

dom.pool.max = opts.pool.max;
dom.pool.min = opts.pool.min;
dom.settings.allow = "all";

const pdf = require('express-dom-pdf').plugin;

const app = require('express')();

app.get('/', dom(function(mw, settings, request, response) {
	var q = request.query;
	settings.view = q.url;
	settings.allow = "all";
	settings.pdf = {params: {}};

	const params = settings.pdf.params;

	params.paper = q.paper || "iso_a4";

	params.margins = q.margins || "0.25in"; // 0.25in is the default
	if (q.fullpage == 1) params.margins = 0;

	if (q.enablejs == 0) settings.filters = [function() {
		if (this.uri.endsWith('.js')) this.cancel = true;
	}];

	params.quality = q.quality || "default";
	if (q.quality == "default") params.quality = "prepress";

	if (q.orientation) params.orientation = q.orientation;

	if (q.cookiename && q.cookievalue) {
		settings.cookies = `${q.cookiename}=${q.cookievalue}`;
	}

	if (q.file) params.title = q.file;

	mw.load({plugins: [pdf]});
}));

const listener = app.listen(opts.port, function() {
	console.info("port", listener.address().port);
});

