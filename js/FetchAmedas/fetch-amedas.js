class AmedasFetcher {
	
	// AQC = 自動品質管理(Auto Quality Controll?)
	static AQC =	[
							{ emoji: '✅', 'ja-JP': '正常' },
							{ emoji: '❓', 'ja-JP': '準正常（やや疑わしい）' },
							{ emoji: '⚠️', 'ja-JP': '非常に疑わしい' },
							{ emoji: '❌', 'ja-JP': '利用に適さない' },
							{ emoji: '💔', 'ja-JP': '観測値は期間内で資料数が不足している' },
							{ emoji: '🚧', 'ja-JP': '点検又は計画休止のため欠測' },
							{ emoji: '🚫', 'ja-JP': '障害のため欠測' },
							{ emoji: '⛔️', 'ja-JP': 'この要素の観測はしていない' }
						];
	static directions =	[
									{ emoji: '⬆️', 'en-US': 'North', 'en-US-short': 'N', 'ja-JP': '北' },
									{ emoji: '⬆️↗️', 'en-US': 'North-northeast', 'en-US-short': 'NNE', 'ja-JP': '北北東' },
									{ emoji: '↗️', 'en-US': 'Northeast', 'en-US-short': 'NE', 'ja-JP': '北東' },
									{ emoji: '➡️↗️', 'en-US': 'East-northeast', 'en-US-short': 'ENE', 'ja-JP': '東北東' },
									{ emoji: '➡️', 'en-US': 'East', 'en-US-short': 'E', 'ja-JP': '東' },
									{ emoji: '➡️↘️', 'en-US': 'East-southeast', 'en-US-short': 'ESE', 'ja-JP': '東南東' },
									{ emoji: '↘️', 'en-US': 'Southeast', 'en-US-short': 'SE', 'ja-JP': '南東' },
									{ emoji: '⬇️↘️', 'en-US': 'South-southeast', 'en-US-short': 'SSE', 'ja-JP': '南南東' },
									{ emoji: '⬇️', 'en-US': 'South', 'en-US-short': 'S', 'ja-JP': '南' },
									{ emoji: '⬇️↙️', 'en-US': 'South-southwest', 'en-US-short': 'SSW', 'ja-JP': '南南西' },
									{ emoji: '↙️', 'en-US': 'Southwest', 'en-US-short': 'SW', 'ja-JP': '南西' },
									{ emoji: '⬅️↙️', 'en-US': 'West-southwest', 'en-US-short': 'WSW', 'ja-JP': '西南西' },
									{ emoji: '⬅️', 'en-US': 'West', 'en-US-short': 'W', 'ja-JP': '西' },
									{ emoji: '⬅️↖️', 'en-US': 'West-northwest', 'en-US-short': 'WNW', 'ja-JP': '西北西' },
									{ emoji: '↖️', 'en-US': 'Northwest', 'en-US-short': 'NW', 'ja-JP': '北西' },
									{ emoji: '⬆️↖️', 'en-US': 'North-northwest', 'en-US-short': 'NNW', 'ja-JP': '北北西' }
								];
	
	static Pa =	{
						Q: 30,
						R: 27,
						Y: 24,
						Z: 21,
						E: 18,
						P: 15,
						T: 12,
						G: 9,
						M: 6,
						k: 3,
						h: 2,
						da: 1,
						_: 0,
						d: -1,
						c: -2,
						m: -3,
						µ: -6,
						n: -9,
						p: -12,
						f: -15,
						a: -18,
						z: -21,
						y: -24,
						r: -27,
						q: -30
					};
	static weather =	[
								{ emoji: '☀️', 'en-US': { default: 'Sunny' }, 'ja-JP': { default: '晴', formal: '晴れ' } },
								{ emoji: '☁️', 'en-US': { default: 'Cloudy' }, 'ja-JP': { default: '曇', formal: '曇り' } },
								{ emoji: '💨', 'en-US': { default: 'Haze' }, 'ja-JP': { default: '煙霧' } },
								{ emoji: '🌫', 'en-US': { default: 'Fog' }, 'ja-JP': { default: '霧' } },
								{ emoji: '🌂', 'en-US': { default: 'Drizzle' }, 'ja-JP': { default: '霧雨' } },
								{ emoji: '☔️', 'en-US': { default: 'Shower' }, 'ja-JP': { default: 'しゅう雨または止み間のある雨', formal: 'にわか雨' } },
								{ emoji: '💦', 'en-US': { default: 'Precipitation' }, 'ja-JP': { default: '降水' } },
								{ emoji: '🌧', 'en-US': { default: 'Rain' }, 'ja-JP': { default: '雨' } },
								{ emoji: '❄️💧', 'en-US': { default: 'Rain and snow mixed' }, 'ja-JP': { default: 'みぞれ' } },
								{ emoji: '☃️', 'en-US': { default: 'Snow' }, 'ja-JP': { default: '雪' } },
								{ emoji: '❄️🌧', 'en-US': { default: 'Freezing rain' }, 'ja-JP': { default: '着氷性の雨', formal: '雨氷' } },
								{ emoji: '❄️🌂', 'en-US': { default: 'Atmospheric icing' }, 'ja-JP': { default: '着氷性の霧雨' } },
								{ emoji: '❄️☔️', 'en-US': { default: 'Ice pellets' }, 'ja-JP': { default: '凍雨' } },
								{ emoji: '❄️🌫', 'en-US': { default: 'Snow grains' }, 'ja-JP': { default: '霧雪' } },
								{ emoji: '🌨☔️', 'en-US': { default: 'Snow shower' }, 'ja-JP': { default: 'しゅう雪または止み間のある雪' } },
								{ emoji: '❄️💦', 'en-US': { default: 'Hail' }, 'ja-JP': { default: 'ひょう' } },
								{ emoji: '🌫', 'en-US': { default: 'Mist' }, 'ja-JP': { default: 'もや' } },
								{ emoji: '❄️', 'en-US': { default: 'Diamond dust' }, 'ja-JP': { default: '細氷' } },
								{ emoji: '⚡️', 'en-US': { default: 'Lightning' }, 'ja-JP': { default: '雷' } }
							];
	static latestTimeReplaceArgs = [ /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\+\d{2}:\d{2}$/, '$1$2$3$4$5$6' ];
	static url =	{
							latestTime: 'https://www.jma.go.jp/bosai/amedas/data/latest_time.txt',
							map: 'https://www.jma.go.jp/bosai/amedas/data/map/',
							point: 'https://www.jma.go.jp/bosai/amedas/data/point/',
							table: 'https://www.jma.go.jp/bosai/amedas/const/amedastable.json'
						};
	
	//DD = Decimal Degrees
	static convertToDD(v) {
		
		return v[0] + parseInt(v = (''+v[1]).split('.')[0]) / 60 + parseInt(v?.[1] ?? 0) / 3600;
		
	}
	static convertToAvailableHours(hours, method) {
		
		method === 'ceil' || method === 'round' || (method = 'floor');
		
		const	{ floor, max, min } = Math, { isNaN, parseInt } = Number,
				fixedHours = floor((isNaN(hours = parseInt(hours)) ? 0 : hours) / 3) * 3;
		
		return min(max(fixedHours + 3 * Math[method]((hours - fixedHours) / 3), 0), 24);
		
	}
	static getDate(yearOrDate, ...args) {
		
		return	yearOrDate instanceof Date ? yearOrDate :
						arguments.length === 1 || typeof yearOrTimeStr === 'string' ?
							new Date(yearOrDate) : new Date(yearOrDate, ...args);
		
	}
	static convertToPointDate() {
		
		const { convertToAvailableHours, getDate } = AmedasFetcher, date = getDate(...arguments);
		
		date.setHours(convertToAvailableHours(date.getHours())),
		date.setMinutes(0),
		date.setSeconds(0),
		date.setMilliseconds(0);
		
		return date;
		
	}
	
	static async fetch(url, responsed = AmedasFetcher.toText) {
		
		let result;
		
		await fetch(url).then(responsed).then(v => (result = v)).catch(error => (console.info(error), result = error));
		
		return result;
		
	}
	// dateParams には yearOrTimeStr, month, date, hours の順で
	// オブジェクト Date のコンストラクターに与える引数と同じ引数を与える。（そのため、month が一月を示す場合、指定する値は 1 ではなく 0 になる）
	static async fetchPoint(lat, lon, ...dateParams) {
		
		const { convertToPointDate, fetchJMALatestTime } = AmedasFetcher;
		
		const	latestDate = convertToPointDate(await fetchJMALatestTime()),
				specifiedDate = convertToPointDate(...dateParams);
		
		if (latestDate.getTime() < specifiedDate.getTime()) return new TypeError();
		
		const { sqrt } = Math,
				{ convertToDD: toDD, fetchJMAAmedasPoint, fetchJMAAmedasTable } = AmedasFetcher,
				table = await fetchJMAAmedasTable();
		let k,v, station, distance, last, stnid;
		
		last = Infinity;
		for (k in table)
			last > (distance = sqrt((lat - toDD((v = table[k]).lat)) ** 2 + (lon - toDD(v.lon)) ** 2)) &&
				(last = distance, station = v, stnid = k),
			v.id = k;
		
		return { date: specifiedDate, point: await fetchJMAAmedasPoint(stnid, specifiedDate), station, table };
		
	}
	// dataParams の指定方法は fetchPoint と同様だが、このメソッドでは minutes まで指定できる。
	// ただし minutes に指定する分は 10 分単位でなければならない。仮に一桁目の分を指定した場合、切り捨てられる。
	static async fetchMap(lat, lon, ...dateParams) {
		
		let k,k0, v, last, distance, data, station, stnid;
		
		const	{ sqrt } = Math,
				{ convertToDD: toDD, getDate, fetchJMAAmedasTable, fetchJMALatestTime, fetchJMAAmedasMap } = AmedasFetcher,
				latestDate = new Date(await fetchJMALatestTime()),
				specifiedDate = getDate(...dateParams),
				date = latestDate.getTime() < specifiedDate.getTime() ? latestDate : specifiedDate,
				map = await fetchJMAAmedasMap(date),
				table = await fetchJMAAmedasTable();
		
		last = Infinity;
		for (k in map) {
			
			for (k0 in table) {
				
				if (k === k0) {
					
					last > (distance = sqrt((lat - toDD((v = table[k0]).lat)) ** 2 + (lon - toDD(v.lon)) ** 2)) &&
						(last = distance, data = map[k], station = v),
					v.id = k0;
					
					break;
					
				}
				
			}
			
		}
		
		return { data, date, map, station, table };
		
	}
	static async fetchJMAAmedasTable() {
		
		const { fetch, toJSON, url: { table } } = AmedasFetcher;
		
		return await fetch(table, toJSON);
		
	}
	static async fetchJMALatestTime() {
		
		const { fetch, url: { latestTime } } = AmedasFetcher;
		
		return await fetch(latestTime);
		
	}
	static async fetchJMAAmedasPoint(stnid, date) {
		
		if (!(date instanceof Date)) return new TypeError();
		
		const { fetch, toJSON, url: { point } } = AmedasFetcher;
		
		return await fetch	(
										point + stnid + '/' +
										date.getFullYear() +
										(''+(date.getMonth() + 1)).padStart(2, '0') +
										(''+date.getDate()).padStart(2, '0') + '_' +
										(''+date.getHours()).padStart(2, '0') + '.json',
										toJSON
									);
		
	}
	static async fetchJMAAmedasMap(...dateParams) {
		
		const { fetch, toJSON, toMapDateString, url: { map } } = AmedasFetcher;
		
		return await fetch(map + toMapDateString(...dateParams) + '.json', toJSON);
		
	}
	
	static getEuclideanDistance(latFrom, lonFrom, latTo, lonTo) {
		
		return Math.sqrt((latFrom - latTo) ** 2 + (lonFrom - lonTo) ** 2);
		
	}
	
	static toJSON(response) {
		
		return response.json();
		
	}
	static toMapDateString(dateOrLatestTime) {
		
		const { getDate, latestTimeReplaceArgs } = AmedasFetcher;
		
		return	typeof dateOrLatestTime === 'string' && latestTimeReplaceArgs[0].test(dateOrLatestTime) ?
						dateOrLatestTime.replace(...latestTimeReplaceArgs) :
						(
							'' +
							(dateOrLatestTime = getDate(...arguments)).getFullYear() +
							(1 + dateOrLatestTime.getMonth() + '').padStart(2, '0') +
							(''+dateOrLatestTime.getDate()).padStart(2, '0') +
							(''+dateOrLatestTime.getHours()).padStart(2, '0') +
							(''+dateOrLatestTime.getMinutes()).padStart(2, '0')[0] + '000'
						);
		
	}
	static toText(response) {
		
		return response.text();
		
	}
	
}

AmedasFetcher.fetchPoint(34.668903, 133.906799, Date.now()).then(v => hi(v));
const data = await AmedasFetcher.fetchMap(34.668903, 133.906799, 2023,8,20,1,0);
let k,v;
hi(data);
//hi(data, v = [ 35.67 ], k = LatLon.convertToDMS(v), LatLon.convertToDecimal(k));
//const { map } = data;
//for (k in map) map[k].weather && (hi(map[k].station.kjName, map[k].weather));
//