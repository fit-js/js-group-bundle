import path from 'path';
import { obj as thru } from 'through2';

// import del from 'del';
import vfs from 'vinyl-fs';
import gulpPlumber from 'gulp-plumber';
import gulpUglify from 'gulp-uglify';
import gulpFn from 'gulp-fn';
import gulpClip from 'gulp-clip-empty-files';
import * as pkg from './package.json';

let develop, output, source, cwd, sourcemaps, sep;

export function init (config, core) {
	develop = core.args.env() === 'develop';

	source = config.source || '**/*.js';
	sep = config.sep || '.';
	sourcemaps = config.maps || (config.maps && develop) || false;
	output = config.output;
	cwd = config.cwd ? path.join (process.cwd(), config.cwd) : process.cwd();

	if (!output || !cwd) {
		core.utils.error (pkg.name, 'config.output & config.cwd are required');
		return;
	}

	build();

	let bs = core.globals.get('bs');

	if (develop && bs) {

		bs.watch (source, {
			ignoreInitial: true, cwd
		})
			.on ('add', build)
			.on ('change', build);
	}

	return;
}

function build (file) {
	var msg = file ? file : pkg.name
	console.time (msg);
	buildDefault();
	console.timeEnd (msg);
}

function buildDefault () {

	return vfs.src (source, { sourcemaps, cwd })
		.pipe (gulpClip())
		.pipe (gulpPlumber())
		.pipe (gulpFn (
			function (file) {
				var file_frombase = path.relative(file.base, file.history[0]);
				var file_leftover = file.history[0].replace(file_frombase, '');
				file.history[0] = path.join(file_leftover, file_frombase.replace(path.sep, sep));
			}, true)
		)
		.pipe (develop ? thru() : gulpUglify())
		.pipe (vfs.dest (output, {
			sourcemaps: sourcemaps ? '.' : false
		}));
}
