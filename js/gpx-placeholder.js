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
		
		data['distance-cumul'] = new GPXArray(cumul, GPXDistance),
		
		data['distance-total'] = new GPXDistance(distance.total),
		
		firstPoint = points[0],
		lastPoint = points[points.length - 1],
		
		data.duration = new GPXTime(new Date((lastPoint?.time.getTime?.() ?? 0) - (firstPoint?.time.getTime?.() ?? 0))),
		
		data.elevation = new GPXObject(elevation, GPXDistance),
		
		data.speed = { avg: new GPXSpeed(distance.total, data.duration.get()) },
		
		i = -1, maxSpeed = 0;
		while (++i < cumulLength)	(p = points[i]).speed = new GPXSpeed(
													p.distance = cumul[i] - cumul[i ? i - 1 : i],
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
														distance: GPXDistance,
														duration: GPXTime,
														ele: GPXDistance,
														time: GPXTime
													}
												);
		
		data.slopes = new GPXArray(slopes, GPXDistance);
		
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
	/*static order(indices, source, defaultValue = raw) {
		
		const	parsed = GPXPlaceholder.parseIndices(indices, source, defaultValue),
				parsedLength = parsed.length,
				ordered = [];
		let i;
		hi(parsed);
		i = -1;
		while (++i < parsedLength) ordered[i] = source[parsed[i]];
		
		return ordered;
		
	}
	static isInt32(index) {
		
		return Number.isInteger(index) && index < 32**2;
		
	}
	static parseIndices(raw, cap = 32**2-1, defaultValue = raw) {
		
		const	{ isArray } = Array,
				{ isInt32 } = GPXPlaceholder,
				indices = isArray(raw) ? [ ...raw ] : [ defaultValue ], indicesLength = indices.length;
		let i;
		
		if (!(isArray(cap) ? (cap = cap.length) : isInt32(cap)) || cap < 1) {
			
			return [];
			
		} else if (indicesLength < 2 && !isInt32(indices[0])) {
			
			i = -1, indices.length = 0;
			while (++i < cap) indices[i] = i;
			
		} else {
			
			const { max } = Math, lastIndicesIndex = indicesLength - 1, lastIndex = cap - 1, numbers = [];
			let l,i0,i1,i2, idx,idx0, first,firstRangeIndex, last,lastRangeIndex;
			
			i = -1, lastRangeIndex = (l = indicesLength) - 1, first = firstRangeIndex = 0;
			while (++i < l) {
				
				if (isInt32(idx = indices[i])) {
					
					first = indices[firstRangeIndex = i] = idx < 0 ? max(cap + idx, 0) : idx > lastIndex ? lastIndex : idx;
					
				} else {
					
					i0 = i;
					while (++i0 < indicesLength && !isInt32(indices[i0]));
					
					isInt32(idx0 = indices[lastRangeIndex = i0]) &&
						(last = idx0 < 0 ? max(cap + idx0, 0) : idx0 > lastIndex ? lastIndex : idx0),
					
					i1 = first, i2 = -1, numbers.length = 0;
					
					if (first <= last) {
						
						while (++i1 <= last) numbers[++i2] = i1;
						
					} else {
						
						while (--i1 >= last) numbers[++i2] = i1;
						
					}
					hi(indices,i,first, last,numbers, lastRangeIndex, firstRangeIndex, lastRangeIndex - firstRangeIndex);
					indices.splice(i, lastRangeIndex - firstRangeIndex, ...numbers),
					firstRangeIndex = i += (i1 = numbers.length - 2), l += i1;
					
				}
				
			}
			
		}
		
		return indices;
		
	}*/
	//static parseIndex(idx, min = 0, max = 0) {
	//	
	//	return Number.isNaN(idx = parseInt(idx)) || idx < min ? min : idx > max ? max : idx;
	//	
	//}
	
	constructor(str, xml, extension, ...args) {
		
		super(str, ...args),
		
		this.extension = extension,
		
		this.gpx = new gpxParser(),
		
		this.xDOMParser = new DOMParser(),
		this.xSerializer = new XMLSerializer(),
		
		this.setXml(xml);
		
	}
	
	parse() {
		
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
							v = gpx.parse();
							
						} else {
							
							(v = (trk = trks[i0])[trkLabel]) &&
							typeof v === 'object' &&
							(v = trkArgs ? v.get(...trkArgs) : v.get());
							
						}
						
						if (v !== undefined) {
							
							i1 = recursive ? -1 : 0;
							while (++i1 < paramsLength) {
								
								if (extension.hasOwnProperty((param = params[i1]).label)) {
									
									if (typeof (ext = extension[param.label]) === 'function') {
										
										if (isArray(args = param.args)) {
											
											i2 = -1, argsLength = args.length;
											while (++i2 < argsLength && !(args[i2] instanceof Error));
											i2 === argsLength && (v = ext(v, ...args));
											
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
	
	parse_() {
		
		const	{ isArray } = Array,
				{ gpx: { tracks: { 0: track = {} } }, extension } = this,
				parsed = this[MicroParser.$parse](),
				parsedLength = parsed.length;
		let i,i0,l0,i1,l1, p, result, target,targetArgs, v, name, ext,args;
		hi(parsed);
		i = -1, result = '';
		while (++i < parsedLength) {
			
			if (isArray(p = parsed[i]) && typeof (target = p[0]) === 'object' && (v = track[target.label]) !== undefined) {
				
				typeof v === 'object' && (v = (targetArgs = target.args) ? v.get(...targetArgs) : v.get()),
				
				i0 = 0, l0 = p.length;
				while (++i0 < l0) {
					
					if (typeof (ext = extension?.[(target = p[i0]).label]) === 'function') {
						
						if (isArray(args = target.args)) {
							
							i1 = -1, l1 = args.length;
							while (++i1 < l1 && !(args[i1] instanceof Error));
							i1 === l1 && (v = ext(v, ...args));
							
						} else v = ext(v);
						
					}
					
				}
				
				p = v;
				
			}
			
			result += ''+(p && typeof p === 'object' ? '' : p);
			
		}
		
		return result;
		
	}
	
	setXml(xml) {
		
		try {
			
			(this.gpx = new gpxParser()).parse(xml), this[GPXPlaceholder.$xml] = xml;
			
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
	
	constructor() {}
	
	toJSON() {
		
		return { __type: 'basement' };
		
	}
	
}
class GPXTime extends GPXData {
	
	static type = 'utc-date';
	static units =	[
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
		
		super(), this.date = date instanceof Date ? date : new Date(date);
		
	}
	
	get(unit, at) {
		
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
	
	toJSON() {
		
		const { constructor: { type, units } } = this, l = units.length, json = { __type: type };
		let i,k;
		
		i = -1;
		while (++i < l) json[k = units[i]] = typeof this.get(k);
		
		return json;
		
	}
	
}
class GPXDate extends GPXTime {
	
	static type = 'local-date';
	
	constructor() {
		
		super(...arguments);
		
	}
	
	get(unit, at) {
		
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
class GPXSpeed extends GPXData {
	
	static d = [ 'km', 'm', 'cm', 'mi' ];
	static t = [ 'h', 'min', 's', 'ms' ];
	
	constructor(meter, ms) {
		
		super(), this.meter = meter, this.ms = ms;
		
	}
	
	get(unit = 'km/h', at) {
		
		unit = unit.split('/');
		
		let num, den;
		
		num = this['get' + (GPXSpeed.d.indexOf(num = unit[0]) === -1 ? 'T' : 'D')](num),
		den = this['get' + (GPXSpeed.d.indexOf(den = unit[1]) === -1 ? 'T' : 'D')](den);
		
		//v = ('' + (num / den)).split('.');
		
		//return v[0] + '.' + Math.round(parseInt(v[1].slice(0,3)) / 10);
		return num / den;
		
	}
	getD(v) {
		
		const { meter } = this;
		
		switch (v) {
			
			case 'km':
			return meter / 1000;
			case 'cm':
			return meter * 100;
			case 'mi':
			return meter * 1000;
			
			default:
			return meter;
			
		}
		
	}
	getT(v) {
		
		const { ms } = this;
		
		switch (v) {
			
			case 'h':
			return ms / 3600000;
			case 'min':
			return ms / 60000;
			case 's':
			return ms / 1000;
			
			default:
			return ms;
			
		}
		
	}
	
	toJSON() {
		
		const { constructor: { d, t } } = this, dl = d.length, tl = t.length, json = { __type: 'speed' };
		let i,i0, k;
		
		i = -1;
		while (++i < dl) {
			
			i0 = -1;
			while (++i0 < tl) json[k = d[i] + '/' + t[i0]] = typeof this.get(k);
			
		}
		
		i = -1;
		while (++i < tl) {
			
			i0 = -1;
			while (++i0 < dl) json[k = t[i] + '/' + d[i0]] = typeof this.get(k);
			
		}
		
		return json;
		
	}
	
}
class GPXDistance extends GPXData {
	
	static units = [ 'km', 'cm', 'mi', '__default' ];
	
	constructor(meter) {
		
		super(), this.meter = meter;
		
	}
	
	get(unit, at) {
		
		const { meter } = this;
		
		switch (unit) {
			 case 'km':
			 return meter / 1000;
			 case 'cm':
			 return meter * 100;
			 case 'mi':
			 return meter * 1000;
			 default:
			 return meter;
		}
		
	}
	
	toJSON() {
		
		const { constructor: { units } } = this, l = units.length, json = { __type: 'distance' };
		let i, k;
		
		i = -1;
		while (++i < l) json[k = units[i]] = typeof this.get(k);
		
		return json;
		
	}
	
}
class GPXArray extends GPXData {
	
	constructor(array, elementType, objectMap) {
		
		super(), this.array = array, this.elementType = elementType, this.objectMap = objectMap;
		
	}
	
	get(unit, index, key) {
		
		const { elementType, objectMap, array } = this,
				v = new elementType
						(
							array	[
										(index = ''+index)[index.length - 1] === '%' ?
											Math.round(Math.max(0, array.length - 1) * parseFloat(index.slice(0,-1)) / 100) :
											parseInt(index)
									],
							objectMap
						)?.get?.(unit, key);
		
		return v;
		
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
	
	get(unit, at) {
		
		const { map, object } = this, dataType = GPXData.isPrototypeOf(map) ? map : map?.[at], v = object[at];
		
		return GPXData.isPrototypeOf(dataType) ? new dataType(v)?.get?.(unit) : v instanceof GPXData ? v.get(unit) : v;
		
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