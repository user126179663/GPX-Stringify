class GPXPlaceholder extends MicroParser {
	
	static $xml = Symbol('GPXPlaceholder.xml');
	
	static defaultSeparator = '\n';
	
	static upgradeTrack(track) {
		
		// 「トラック長」と「移動距離」の違いについては以下の URL 先の「Q:「トラック長」と「移動距離」の違いは。」を参照。
		// https://www.kashmir3d.com/online/superdemapp/manual/#ch-qa
		
		const	{ round } = Math,
				data = { ...track },
				{ distance, elevation, points, slopes } = data,
				{ cumul } = distance,
				cumulLength = cumul.length,
				pointsLength = points.length;
		let i, k, p, firstPoint,lastPoint, maxSpeed, spd;
		
		data['distance-cumul'] = new GPXArray(cumul, GPXSIDistance),
		
		data['distance-total'] = new GPXSIDistance(distance.total),
		
		firstPoint = points[0],
		lastPoint = points[points.length - 1],
		
		data.duration = new GPXTime(new Date((lastPoint?.time.getTime?.() ?? 0) - (firstPoint?.time.getTime?.() ?? 0))),
		
		data.elevation = new GPXObject(elevation, GPXSIDistance),
		
		data.speed = { avg: new GPXSpeed(distance.total, undefined, undefined, data.duration.get()) },
		
		i = -1, maxSpeed = 0;
		while (++i < cumulLength)	(p = points[i]).speed = new GPXSpeed(
													p.distance = cumul[i] - cumul[i ? i - 1 : i],
													undefined,
													undefined,
													p.duration = p.time.getTime() - points[i ? i - 1 : i].time.getTime()
												),
											maxSpeed < (spd = p.speed.get()) && (data.speed.max = p.speed, maxSpeed = spd);
		
		data.speed = new GPXObject(data.speed),
		
		i = -1;
		while (++i < pointsLength) (p = points[i]).date = p.time;
		data.points =	new GPXArray	(
													points,
													GPXObject,
													{
														date: GPXDate,
														distance: GPXSIDistance,
														duration: GPXTime,
														ele: GPXSIDistance,
														time: GPXTime
													}
												);
		
		data.slopes = new GPXArray(slopes, GPXSIDistance);
		
		//hi(data);
		
		return data;
		
	}
	
	static order(indices, source, defaultValue = raw) {
		
		const	parsed = GPXPlaceholder.parseIndices(indices, source, defaultValue),
				parsedLength = parsed.length,
				ordered = [];
		let i;
		
		i = -1;
		while (++i < parsedLength) ordered[i] = source[parsed[i]];
		
		return ordered;
		
	}
	static isInt32(index) {
		
		return Number.isInteger(index) && index < 32**2;
		
	}
	static parseIndices(indices, cap = 32**2-1, defaultValue = raw) {
		
		const	{ isArray } = Array, { isInt32 } = GPXPlaceholder;
		let i;
		
		indices = isArray(indices) ? [ ...indices ] : [ defaultValue ];
		
		const	indicesLength = indices.length, parsed = [];
		
		if (!(isArray(cap) ? (cap = cap.length) : isInt32(cap)) || cap < 1) {
			
			return [];
			
		} else if (indicesLength < 2 && !isInt32(indices[0])) {
			
			i = -1, indices.length = 0;
			while (++i < cap) parsed[i] = i;
			
		} else {
			
			const { max } = Math, lastIndicesIndex = indicesLength - 1, lastIndex = cap - 1, numbers = [];
			let l,i0,i1,i2, pi, idx,idx0, first, last, numbersLength;
			
			i = pi = -1, l = indicesLength, first = 0;
			while (++i < l) {
				
				if (isInt32(idx = indices[i])) {
					
					parsed[++pi] = first = indices[i] = idx < 0 ? max(cap + idx, 0) : idx > lastIndex ? lastIndex : idx;
					
				} else {
					
					i0 = i;
					while (++i0 < indicesLength && !isInt32(indices[i0]));
					
					isInt32(idx0 = indices[i0 < indicesLength ? i0 : lastIndicesIndex]) ?
						(last = idx0 < 0 ? max(cap + idx0, 0) : idx0 > lastIndex ? lastIndex : idx0) :
						(last = defaultValue),
					
					i1 = first, i2 = -1, numbers.length = 0;
					
					if (first <= last) {
						
						while (++i1 < last) numbers[++i2] = i1;
						
					} else {
						
						while (--i1 > last) numbers[++i2] = i1;
						
					}
					
					i1 = -1, numbersLength = numbers.length, i || (parsed[++pi] = first);
					while (++i1 < numbersLength) parsed[++pi] = numbers[i1];
					first === last || (parsed[++pi] = first = last),
					
					i = i0;
					
				}
				
			}
			
		}
		
		return parsed;
		
	}
	
	constructor(str, xml, extension, ...args) {
		
		super(str, ...args),
		
		this.extension = extension,
		
		this.gpx = new gpxParser(),
		
		this.xDOMParser = new DOMParser(),
		this.xSerializer = new XMLSerializer(),
		
		this.setXml(xml);
		
	}
	
	async parse() {
		
		const	{ isArray } = Array,
				{ isNaN } = Number,
				{ defaultSeparator, order } = GPXPlaceholder,
				{ gpx: { tracks = [] }, extension, xDOMParser, xSerializer } = this,
				tracksLength = tracks.length,
				lastTrackIndex = tracksLength - 1,
				fragments = this[MicroParser.$parse](),
				fragmentsLength = fragments.length,
				params = [],
				values = [];
		let	i,i0,i1,i2,
				paramsLength,trksLength,argsLength,
				fragment, trks,trk,trkLabel,trkArgs, param,separator, v, result, ext,args, xDOM, xTrks,xTrksLength, gpx,
				recursive;
		hi(fragments);
		i = -1, result = '';
		while (++i < fragmentsLength) {
			
			if	(isArray(fragment = fragments[i])) {
				
				trks = order(fragment[0], tracks, 0),
				
				// trk を複数指定した場合に結果の文字列を連結する際の文字列の決定。
				// {[] "," ext()} この例であれば、"," がその文字列の指定に相当する。
				// trk の指定子である [] の直後に指定するよう定めるため、以下ははそれを特定するための処理になる。
				// かなり不細工だが、他の処理の実装との兼ね合いが原因。未指定の場合は Array.prototype.join の既定値。
				
				i0 = -1, paramsLength = fragment.length;
				while (++i0 < paramsLength && !(!isArray(param = fragment[i0]) && param && typeof param === 'object'));
				
				paramsLength = i0, i0 = -1, separator = undefined;
				while (++i0 < paramsLength && isArray(fragment[i0]));
				
				i0 < paramsLength ? --i0 : (i0 = -1);
				while (++i0 < paramsLength && typeof fragment[i0] !== 'string');
				separator = i0 === paramsLength ? defaultSeparator : fragment[i0];
				
				// 以下は構文内の関数部分の抜き出し。
				
				--i0, i1 = -1, paramsLength = fragment.length, params.length = 0, recursive = null;
				while (++i0 < paramsLength) (param = fragment[i0]) && typeof param === 'object' && !isArray(param) &&
					(param instanceof MicroParser ? (recursive = param) : (params[++i1] = param));
				
				if ((paramsLength = ++i1) || recursive) {
					
					trkLabel = (param = params?.[0])?.label, trkArgs = param?.args,
					i0 = -1, trksLength = trks.length, values.length = 0;
					while (++i0 < trksLength) {
						
						if (recursive && typeof (v = recursive.str) === 'string' && v) {
							
							xDOM = xDOMParser.parseFromString(this[GPXPlaceholder.$xml], 'application/xml'),
							i1 = -1, xTrks = xDOM.querySelectorAll('trk'), xTrksLength = xTrks.length;
							while (++i1 < xTrksLength) i0 === i1 || (xTrks[i1--].remove(), --xTrksLength);
							(
								gpx ||= new GPXPlaceholder	(
																			v,
																			undefined,
																			extension,
																			this.createGCFromMP(this, v),
																			this[MicroParser.$bkt].L, this[MicroParser.$bkt].R,
																			this[MicroParser.$afx].L, this[MicroParser.$afx].R,
																			this[MicroParser.$sep]
																	)
							).setXml(xSerializer.serializeToString(xDOM)),
							v = await gpx.parse();
							
						} else {
							
							(v = (trk = trks[i0])[trkLabel]) &&
							typeof v === 'object' &&
							(v = trkArgs ? await v.get(...trkArgs) : await v.get());
							
						}
						
						if (v !== undefined) {
							
							i1 = recursive ? -1 : 0;
							while (++i1 < paramsLength) {
								
								if (extension.hasOwnProperty((param = params[i1]).label)) {
									
									if (typeof (ext = extension[param.label]) === 'function') {
										
										if (isArray(args = param.args)) {
											
											i2 = -1, argsLength = args.length;
											while (++i2 < argsLength && !(args[i2] instanceof Error));
											i2 === argsLength && (v = await ext(v, ...args));
											
										} else v = ext(v);
										
									} else if (!v || typeof v !== 'object') v = ext;
									
								}
								
							}
							
						}
						
						values[i0] = v;
						
					}
					
					fragment = values.join(separator);
					
				}
				
			}
			
			result += ''+(fragment && typeof fragment === 'object' ? '' : fragment);
			
		}
		
		return result;
		
	}
	
	setXml(xml) {
		
		try {
			
			(this.gpx = new gpxParser()).parse(xml),
			this[GPXPlaceholder.$xml] = xml;
			
		} catch(error) {
			
			return;
			
		}
		
		const { upgradeTrack } = GPXPlaceholder, { gpx } = this, { tracks } = gpx, tracksLength = tracks.length;
		let i;
		
		i = -1;
		while (++i < tracksLength) tracks[i] = upgradeTrack(tracks[i]);
		
	}
	
	toJSON(data = this.gpx?.tracks?.[0]) {
		
		const json = {};
		
		if (data) {
			
			let k,v;
			
			for (k in data) json[k] =	(v = data[k]) instanceof GPXData ? v.toJSON() :
													v && typeof v === 'object' ? 'unavailable' :
														v === null || v === undefined ? 'null' : typeof v;
			
		}
		
		return json;
		
	}
	
	get xml() {
		
		return this[GPXPlaceholder.$xml];
		
	}
	set xml(v) {
		
		this.setXml(v);
		
	}
	
}
class GPXPlaceholderExtensions {
	
	static $register = Symbol('GPXPlaceholderExtensions.register');
	
	static pad(str, targetLength = 2, padString = '0') {
		
		return (''+str)['pad' + (targetLength < 0 ? 'End' : 'Start')](Math.abs(targetLength), padString);
		
	}
	
	static before(str, before = '') {
		
		return before + str;
		
	}
	static after(str, after = '') {
		
		return str + after;
		
	}
	
	static replace(str, substr = '', newSubstr = '') {
		
		return str.replace(substr, newSubstr);
		
	}
	
	static fixed(str, digits = 2) {
		
		const { isNaN } = Number;
		let v;
		
		if (!isNaN(v = +str) && !isNaN(digits = +digits)) {
			
			v = v.toFixed(digits);
			
			return digits > 0 ? +v : v;
			
		}
		
		return str;
		
	}
	
	static ['round-f'](str, digits = 2) {
		
		const { isNaN } = Number;
		let v;
		
		if (!isNaN(v = +str) && !isNaN(digits = +digits)) {
			
			const { abs, pow, round } = Math, digitsAbs = abs(digits), powed = pow(10, digitsAbs);
			
			v = (round(v * powed) / powed);
			
			return digits > 0 ? v : (v = (''+v).split('.'))[0] + (v?.[1].padEnd?.(digitsAbs, '0') ?? '');
			
		}
		
		return str;
		
	}
	
}
GPXPlaceholderExtensions[GPXPlaceholderExtensions.$register] = function (method, name) {
	
	this[name || method?.name] = method;
	
};

class GPXData {
	
	static $toJSON = Symbol('GPXData.toJSON');
	static $type = Symbol('GPXData.type');
	static $unitList = Symbol('GPXData.unitList');
	
	constructor() {}
	
	getFormalUnit(unit, defaultUnit) {
		
		const unitList = this.constructor[GPXData.$unitList];
		
		if (unitList) {
			
			const { isArray } = Array;
			let k;
			
			unit = (''+unit).trim();
			for (k in unitList) if (unitList[k].indexOf(unit) !== -1) return k;
			
		}
		
		return defaultUnit;
		
	}
	getUnitListJSON(...args) {
		
		const { isArray } = Array, json = {};
		let unitList;
		
		if (
				isArray(unitList = this.constructor[GPXData.$unitList]) ||
				(typeof unitList !== 'object' && unitList !== null && unitList !== undefined && (unitList = [ unitList ]))
			)
		{
			
			const unitListLength = unitList.length;
			let i,l, v;
			
			i = -1;
			while (++i < unitListLength) json[v = unitList[i]] = typeof this.get(v, ...args);
			
		} else if (unitList && typeof unitList === 'object') {
			
			let i,l, k,v;
			
			for (k in unitList) {
				
				i = -1, l = (v = isArray(v = unitList[k]) ? v : v ? [ v ] : []).length;
				while (++i < l) json[v] = typeof this.get(v, ...args);
				
			}
			
		}
		
		return json;
		
	}
	
	toJSON() {
		
		return { __type: this.constructor[GPXData.$type], ...(this[GPXData.$toJSON]?.() ?? {}), ...this.getUnitListJSON() };
		
	}
	
	get unitList() {
		
		const { $unitList } = GPXData;
		
		return this.constructor?.[$unitList] ?? {};
		
	}
	
}
GPXData[GPXData.$type] = 'basement';

class GPXTime extends GPXData {
	
	static [GPXData.$type] = 'utc-date';
	static [GPXData.$unitList] =	[
												'y',
												'M',
												'd',
												'dn',
												'dnf',
												'dnj',
												'hn',
												'hnf',
												'hnj',
												'h',
												'h12',
												'm',
												's',
												'ms',
												'gengo',
												'tzo',
												'iso',
												'utc',
												'json',
												'str',
												'__default'
											];
	
	static dn = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
	static dnf = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
	static dnj = [ '日', '月', '火', '水', '木', '金', '土' ];
	static hn = [ 'AM', 'PM' ];
	static hns = [ 'am', 'pm' ];
	static hnj = [ '午前', '午後' ];
	
	constructor(date) {
		
		super(), this.date = date instanceof Date ? date : new Date(...arguments);
		
	}
	
	get(unit, at, parent) {
		
		const { date } = this;
		
		switch (unit) {
			
			case 'y':
			return date.getUTCFullYear();
			case 'M':
			return date.getUTCMonth() + 1;
			case 'd':
			return date.getUTCDate();
			
			case 'dn':
			return GPXTime.dn[date.getUTCDay()];
			case 'dnf':
			return GPXTime.dnf[date.getUTCDay()];
			case 'dnj':
			return GPXTime.dnj[date.getUTCDay()];
			
			case 'hn':
			return GPXTime.hn[Math.round(date.getUTCHours() / 24)];
			case 'hns':
			return GPXTime.hns[Math.round(date.getUTCHours() / 24)];
			case 'hnj':
			return GPXTime.hnj[Math.round(date.getUTCHours() / 24)];
			
			case 'h':
			return date.getUTCHours();
			case 'h12':
			return date.getHours() - (12 * parseInt(date.getUTCHours() / 12));
			case 'm':
			return date.getUTCMinutes();
			case 's':
			return date.getUTCSeconds();
			case 'ms':
			return date.getUTCMilliseconds();
			
			case 'gengo':
			return date.toLocaleString('ja-JP-u-ca-japanese', { year: 'numeric' });
			case 'tzo':
			return date.getTimezoneOffset();
			case 'iso':
			return date.toISOString();
			case 'utc':
			return date.toUTCString();
			case 'json':
			return date.toJSON();
			case 'str':
			return date.toString();
			
			default:
			return date.getTime();
			
		}
		
	}
	
	//[GPXData.$toJSON]() {
	//	
	//	const { constructor: { units } } = this, l = units.length, json = {};
	//	let i,k;
	//	
	//	i = -1;
	//	while (++i < l) json[k = units[i]] = typeof this.get(k);
	//	
	//	return json;
	//	
	//}
	
}
class GPXDate extends GPXTime {
	
	static [GPXData.$type] = 'local-date';
	
	constructor() {
		
		super(...arguments);
		
	}
	
	get(unit, at, parent) {
		
		const { date } = this;
		
		switch (unit) {
			
			case 'y':
			return date.getFullYear();
			case 'M':
			return date.getMonth() + 1;
			case 'd':
			return date.getDate();
			
			case 'dn':
			return GPXTime.dn[date.getDay()];
			case 'dnf':
			return GPXTime.dnf[date.getDay()];
			case 'dnj':
			return GPXTime.dnj[date.getDay()];
			
			case 'hn':
			return GPXTime.hn[Math.round(date.getHours() / 24)];
			case 'hns':
			return GPXTime.hns[Math.round(date.getHours() / 24)];
			case 'hnj':
			return GPXTime.hnj[Math.round(date.getHours() / 24)];
			
			case 'h':
			return date.getHours();
			case 'h12':
			return date.getHours() - (12 * parseInt(date.getHours() / 12));
			case 'm':
			return date.getMinutes();
			case 's':
			return date.getSeconds();
			case 'ms':
			return date.getMilliseconds();
			
			case 'gengo':
			return date.toLocaleString('ja-JP-u-ca-japanese', { year: 'numeric' });
			case 'tzo':
			return date.getTimezoneOffset();
			case 'iso':
			return date.toISOString();
			case 'utc':
			return date.toUTCString();
			case 'json':
			return date.toJSON();
			case 'str':
			return date.toString();
			
			default:
			return date.getTime();
			
		}
		
	}
	
}
//class GPXSpeed extends GPXData {
//	
//	static d = [ 'km', 'm', 'cm', 'mm' ];
//	static t = [ 'h', 'min', 's', 'ms' ];
//	
//	constructor(meter, ms) {
//		
//		super(), this.meter = meter, this.ms = ms;
//		
//	}
//	
//	get(unit = 'km/h', at, parent) {
//		
//		unit = unit.split('/');
//		
//		let num, den;
//		
//		num = this['get' + (GPXSpeed.d.indexOf(num = unit[0]) === -1 ? 'T' : 'D')](num),
//		den = this['get' + (GPXSpeed.d.indexOf(den = unit[1]) === -1 ? 'T' : 'D')](den);
//		
//		//v = ('' + (num / den)).split('.');
//		
//		//return v[0] + '.' + Math.round(parseInt(v[1].slice(0,3)) / 10);
//		return num / den;
//		
//	}
//	getD(v) {
//		
//		const { meter } = this;
//		
//		switch (v) {
//			
//			case 'km':
//			return meter / 1000;
//			case 'cm':
//			return meter * 100;
//			case 'mm':
//			//case 'mi':
//			return meter * 1000;
//			
//			default:
//			return meter;
//			
//		}
//		
//	}
//	getT(v) {
//		
//		const { ms } = this;
//		
//		switch (v) {
//			
//			case 'h':
//			return ms / 3600000;
//			case 'min':
//			return ms / 60000;
//			case 's':
//			return ms / 1000;
//			
//			default:
//			return ms;
//			
//		}
//		
//	}
//	
//	toJSON() {
//		
//		const { constructor: { d, t } } = this, dl = d.length, tl = t.length, json = { __type: 'speed' };
//		let i,i0, k;
//		
//		i = -1;
//		while (++i < dl) {
//			
//			i0 = -1;
//			while (++i0 < tl) json[k = d[i] + '/' + t[i0]] = typeof this.get(k);
//			
//		}
//		
//		i = -1;
//		while (++i < tl) {
//			
//			i0 = -1;
//			while (++i0 < dl) json[k = t[i] + '/' + d[i0]] = typeof this.get(k);
//			
//		}
//		
//		return json;
//		
//	}
//	
//}

class GPXSI extends GPXData {
	
	static [GPXData.$type] = 'SI';
	
	static $base = Symbol('GPXSI.base');
	static $basis = Symbol('GPXSI.basis');
	static $defaultIs = Symbol('GPXSI.defaultIs');
	static $exponent = Symbol('GPXSI.exponent');
	static $getUnit = Symbol('GPXSI.getUnit');
	static $is = Symbol('GPXSI.is');
	static $value = Symbol('GPXSI.value');
	
	constructor(value, is, defaultIs) {
		
		super(...arguments);
		
		const { constructor } = this, { $defaultIs, $is, $value } = constructor;
		
		this[$defaultIs] = defaultIs || constructor[GPXSI.$defaultIs],
		this[$is] = is,
		this[$value] = value;
		
	}
	
	get(unit, at, parent) {
		
		if (unit === 'raw') return this[GPXSI.$value];
		
		const	{ $base, $basis, $defaultIs, $is, $exponent, $getExponent, $value } = GPXSI,
				{ constructor } = this,
				exponent = constructor[$exponent],
				getExponent = constructor[$getExponent],
				basis = constructor[$basis],
				defaultIs = this[$defaultIs],
				is = this[$is];
		
		return	this[$value] /
						Math.pow(
										constructor[$base],
										(
											getExponent?.(unit, exponent, basis, defaultIs) ??
												exponent[unit.slice(0, -basis.length) || '_'] ??
													exponent[defaultIs] ?? 0
										) -
											(
												getExponent?.(is, exponent, defaultIs) ??
													(is === 'raw' ? 0 : exponent[is] ?? exponent[defaultIs] ?? 0)
											)
									);
		
	}
	
	hasUnit(unit) {
		
		const	{ $basis, $exponent } = GPXSI,
				{ constructor } = this,
				basis = constructor[$basis],
				basisLengthMinus = -basis.length;
		
		return basis === unit.slice(basisLengthMinus) && unit.slice(0, basisLengthMinus) in constructor[$exponent];
		
	}
	
	getExponentJSON(...args) {
		
		const	{ $basis, $exponent } = GPXSI,
				{ constructor } = this,
				basis = constructor[$basis],
				prefixes = Object.keys(constructor[$exponent]),
				l = prefixes.length,
				json = {};
		let i, k;
		
		i = -1;
		while (++i < l) json[k = prefixes[i] + basis] = typeof this.get(k, ...args);
		
		return json;
		
	}
	
	[GPXData.$toJSON]() {
		
		return this.getExponentJSON();
		
	}
	
	get base() {
		
		return this[GPXSI.$base];
		
	}
	set base(v) {
		
		this[GPXSI.$base] = v;
		
	}
	get basis() {
		
		return this.constructor[GPXSI.$basis];
		
	}
	get defaultIs() {
		
		return this[GPXSI.$defaultIs];
		
	}
	set defaultIs(v) {
		
		this[GPXSI.$defaultIs] = v;
		
	}
	get exponent() {
		
		return this.constructor[GPXSI.$exponent];
		
	}
	get is() {
		
		return this[$GPXSI.$is];
		
	}
	get value() {
		
		return this[GPXSI.$value];
		
	}
	set value(v) {
		
		this[GPXSI.$value] = v;
		
	}
	
}
GPXSI[GPXSI.$base] = 10,
GPXSI[GPXSI.$basis] = '',
GPXSI[GPXSI.$defaultIs] = 'raw',
GPXSI[GPXSI.$exponent] = { Q: 30, R: 27, Y: 24, Z: 21, E: 18, P: 15, T: 12, G: 9, M: 6, k: 3, h: 2, da: 1, _: 0, d: -1, c: -2, m: -3, µ: -6, n: -9, p: -12, f: -15, a: -18, z: -21, y: -24, r: -27, q: -30 };

class GPXSIDistance extends GPXSI {
	
	static [GPXData.$type] = 'distance';
	static [GPXSI.$basis] =	'm';
	static [GPXSI.$defaultIs] = '_';
	
	constructor(value, is, defaultIs) {
		
		super(...arguments);
		
	}
	
}
class GPXSIPascal extends GPXSI {
	
	static [GPXData.$type] = 'pascal';
	static [GPXSI.$basis] =	'Pa';
	static [GPXSI.$defaultIs] = '_';
	
	constructor(value, is, defaultIs) {
		
		super(...arguments);
		
	}
	
}
class GPXSpeed extends GPXData {
	
	static [GPXData.$type] = 'speed';
	
	static timeUnit =	{
								d: 86400000,
								h: 3600000,
								m: 60000,
								s: 1000,
								ms: 1
							};
	
	constructor(distanceValue, distanceIs, distanceDefaultIs, ...timeParams) {
		
		super();
		
		this.distance = new GPXSIDistance(distanceValue, distanceIs, distanceDefaultIs),
		this.time = new GPXTime(...timeParams);
		
	}
	
	get(unit = 'km/h', at, parent) {
		
		const	{ constructor: { timeUnit }, distance, time } = this,
				{ 0: numUnit, 1: denUnit } = unit.split('/'),
				isSpeed = distance.hasUnit(numUnit),
				distanceValue = distance.get(isSpeed ? numUnit : denUnit),
				timeValue = time.get() / (timeUnit?.[isSpeed ? denUnit : numUnit] ?? 1);
		
		return isSpeed ? distanceValue / timeValue : timeValue / distanceValue;
		
	}
	
	getUnitListJSON() {
		
		const	{ $basis, $exponent } = GPXSI,
				{ constructor: { timeUnit }, distance: { constructor: distanceConstructor }, time } = this,
				distanceBasis = distanceConstructor[$basis],
				distancePrefixes = Object.keys(distanceConstructor[$exponent]),
				distancePrefixesLength = distancePrefixes.length,
				timeUnits = Object.keys(timeUnit),
				timeUnitsLength = timeUnits.length,
				json = {};
		let i,i0, k;
		
		i = -1;
		while (++i < distancePrefixesLength) {
			
			i0 = -1;
			while (++i0 < timeUnitsLength)
				json[k = (distancePrefixes[i] += distanceBasis) + '/' + timeUnits[i0]] = typeof this.get(k);
			
		}
		
		i = -1;
		while (++i < timeUnitsLength) {
			
			i0 = -1;
			while (++i0 < distancePrefixesLength)
				json[k = timeUnitsLength[i] + '/' + distancePrefixes[i0]] = typeof this.get(k);
			
		}
		
		return json;
		
	}
	
}

//coco? 他にも 値関連のオブジェクトを Amedas 関連のオブジェクトに継承させる方法など
class GPXPercentage extends GPXData {
	
	static $value = Symbol('GPXPercentage.value');
	static unit = { percentage: [ '%', '100', 'p', 'percentage' ], ratio: [ '1', 'r', 'ratio' ] };
	
	constructor(value) {
		
		this.value = value;
		
	}
	
	get(unit, at, parent) {
		
		const { constructor: { unitList }, value } = this;
		let i,l, k;
		
		for (k in unitList) {
			
			i = -1
			
		}
		
		//return unit ? 
		
	}
	
	get value() {
		
		return Number.parseFloat(this[GPXPercentage.$value])
		
	}
	set value(v) {
		
		this[GPXPercentage.$value] = v;
		
	}
	
}
class GPXTemperature extends GPXData {
	
	static [GPXData.$unitList] =	{
												c: [ 'C', 'Celsius', 'c', 'celsius', '°C', '摂氏' ],
												f: [ 'F', 'Fahrenheit', 'f', 'fahrenheit', '°F', '華氏' ]
											};
	static [GPXData.$type] = 'temperature';
	
	constructor(value, is = 'c') {
		
		super(...arguments);
		
		this.value = value, this.is = is;
		
	}
	
	[GPXData.$get](unit, at, parent) {
		
		const { is: isRaw, value } = this;
		let is;
		
		unit = this.getFormalUnit(unit, is = isRaw[0].toLowerCase());
		
		switch (is) {
			
			case 'f':
			switch (unit) {
				
				case 'c':
				return (value - 32) / 1.8;
				
				default:
				return value;
				
			}
			
			case 'c': default:
			switch (unit) {
				
				case 'f':
				return value * 1.8 + 32;
				
				default:
				return value;
				
			}
			
		}
		
		
	}
	
}
class GPXLatLon extends GPXData {
	
	static [GPXData.$unitList] =	{
												degrees: [ 'd', 'deg', 'degrees' ],
												minutes: [ 'm', 'min', 'mins', 'minutes' ],
												seconds: [ 's', 'sec', 'secs', 'seconds' ],
												decimal: [ '10', 'dec', 'decimal' ]
											};
	
	static convertToDecimal(v, defaultDecimalDegrees = 0) {
		
		const { trunc } = Math, { isNaN, parseFloat } = Number;
		let v0,v1;
		
		return	Array.isArray(v) ?
						!isNaN(v0 = parseFloat(v[0])) && !isNaN(v1 = parseFloat(v[1])) ?
							v0 + (v0 = trunc(v1)) / 60 + (v1 - v0) / 60 / 60 : defaultDecimalDegrees :
						isNaN(v = parseFloat(v)) ?
							defaultDecimalDegrees : v;
		
	}
	
	// 10 進法で記された経緯度を度分秒に変換する。
	// 戻り値は [ 度, 分.秒 ] 形式で、各要素はそれぞれ number で指定される。
	// 第一引数に number などのリテラル値を指定した場合、それは 10 進法表記の経緯度として number に変換される。
	// 変換に失敗すると defaultDecimalDegrees に指定された値が使われる。
	// Array を指定した場合、length が 0 であれば、defaultDecimalDegrees が 0 番目の要素に指定される。
	// length が 1 の場合、その要素を 10 進法表記の経緯度として、度分秒に変換される。
	// length が 2 の場合、それはそのまま度分秒の経緯度として戻り値になる。
	// length が 2 より大きい場合、1 番目以降の要素は切り捨てられて、そのまま度分秒の経緯度として戻り値になる。
	// 引数の Array は変更されず、そのコピーに対して変更が行なわれ、またそれが戻り値になる。
	static convertToDMS(v, defaultDecimalDegrees = 0) {
		
		const { trunc } = Math, { isNaN, parseFloat } = Number;
		let l, v0,v1;
		
		v = Array.isArray(v) ? [ ...v ] : [ isNaN(v = parseFloat(v)) ? defaultDecimalDegrees : v ];
		
		(l = v.length) || (v[0] = defaultDecimalDegrees, ++l),
		l > 2 && v.splice(l = 2),
		l === 2 &&	(
							!isNaN(v0 = parseFloat(v0 = v[0])) || !isNaN(v1 = parseFloat(v[1])) ?
								(v[0] = v0, v[1] = v1) : (v[0] = defaultDecimalDegrees, v.pop(), --l)
						);
		
		if (l === 1) {
			
			isNaN(v1 = parseFloat(v[0])) && (v[0] = defaultDecimalDegrees),
			
			v[1] = v1 = trunc(v0 = (v1 - (v[0] = v0 = trunc(v1))) * 60),
			
			v0 = (v0 - v1) * 60;
			while ((v0 /= 10) > 1);
			
			v[1] += v0;
			
		}
		
		return v;
		
	}
	
	constructor(value) {
		
		this.value = value;
		
	}
	
	get(unit, at, parent) {
		
		const { constructor: { unit: unitList } } = this;
		let k;
		
		unit = (''+unit).toLowerCase().trim();
		for (k in unitList) if (unitList[k].indexOf(unit) !== -1) return this[k];
		
		return this.decimal;
		
	}
	
	get decimal() {
		
		return LatLon.convertToDecimal(this?.[LatLon.$value]);
		
	}
	get degrees() {
		
		return this.dms[0];
		
	}
	get dms() {
		
		return LatLon.convertToDMS(this?.[LatLon.$value]);
		
	}
	get minutes() {
		
		return parseInt((''+this.dms[1]).split('.')[0]);
		
	}
	get seconds() {
		
		return parseInt((''+this.dms[1]).split('.')[1]);
		
	}
	set value(v) {
		
		this[LatLon.$value] = v;
		
	}
	
}

class GPXArray extends GPXData {
	
	constructor(array, elementType, objectMap) {
		
		super(), this.array = array, this.elementType = elementType, this.objectMap = objectMap;
		
	}
	
	async get(unit, index, key, parent) {
		
		const { elementType, objectMap, array } = this;
		
		return await new elementType
							(
								array	[
											(index = ''+index)[index.length - 1] === '%' ?
												Math.round(Math.max(0, array.length - 1) * parseFloat(index.slice(0,-1)) / 100) :
												parseInt(index)
										],
								objectMap
							)?.get?.(unit, key, array);
		
	}
	
	toJSON() {
		
		const	{ elementType, objectMap, array } = this;
		
		return	{
						__type: 'array',
						__length: array.length,
						...new elementType(array[0], objectMap).toJSON()
					};
		
	}
	
}
class GPXObject extends GPXData {
	
	constructor(object, map) {
		
		super(), this.object = object, this.map = map;
		
	}
	
	async get(unit, at, parent) {
		
		const { map, object } = this, dataType = GPXData.isPrototypeOf(map) ? map : map?.[at], v = object[at];
		
		Array.isArray(unit) || (unit = [ unit ]);
		
		return await	(
								GPXData.isPrototypeOf(dataType) ?	new dataType(v)?.get?.(...unit, object) :
																				v instanceof GPXData ? v.get(...unit) : v
							);
		
	}
	
	toJSON() {
		
		const { object, map } = this, json = { __type: 'object' };
		let k,v;
		
		if (GPXData.isPrototypeOf(map)) {
			
			for (k in object) json[k] = new map(object[k]).toJSON();
			
		} else {
			
			for (k in object)	json[k] =	GPXData.isPrototypeOf(v = map?.[k]) ?
														new v(object[k]).toJSON() :
														(v = object[k]) instanceof GPXData ?
															v.toJSON() : typeof v;
			
		}
		
		return json;
		
	}
	
}

class GPXAmedasPointValue extends GPXData {
	
	static $get = Symbol('GPXAmedasPointValue.get');
	static $value = Symbol('GPXAmedasPointValue.value');
	
	constructor(value, amedas) {
		
		super(...arguments);
		
		this.value = value[0], this.aqc = value[1], this.amedas = amedas;
		
	}
	
	get(unit, at, parent) {
		
		const { amedas, aqc, constructor: { $get }, value } = this;
		
		//Array.isArray(unit) || (unit = [ unit ]);
		
		return	unit.toLowerCase() === 'aqc' ?	at === 'raw' ? aqc : amedas.AQC[aqc][at || 'ja-JP'] :
																this?.[$get]?.(unit, at, parent) ?? value;
		
	}
	
	// このオブジェクトおよびこのオブジェクトを継承するインスタンスは動的に生成されることが前提であるため、toJSON は実装されない。
	
}
class GPXAmedasDirection16 extends GPXAmedasPointValue {
	
	constructor() {
		
		super(...arguments);
		
	}
	
	[GPXAmedasPointValue.$get](unit, at, parent) {
		
		const { amedas, value } = this;
		
		return unit === 'raw' ? value : amedas.directions?.[value]?.[unit || 'en-US-short'] ?? value;
		
	}
	
}
class GPXAmedasPascal extends GPXAmedasPointValue {
	
	constructor(value, amedas, as = 'h') {
		
		super(value, amedas);
		
		this.as = as;
		
	}
	
	[GPXAmedasPointValue.$get](unit, at, parent) {
		
		const { pow } = Math, { amedas: { Pa }, as, value } = this;
		
		return unit === 'raw' ?	value :
										value / pow(10, Pa[as[0] in Pa ? as[0] : 'h']) * pow(10, Pa[unit[0] in Pa ? unit[0] : 'h']);
		
	}
	
}
class GPXAmedas extends GPXData {
	
	static data =	[
							{
								object: GPXAmedasDirection16,
								targets: [ 'gustDirection' ]
							},
							{
								object: GPXSIPascal,
								targets: [ 'normalPressure', 'pressure' ]
							},
							{
								object: GPXTemperature,
								targets: [ 'maxTemp', 'minTemp', 'temp' ]
							},
							{
								object: GPXAmedasPointValue,
								targets: [ 'humidity' ]
							},
							{
								object: GPXDate,
								targets: [ 'gustTime', 'maxTempTime', 'minTempTime' ]
							},
							{
								object: GPXSIDistance,
								targets: { 'mm': [ 'precipitation10m', 'precipitation1h', 'precipitation24h', 'precipitation3h' ], 'cm': [ 'snow', 'snow12h', 'snow1h', 'snow24h', 'snow6h' ] },
							},
							{
								object: GPXTime,
								targets: [ 'sun10m', 'sun1h' ],
							},
							{
								object: GPXSpeed,
								targets: { 'm/s': [ 'gust' ] },
							}
						];
	
	constructor(amedas) {
		
		super(...arguments), this.amedas = amedas;
		
	}
	
	async get(unit, at, parent) {
		
		const	{ isArray } = Array,
				{ amedas } = this,
				{ latestTimeReplaceArgs } = amedas,
				timeRx = latestTimeReplaceArgs[0],
				{ lat, lon, time } = parent
				response = await amedas.fetchPoint(lat, lon, time),
				{ point } = response,
				pointKeys = Object.keys(point).sotr(),
				pointLength = pointKeys.length,
				points = [];
		let i,i0,l0, day;
		
		i = -1;
		while (++i < pointLength) {
			
			i0 = 0, l0 = (dateParams = timeRx.match(k = pointKeys[i])).length;
			while (++i0 < l0) dateParams[i] = parseInt(dateParams[i]);
			
			day = new Date(...dateParams.slice(0, 3)),
			
			p = points[i] =	{ ...(p = point[k]) };
			
			for (k in p) {
				
				if (isArray(v = p[k])) {
					
					p[k] = new GPXAmedasPointValue(v, amedas);
					
				} else if (v && typeof v === 'object') {
					
					day.setHours(v.hour),
					day.setMinutes(v.minute),
					p[k] = new GPXDate(day.getTime());
					
				} else {
					
					p[k] = v;
					
				}
				
			}
			
			p.date = new GPXDate(...dateParams);
			
		}
		
		
	}
	
}
class LatLon {
	
	static $value = Symbol('LatLon.value');
	
	static convertToDecimal(v, defaultDecimalDegrees = 0) {
		
		const { trunc } = Math, { isNaN, parseFloat } = Number;
		let v0,v1;
		
		return	Array.isArray(v) ?
						!isNaN(v0 = parseFloat(v[0])) && !isNaN(v1 = parseFloat(v[1])) ?
							v0 + (v0 = trunc(v1)) / 60 + (v1 - v0) / 60 / 60 : defaultDecimalDegrees :
						isNaN(v = parseFloat(v)) ?
							defaultDecimalDegrees : v;
		
	}
	
	// 10 進法で記された経緯度を度分秒に変換する。
	// 戻り値は [ 度, 分.秒 ] 形式で、各要素はそれぞれ number で指定される。
	// 第一引数に number などのリテラル値を指定した場合、それは 10 進法表記の経緯度として number に変換される。
	// 変換に失敗すると defaultDecimalDegrees に指定された値が使われる。
	// Array を指定した場合、length が 0 であれば、defaultDecimalDegrees が 0 番目の要素に指定される。
	// length が 1 の場合、その要素を 10 進法表記の経緯度として、度分秒に変換される。
	// length が 2 の場合、それはそのまま度分秒の経緯度として戻り値になる。
	// length が 2 より大きい場合、1 番目以降の要素は切り捨てられて、そのまま度分秒の経緯度として戻り値になる。
	// 引数の Array は変更されず、そのコピーに対して変更が行なわれ、またそれが戻り値になる。
	static convertToDMS(v, defaultDecimalDegrees = 0) {
		
		const { trunc } = Math, { isNaN, parseFloat } = Number;
		let l, v0,v1;
		
		v = Array.isArray(v) ? [ ...v ] : [ isNaN(v = parseFloat(v)) ? defaultDecimalDegrees : v ];
		
		(l = v.length) || (v[0] = defaultDecimalDegrees, ++l),
		l > 2 && v.splice(l = 2),
		l === 2 &&	(
							!isNaN(v0 = parseFloat(v0 = v[0])) || !isNaN(v1 = parseFloat(v[1])) ?
								(v[0] = v0, v[1] = v1) : (v[0] = defaultDecimalDegrees, v.pop(), --l)
						);
		
		if (l === 1) {
			
			isNaN(v1 = parseFloat(v[0])) && (v[0] = defaultDecimalDegrees),
			
			v[1] = v1 = trunc(v0 = (v1 - (v[0] = v0 = trunc(v1))) * 60),
			
			v0 = (v0 - v1) * 60;
			while ((v0 /= 10) > 1);
			
			v[1] += v0;
			
		}
		
		return v;
		
	}
	
	constructor(value) {
		
		this.value = value;
		
	}
	
	get decimal() {
		
		return LatLon.convertToDecimal(this?.[LatLon.$value]);
		
	}
	get dms() {
		
		return LatLon.convertToDMS(this?.[LatLon.$value]);
		
	}
	set value(v) {
		
		this[LatLon.$value] = v;
		
	}
	
}