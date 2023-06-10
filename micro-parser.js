class MicroCore {
	
	static $indices = Symbol('MicroCore.indices');
	static $str = Symbol('MicroCore.str');
	
	// オブジェクトのクローンを作成する。循環参照には非対応
	static clone(object) {
		
		if (!object || typeof object !== 'object') return object;
		
		const	{ isArray } = Array,
				{ clone, objectKeys } = MicroCore,
				keys = objectKeys(object),
				l = keys.length,
				cloned = isArray(object) ? [] : {};
		let i,k, o;
		
		i = -1;
		while (++i < l) cloned[k = keys[i]] = isArray(o = object[k]) || o.constructor === Object ? clone(o) : o;
		
		return cloned;
		
	}
	
	static cleanup(object) {
		
		if (object && typeof object === 'object') {
			
			const	{ isArray } = Array,
					{ cleanup, objectKeys } = MicroCore,
					keys = objectKeys(object),
					l = keys.length;
			let i,k, o;
			
			i = -1;
			while (++i < l) (isArray(o = object[k = keys[i]]) || o.constructor === Object) && cleanup(o), delete object[k];
			
			isArray(object) && (object.length = 0);
			
		}
		
	}
	
	static objectKeys(object) {
		
		return object?.constructor === Object ? [ ...Object.keys(object), ...Object.getOwnPropertySymbols(object) ] : [];
		
	}
	
	constructor(str) {
		
		this[MicroCore.$str] = str, this.structureCache();
		
	}
	
	structureCache() {
		
		const	{ getOwnPropertySymbols, getPrototypeOf, keys } = Object,
				{ cleanup, clone, objectKeys } = MicroCore,
				cache = {};
		let proto, protoCache;
		
		cleanup(cache), proto = this.constructor;
		
		do {
			
			if ((protoCache = proto.cache)?.constructor === Object) {
				
				const keys = objectKeys(protoCache), l = keys.length;
				let i,k;
				
				i = -1;
				while (++i < l) cache[k = keys[i]] = clone(protoCache[k]);
				
			}
			
		} while (proto = getPrototypeOf(proto));
		
		return this.cache = cache;
		
	}
	
	get str() {
		
		return this[MicroCore.$str];
		
	}
	set str(v) {
		
		this.structureCache(), this[MicroCore.$str] = v;
		
	}
	
}
MicroCore.cache = { [MicroCore.$indices]: [] };
class MicroEscaper extends MicroCore {
	
	static $esc = Symbol('MicroEscaper.esc');
	
	static cache = { [this.$esc]: [] };
	
	static esc = '\\';
	
	static restore(str, esc) {
		
		const escLength = esc.length;
		let fromIndex, foundIndex, restored, nextIndex;
		
		fromIndex = 0, restored = '';
		while ((foundIndex = str.indexOf(esc, fromIndex)) !== -1)
			str[nextIndex = foundIndex + escLength] === esc ?
				(restored += str.substring(fromIndex, nextIndex), fromIndex = foundIndex + escLength * 2) :
				(restored += str.substring(fromIndex, foundIndex), fromIndex = nextIndex);
		
		return restored += str.substring(fromIndex);
		
	}
	
	constructor(str, esc) {
		
		super(str),
		
		this[MicroEscaper.$esc] = esc || this.constructor.esc;
		
	}
	
	escape(chr = this.constructor.esc, fromIndex = 0, toIndex, includes) {
		
		const	{ $esc } = MicroEscaper, { cache } = this, cached = cache[$esc], cachedLength = cached.length;
		let i,i0, indices, startIndex, index;
		
		if (cachedLength) {
			
			i = -1;
			while (++i < cachedLength && cached[i].$ !== chr);
			i === cachedLength || (indices = cached[i][includes ? 'included' : 'excluded']);
			
		}
		
		if (!indices) {
			
			const	{ sort } = MicroEscaper,
					{ esc, str } = this,
					escLength = esc.length,
					escMode = esc === chr,
					included = [],
					excluded = [];
			let currentIndex, escIndex, chrIndex, escaped;
			
			if (chr instanceof RegExp) {
				
				i = i0 = -1;
				for (const matched of str.matchAll(chr)) {
					
					chrIndex = escIndex = matched.index;
					while ((escIndex -= escLength) > -1 && str.substr(escIndex, escLength) === esc);
					
					(escaped = !!((chrIndex - (escIndex += escLength)) % 2)),
					
					included[++i] =	{
												chr: matched[0],
												chrIndex,
												end: chrIndex + matched[0].length,
												esc,
												escaped,
												executor: this,
												matched,
												start: escIndex,
												target: chr
											},
					escaped || (excluded[++i0] = included[i]);
					
				}
				
			} else {
				
				const chrLength = chr.length, findMethod = escMode ? 'lastIndexOf' : 'indexOf';
				
				i = i0 = -1, currentIndex = escMode ? str.length : 0, cached[cached.length] = { $: chr, included, excluded };
				while ((chrIndex = escIndex = str[findMethod](chr, currentIndex)) !== -1) {
					
					while ((escIndex -= escLength) > -1 && str.substr(escIndex, escLength) === esc);
					
					(escaped = !!((chrIndex - (escIndex += escLength)) % 2)),
					
					included[++i] =
						{ chr, end: chrIndex + chrLength, esc, escaped, executor: this, chrIndex, start: escIndex, target: chr },
					escaped || (excluded[++i0] = included[i]);
					
					if ((currentIndex = escMode ? --escIndex : chrIndex + chrLength) < 0 && escMode) break;
					
				}
				
				escMode && (included.reverse(), excluded.reverse());
				
			}
			
			indices = includes ? included : excluded;
			
		}
		
		const l = indices.length;
		
		i = i0 = -1, toIndex ??= Infinity, fromIndex > toIndex && (toIndex = fromIndex);
		while (++i < l && (index = indices[i]).end <= toIndex) startIndex ?? (fromIndex <= index.end && (startIndex = i));
		
		return indices.slice(startIndex, i);
		
	}
	
	get esc() {
		
		return this[MicroEscaper.$esc];
		
	}
	set esc(v) {
		
		const { $esc } = MicroEscaper;
		
		v === this[$esc] || (this.structureCache(), this[$esc] = v);
		
	}
	
}
class MicroEnclosure extends MicroEscaper {
	
	static $enc = Symbol('MicroEnclosure.enc');
	
	static cache = { [this.$enc]: [] };
	
	static enc = '"';
	
	constructor(str, enc) {
		
		super(str),
		
		this[MicroEnclosure.$enc] = enc || this.constructor.enc;
		
	}
	
	enclose() {
		
		const { $enc } = MicroEnclosure, { cache } = this, enclosed = cache[$enc];
		
		if (cache.enclosed) return enclosed;
		
		const	{ constructor: { enc } } = this, indices = this.escape(enc), l = indices.length;
		
		if (l % 2) throw new SyntaxError(`"" literal not terminated after column ${indices[l - 1].end}.`);
		
		let i,i0;
		
		i = -2, i0 = -1;
		while ((i += 2) < l) enclosed[++i0] = { l: indices[i], r: indices[i + 1] };
		
		cache.enclosed = true;
		
		return enclosed;
		
	}
	
	get enc() {
		
		return this[MicroEnclosure.$enc];
		
	}
	set enc(v) {
		
		const { $enc } = MicroEnclosure;
		
		v === this[$enc] || (this.structureCache(), this[$enc] = v);
		
	}
	
}
class MicroBracket extends MicroEscaper {
	
	static $L = Symbol('MicroBracket.L');
	static $R = Symbol('MicroBracket.R');
	
	static L = '{';
	static R = '}';
	
	constructor(str, L, R, esc) {
		
		super(str, esc);
		
		const { $L, $R } = MicroBracket, { constructor: { L: _L, R: _R } } = this;
		
		this[$L] = L || _L,
		this[$R] = R || _R;
		
	}
	
	get L() {
		
		return this[MicroBracket.$L];
		
	}
	set L(v) {
		
		const { $L } = MicroBracket;
		
		v === this[$L] || (this.structureCache(), this[$L] = v);
		
	}
	get R() {
		
		return this[MicroBracket.$R];
		
	}
	set R(v) {
		
		const { $R } = MicroBracket;
		
		v === this[$R] || (this.structureCache(), this[$R] = v);
		
	}
	
}
class MicroCapturer extends MicroBracket {
	
	// このオブジェクトのインスタンスのメソッド capture の戻り値を、その値に基づいてネスト構造にする。
	// ネスト先へは、各インデックスを示すオブジェクトのプロパティ nest から辿れる。
	static structure(indices) {
		
		const { construct, sort } = MicroCapturer, structured = [];
		let i,l,i0,i1,i2, idx,idxR;
		
		i = i1 = -1, l = (indices = [ ...indices ]).sort(sort).length;
		while (++i < l) {
			
			i0 = i, i2 = -1, idxR = (idx = (structured[++i1] = indices[i])).r.start, nest = [];
			while (++i0 < l && idxR < indices[i0].r.start) nest[++i2] = indices[i0], ++i;
			
			i1 === -1 || (idx.nest = structure(nest));
			
		}
		
		return structured;
		
	}
	
	static sort(a, b) {
		
		return a.l - b.l;
		
	}
	
	constructor(str, L, R, esc) {
		
		super(str, L, R, esc);
		
	}
	
	capture(structures, unescapes, updates) {
		
		const	{ cache } = this,
				cacheKey = `${structures ? 'structured' : 'serialized'}-${(unescapes ? 'unescaped' : 'escaped')}`;
		
		if (!updates && cacheKey in cache) return cache[cacheKey];
		
		const	{ constructor: { sort, structure }, L, R } = this,
				lIndices = this.escape(L, undefined,undefined, true),
				rIndices = this.escape(R, undefined,undefined, true),
				rLength = rIndices.length,
				confirmed = [],
				indices = [];
		let i,i0,i1,i2, lIndex,rIndex;
		
		i = lIndices.length, i1 = i2 = -1;
		while (--i > -1) {
			
			if (unescapes && (lIndex = lIndices[i]).escaped) continue;
			
			i0 = -1, lIndex = lIndices[i];
			while	(
						++i0 < rLength &&
							!(
								(rIndex = rIndices[i0]) &&
								(unescapes || rIndex.escaped) &&
								lIndex.start < rIndex.start &&
								confirmed.indexOf(i0) === -1
							)
					);
			
			if (i0 === rLength) break;//throw SyntaxError(`Unexpected token: "${L}".`);
			indices[++i1] = { l: lIndex, r: rIndices[confirmed[++i2] = i0] };
			
		}
		
		//if (++i2 < rLength) throw SyntaxError(`Unexpected token: "${R}".`);
		
		return cache[cacheKey] = structures ? structure(indices) : indices.sort(sort);
		
	}
	
}
class GlobalCapturer extends MicroBracket {
	
	static $captured = Symbol('GlobalCapturer.captured');
	static $enc = Symbol('GlobalCapturer.enc');
	
	static enc = '"';
	
	constructor(str, L, R, enc, esc) {
		
		super(str, L, R, esc);
		
		const { $enc } = GlobalCapturer;
		
		this[$enc] = enc || this.constructor.enc;
		
	}
	
	// 現状の仕様は、ブロックの左右両端は最短一致で境界を定める。
	// 例えば a{b}c}d だと、ブロックは {b}c} ではなく {b} になる。
	// この時、c} は単なる文字列として扱いシンタックスエラーにならない。
	// 一方、 abc}c}d もシンタックスエラーにはならず、構文が存在しない単なる文字列として認識される。
	// こうした仕様は実装後に判明した動作で、実際のところ想定していたものではないが、
	// ブロックの境界として意図していない { や } をエスケープせずに使えると言う点で合理的ではあるので現状では許容している。
	
	exc(str) {
		
		arguments.length ? (this.str = str) : (str = this.str);
		
		const { L } = this, lIds = this.escape(L), lIdsLength = lIds.length;
		
		if (!lIdsLength) return str;
		
		const { R } = this, rIds = this.escape(R), rIdsLength = rIds.length;
		
		if (!rIdsLength) return str;
		
		const	{ restore } = MicroEscaper,
				{ $captured } = GlobalCapturer,
				{ enc, esc } = this,
				encIndices = this.escape(enc, lIds[0].end, rIds[rIdsLength - 1].start),
				encIndicesLength = encIndices.length,
				sealedLIndices = [],
				sealedRIndices = [],
				skippedLIndices = [],
				skippedRIndices = [],
				parsed = [];
		let	i,l,i0,l0,i1,i2,
				sldLIdsI,sldRIdsI,skpLIdsI,skpRIdsI, enci, lIdx,lIdx0,lIdx0End,lIdsLength0,rIdx,rIdxEnd, p,pi, result;
		
		// todo: 出力前のエスケープ文字の処理。
		
		// 以下のループの処理は、一番最初の { は左端のブロックの左境界を示すものであることがいかなる状況でも確定していると言う前提から出発する。
		
		i = sldLIdsI = sldRIdsI = skpLIdsI = skpRIdsI = pi = -1, parsed[++pi] = enci = 0;
		while (++i < lIdsLength) {
			
			i0 = -1, l0 = sldLIdsI + 1;
			while (++i0 < l0 && sealedLIndices[i0] !== i);
			if (i0 < l0) continue;
			
			i0 = -1, lIdx = lIds[i], lIdx0 = undefined;
			while (++i0 < rIdsLength) {
				
				i1 = -1, l0 = sldRIdsI + 1;
				while (++i1 < l0 && sealedRIndices[i1] !== i0);
				if (i1 < l0) continue;
				
				rIdxEnd = (rIdx = rIds[i0]).end;
				//hi(lIdx.end,rIdx.end, enci,encIndices,rIdxEnd, encIndices[enci+1]?.end,sealedRIndices);
				//if	(!encIndicesLength || enci <= encIndicesLength || rIdxEnd < encIndices[enci].end) {
				if	(!encIndicesLength || enci + 1 >= encIndicesLength || rIdxEnd < encIndices[enci + 1].end) {
					
					i1 = lIdsLength, lIdsLength0 = i - 1;
					while (--i1 > lIdsLength0) {
						
						if	((lIdx0End = (lIdx0 = lIds[i1]).end) < rIdxEnd && sealedLIndices.indexOf(i1) === -1) {
							
							//if (encIndicesLength && enci < encIndicesLength && lIdx0 !== lIdx) {
							if (encIndicesLength && enci + 1 < encIndicesLength) {
								
								i2 = enci - 2;
								while ((i2 += 2) < encIndicesLength && (lIdx0End < encIndices[i2].end || lIdx0End > encIndices[i2 + 1].end));
								
								if (i2 < encIndicesLength) {
									
									sealedLIndices[++sldLIdsI] = i1;
									continue;
									
								}
								
								//i2 = enci, lIdx0End = lIdx0.end;
								//while ((i2 += 2) > encIndicesLength && (lIdx0End < encIndices[i2].end || lIdx0End > encIndices[i2 + 1].end));
								//
								//if (i2 < encIndicesLength) {
								//	
								//	sealedLIndices[++sldLIdsI] = i1;
								//	continue;
								//	
								//}
								
							}
							
							if (lIdx0 === lIdx) {
								
								parsed[++pi] = lIdx.chrIndex,
								parsed[++pi] = str.slice(lIdx.end, rIdx.chrIndex),
								parsed[++pi] = rIdx.end,
								
								sealedLIndices[++sldLIdsI] = i,
								sealedRIndices[++sldRIdsI] = i0;
								
							} else {
								
								sealedLIndices[++sldLIdsI] = i1,
								sealedRIndices[++sldRIdsI] = i0;
								
							}
							
							break;
							
						}
						
					}
					
				} else {
					
					rIdxEnd > encIndices[enci + 1].end ? (enci += 2, --i0) : (sealedRIndices[++sldRIdsI] = i0);
					
					continue;
					
				}
				
				if (lIdx0 === lIdx && lIdx0.end < rIdx.end) break;
				
				// 上記ブロックの条件を満たさない時は、現在の { 中でネストしている { で、現在の } とペアになっている。
				// または現在の } が余分の } である場合、現在の { は現在の } よりも後方の } とペアになる可能性がある。
				// この時、現在の { は現在の } よりも後方に存在している。
				// これらのいずれかの条件を満たす場合は、現在の } から次の } に移るためにループを進める。
				
			}
			
			if (lIdx0 !== lIdx) new SyntaxError(`Missing } in compound statement. { opened at column ${lIdx.end}.`);
			
		}
		
		parsed[++pi] = str.length;
		
		i = -1, l = pi + 1;
		while (++i < l)	typeof (p = parsed[i]) === 'string' ?
									((parsed[i] = new String(p))[$captured] = true) :
									(
										parsed[i] = restore(str.slice(p, parsed[i + 1]), esc),
										parsed.splice(i + 1, 1),
										--l
									);
		
		return parsed;
		
	}
	
	get enc() {
		
		return this[GlobalCapturer.$enc];
		
	}
	set enc(v) {
		
		const { $enc } = GlobalCapturer;
		
		v === this[$enc] || (this.structureCache(), this[$enc] = v);
		
	}
	
}
class MicroParser extends MicroCore {
	
	static $bkt = Symbol('MicroParser.bkt');
	static $cap = Symbol('MicroParser.cap');
	static $enc = Symbol('MicroParser.enc');
	static $exc = Symbol('MicroParser.exc');
	static $gc = Symbol('MicroParser.gc');
	static $sep = Symbol('MicroParser.sep');
	
	static bracketL = '(';
	static bracketR = ')';
	static separator = /\s+/g;
	
	static cache = { co: [], gc: [], mp: [], executed: {} };
	
	static sort(a, b) {
		
		return a?.l?.end - b?.l?.end;
		
	}
	
	// indices に指定する値は、エスケープされていないペアになった括弧で、かつそれらがお互いの境界をまたいでいないことが暗黙的に求められる。
	// そうでない値を指定した場合、戻り値に不整合を起こす可能性がある。
	static getGlobalBounds(...bounds) {
		
		const bl = bounds.sort(MicroParser.sort).length, globals = [];
		let i,i0, bound,bIdx, gi;
		
		i = gi = -1
		while (++i < bl) {
			
			i0 = i, bIdx = (bound = bounds[i]).r.end;
			while (++i0 < bl && bIdx > bounds[i0].l.end);
			globals[++gi] = bound, i += i0 - 1;
			//indices.splice(i + 1, i0 = i0 - 1 - i), i -= i0, l -= i0;
			
		}
		
		return globals;
		
	}
	
	static getExcluded(chrIndices, ...bounds) {
		
		const bl = bounds.length && (bounds = MicroParser.getGlobalBounds(...bounds)).length;
		
		if (bl) {
			
			const cl = chrIndices.length, excluded = [];
			let i,i0,l0, ci,cIdx,cEnd, bi,bIdx,bEnd, ei;
			
			i = i0 = bi = ei = -1;
			while (++i < cl) {
				
				cEnd = (cIdx = chrIndices[i]).end;
				while (++bi < bl && ((cEnd > (bIdx = bounds[bi]).l.end && cEnd < (bEnd = bIdx.r.end)) || cEnd > bEnd));
				
				if (bi !== bl) {
					
					while (++i0 < bi) excluded[++ei] = bounds[i0];
					--bi, excluded[++ei] = cIdx;
					
				} else ci = i;
				
			}
			
			if (i0-- !== bi) while (++i0 < bi) excluded[++ei] = bounds[i0];
			
			if (ci--) while (++ci < cl) excluded[++ei] = chrIndices[ci];
			
			//i = ri = -1, ++ei;
			//while (++i < ei) {
			//	
			//	i0 = -1, exEnd = ((ex = excluded[i])).end;
			//	while (++i0 < bl && exEnd > (bIdx = bounds[i0]).r.end && (result[++ri] = bIdx));
			//	result[++ri] = ex;
			//	
			//}
			//
			//if (ri > -1 && ri + 1 !== ei + bl) {
			//	
			//	i = -1;
			//	while (++i < bl && result[ri].end < bounds[i].r.end);
			//	while (++i < bl && (result[++ri] = bounds[i]));
			//	
			//}
			
			return excluded;
			
		}
		
		return [ ...chrIndices ];
		
	}
	
	// パースに使われる記号は主に以下のコンストラクターの gc に指定されたものを共有する。
	// 引数 gc にはオブジェクト GlobalCapturer のインスタンスを指定するが、未指定の場合は同オブジェクトの既定値でインスタンスが作られる。
	// メソッド update を通じて gc を別のインスタンスに置き換えると、パースに使われる他のオブジェクトの記号も同じものに置き換わる。
	// update を通じた変更であれば上記のようにインスタンス全体に反映されるが、
	// gc に指定したインスタンスのプロパティやメソッドを使って個別に変更してもそれはこのオブジェクトの他のインスタンスには反映されない。
	
	constructor(str, gc, bracketL, bracketR, sep) {
		
		super(str);
		
		const	{ $bkt, $cap, $enc, $gc, $sep } = MicroParser,
				{ constructor: { bracketL: bktL, bracketR: bktR, separator: _sep } } = this;
		
		this[$gc] = gc = gc instanceof GlobalCapturer ? gc : new GlobalCapturer(str),
		
		this[$enc] = new MicroEnclosure(str, gc.enc, gc.esc),
		this[$cap] = new MicroCapturer(str, gc.L, gc.R, gc.esc),
		this[$bkt] = new MicroCapturer(str, bracketL || bktL, bracketR || bktR, gc.esc),
		this[$sep] = sep || _sep;
		
	}
	
	// CO = MicroCoParser
	createCO(coOrMp = this, str) {
		
		if (!(coOrMp instanceof MicroParser)) throw new TypeError();
		
		const	{ cache: { co } } = this, l = co.length, { L: bracketL, R: bracketR } = mp[MicroParser.$bkt],
				gc = this.createGCFromMP(coOrMp, str);
		let i, c;
		
		i = -1;
		while (++i < l && !((c = co[i]).gc === gc && c.bracketL === bracketL && c.bracketR === bracketR));
		
		return i === l ?	(co[i] = { $: new MicroCoParser(str, gc, bracketL, bracketR), gc, bracketL, bracketR }).$ :
								(arguments.length > 1 ? (c.$.str = str, c.$) : c.$);
		
	}
	
	// このメソッドは createCO, createMP 内の重複する処理をメソッド化している。
	// GC = GlobalCapturer
	createGCFromMP(mp, str) {
		
		if (!(mp instanceof MicroParser)) throw new TypeError();
		
		const { cache: { gc } } = this, l = gc.length;
		let i;
		
		i = -1;
		while (++i < l && gc[i].mp !== gc);
		
		if (i === l) {
			
			const { $bkt, $gc, $sep } = MicroParser, { L, R, enc, esc } = mp[$gc];
			
			return (gc[i] = { $: new GlobalCapturer(str, L, R, enc, esc), mp }).$;
			
		} else return arguments.length > 1 ? (gc[i].str = str, gc[i].$) : gc[i].$;
		
	}
	
	// MP = MicroParser
	createMP(mp = this, str) {
		
		if (!(mp instanceof MicroParser)) throw new TypeError();
		
		const	{ $bkt, $sep } = MicroParser,
				{ cache: { mp: cached } } = this,
				l = cached.length,
				{ L: bracketL, R: bracketR } = mp[$bkt],
				gc = this.createGCFromMP(mp, str),
				sep = mp[$sep];
		let i, m;
		
		i = -1;
		while	(
					++i < l &&
					!((m = cached[i]).gc === gc && m.bracketL === bracketL && m.bracketR === bracketR && m.sep === sep)
				);
		
		return	i === l ?
						(
							cached[i] =
								{ $: new MicroParser(str, gc, bracketL, bracketR, mp[$sep]), gc, bracketL, bracketR, sep }
						).$ :
						arguments.length > 1 ? (m.$.str = str, m.$) : m.$;
		
	}
	
	exc(str) {
		
		const { cache: { executed } } = this;
		
		return	executed?.[str = arguments.length ? (this.str = str) : (str = this.str)] ??
						(executed[str] = this[MicroParser.$exc]());
		
	}
	
	split() {
		
		const { $bkt, $cap, $enc, $gc, $sep, $str, getExcluded } = MicroParser,
				sep = this[$sep],
				sepIndices =	getExcluded(
										this[$gc].escape(sep, undefined, undefined, true),
										...this[$enc].enclose(),
										...this[$cap].capture(undefined, true),
										...this[$bkt].capture(undefined, true)
									),
				l = sepIndices.length,
				str = this[$str],
				splitted = [];
		let i,i0, indexStart, sepIdx,lastSepIdx;
		
		i = i0 = -1, indexStart = 0;
		while (++i < l)	'l' in (sepIdx = sepIndices[i]) ?
									(
										splitted[++i0] = str.slice(indexStart, (sepIdx = sepIndices[i].l.chrIndex)).trim(),
										splitted[++i0] = str.slice(sepIdx, (sepIdx = sepIndices[i].r).end).trim()
									) :
									(splitted[++i0] = str.slice(indexStart, (sepIdx = sepIndices[i]).chrIndex).trim()),
								indexStart = sepIdx.end;
		splitted[++i0] = str.slice(indexStart);
		
		return splitted;
		
	}
	
	parse() {
		
		const parsed = this[MicroParser.$gc].exc(), l = parsed.length;
		let i, p;
		
		i = -1;
		while (++i < l) typeof (p = parsed[i]) === 'object' && (parsed[i] = this.createMP(this, ''+p).exc());
		
		return parsed;
		
	}
	
	// このメソッドを通じて各値を変更した場合、例えば引数に現在使われてる値と同じ値を指定してもキャッシュの初期化が発生するように、
	// 引数の指定がキャッシュの初期化を引き起こすトリガーになっており、厳密に値の変化に追従しない点に注意が必要。
	update(gc, bracketL, bracketR, esc, disablesStructure) {
		
		const { $bkt, $gc } = MicroParser, { cache: { co, mp } } = this;
		let i,l, cached, structures;
		
		if (gc instanceof GlobalCapturer && gc !== this[$gc]) {
			
			this[$gc] = gc;
			
			const	{ $bkt, $cap, $enc } = MicroParser,
					{ L, R, enc: E, esc } = gc,
					bkt = this[$bkt],
					cap = this[$cap],
					enc = this[$enc],
					{ str } = this;
			
			enc instanceof MicroEnclosure && (enc.enc = E, enc.esc = esc),
			cap instanceof MicroCapturer && (cap.L = L, cap.R = R, cap.esc = esc),
			bkt instanceof MicroCapturer && (bkt.esc = esc),
			
			structures = !disablesStructure;
			
		}
		
		if (bracketL || bracketR) {
			
			const bkt = this[$bkt];
			
			bracketL && (bkt.L = bracketL), bracketR && (bkt.R = bracketR),
			
			structures ||= !disablesStructure;
			
		}
		
		if (esc) this.updateEsc(esc, true), structures ||= !disablesStructure;
		
		i = -1, l = co.length;
		while (++i < l) (cached = co[i].$) === this && (cached.update(...arguments), structures ||= !disablesStructure);
		i = -1, l = mp.length;
		while (++i < l) (cached = mp[i].$) === this && (cached.update(...arguments), structures ||= !disablesStructure);
		
		structures && this.structureCache();
		
	}
	updateEsc(esc, disablesStructuring) {
		
		const gc = this[MicroParser.$gc];
		
		if (esc !== gc.esc) {
			
			const { $bkt, $cap, $enc } = MicroParser, { cache: { co, gc, mp } } = this;
			let i,l, cached;
			
			this[$enc].esc = this[$cap].esc = this[$bkt].esc = gc.esc = esc,
			
			i = -1, l = co.length;
			while (++i < l)
				(cached = co[i].$) === this && (cached.updateEsc(...arguments), structures ||= !disablesStructure);
			i = -1, l = mp.length;
			while (++i < l)
				(cached = mp[i].$) === this && (cached.updateEsc(...arguments), structures ||= !disablesStructure);
			
			disablesStructuring || this.structureCache();
			
		}
		
	}
	updateStr(str) {
		
		const { $str } = MicroCore, { $bkt, $cap, $enc, $gc } = MicroParser;
		
		this[$str] = str,
		this[$enc] && (this[$enc].str = str),
		this[$cap] && (this[$cap].str = str),
		this[$bkt] && (this[$bkt].str = str),
		this[$gc] && (this[$gc].str = str),
		
		this.structureCache();
		
	}
	
	get bracketL() {
		
		return this[MicroParser.$bkt].L;
		
	}
	set bracketL(v) {
		
		this.update(undefined, v, undefined);
		
	}
	get bracketR() {
		
		return this[MicroParser.$bkt].R;
		
	}
	set bracketR(v) {
		
		this.update(undefined, undefined, v);
		
	}
	get bkt() {
		
		return this[MicroParser.$bkt];
		
	}
	set bkt(v) {
		
		//const { $bkt, $gc } = MicroParser, bkt = this[$bkt];
		//
		//v !== bkt && v instanceof MicroCapturer && (this.structureCache(), (this[$bkt] = bkt).esc = this[$gc].esc);
		
	}
	get cap() {
		
		return this[MicroParser.$cap];
		
	}
	set cap(v) {
		
		//const { $cap, $gc } = MicroParser, cap = this[$cap];
		//
		//v !== cap && v instanceof MicroCapturer && (this.structureCache(), (this[$cap] = cap).esc = this[$gc].esc);
		
	}
	//get co() {
	//	
	//	return this[MicroParser.$co];
	//	
	//}
	//set co(v) {
	//	
	//	const { $esc, $co } = MicroParser, co = this[$co];
	//	
	//	v !== co && v instanceof MicroCoParser && (this.structureCache(), (this[$co] = co).esc = this[$esc]);
	//	
	//}
	get enc() {
		
		return this[MicroParser.$enc];
		
	}
	set enc(v) {
		
		//const { $enc, $gc } = MicroParser, enc = this[$enc];
		//
		//v !== enc && v instanceof MicroEnclosure && (this.structureCache(), (this[$enc] = enc).esc = this[$gc].esc);
		
	}
	get esc() {
		
		return this[MicroParser.$gc].esc;
		
	}
	set esc(v) {
		
		this.updateEsc(v);
		
	}
	get gc() {
		
		return this[MicroParser.$gc];
		
	}
	set gc(v) {
		
		this.update(v);
		
	}
	//get mp() {
	//	
	//	return this[MicroParser.$mp];
	//	
	//}
	//set mp(v) {
	//	
	//	const { $esc, $mp } = MicroParser, mp = this[$mp];
	//	
	//	v !== mp && v instanceof MicroParser && (this.structureCache(), (this[$mp] = mp).esc = this[$esc]);
	//	
	//}
	get sep() {
		
		return this[MicroParser.$sep];
		
	}
	set sep(v) {
		
		const { $sep } = MicroParser;
		
		v === this[$sep] || (this.structureCache(), this[$sep] = v);
		
	}
	
	get str() {
		
		return this[MicroCore.$str];
		
	}
	set str(v) {
		
		v === this[MicroCore.$str] || this.updateStr(v);
		
	}
	
}
MicroParser.prototype[MicroParser.$exc] = function () {
	
	const	{ isArray } = Array,
			{ bkt: { L: bktL, R: bktR }, cap: { L: capL, R: capR }, esc } = this,
			bktLL = bktL.length, bktRL = bktR.length,
			capLL = capL.length, capRL = capR.length,
			params = this.split(),
			executed = [];
	let i,l, p,p0, ei, labeled, args;
	
	i = ei = -1, l = params.length;
	while (++i < l) {
		
		//if ((p = params[i]).slice(0, capLL) === capL && p.slice(-capRL) === capR) {
		//	
		//	params[i] =	this.createMP(this, p.slice(capLL, -capRL)).exc();
		//	
		//} else if (p) {
		//	
		//	params[i] = p;
		//	
		//} else params.splice(i--, 1), --l;
		
		if ((p = params[i]).slice(0, bktLL) === bktL && p.slice(-bktRL) === bktR) {
			
			args = this.createCO(this, p.slice(bktL.length, -bktR.length)).exc(),
			labeled ? (labeled.args = args, labeled = null) : (executed[++ei] = { args });
			
		} else if (p.slice(0, capLL) === capL && p.slice(-capRL) === capR) {
			
			labeled = null,
			executed[++ei] = this.createMP(this, p.slice(capLL, -capRL)).exc();
			
		} else if (p) {
			
			executed[++ei] = labeled = { label: p };
			
		}
		
	}
	
	return executed;
	
};
class MicroCoParser extends MicroParser {
	
	static separator = ',';
	
	constructor() {
		
		super(...arguments);
		
	}
	
	[MicroParser.$exc]() {
		
		const	{ isNaN } = Number,
				{ bkt: { L: bktL, R: bktR }, cap: { L: capL, R: capR }, enc: { enc } } = this,
				bktLL = bktL.length, bktRL = bktR.length,
				capLL = capL.length, capRL = capR.length,
				encLL = enc.length,
				params = this.split(), l = params.length;
		let i,v, p;
		
		i = -1;
		while (++i < l) {
			
			if ((p = params[i]).slice(0, bktLL) === bktL && p.slice(-bktR.length) === bktR) {
				
				const { co } = this;
				
				params[i] =	(co instanceof MicroCoParser ? co : (this.co = new MicroCoParser(undefined, esc))).
									exc(p.slice(bktL.length, -bktR.length));
				
			} else if (p.slice(0, capLL) === capL && p.slice(-capRL) === capR) {
				
				const { mp } = this;
				
				params[i] =	(mp instanceof MicroParser ? mp : (this.mp = new MicroParser(undefined, esc))).
									exc(p.slice(capL.length, -capR.length));
				
			} else if (p.slice(0, encLL) === enc && p.slice(-encLL) === enc) {
				
				params[i] = p.slice(encLL, -encLL);
				
			} else if (p) {
				
				switch (p) {
					
					case 'true': case 'false':
					params[i] = p === 'true';
					break;
					
					case 'null':
					params[i] = null;
					break;
					
					case 'undefined':
					params[i] = undefined;
					break;
					
					default:
					//if (isNaN(v = Number(p))) throw new TypeError();
					//params[i] = v;
					params[i] = isNaN(v = Number(p)) ? new TypeError() : v;
					
				}
				
			} else params.splice(i--, 1), --l;
			
		}
		
		return params;
		
	}
	
}
class _MicroParser {
	
	static $str = Symbol('MicroParser.str');
	
	static bracketL = '(';
	static bracketR = ')';
	static blockL = '{';
	static blockR = '}';
	static escapeChr = '\\';
	static separator = ',';
	static strEnclosure = '"';
	
	constructor(str) {
		
		this.cache = { unescaped: {}, escaped: {} },
		
		this.str = str;
		
	}
	
	// 文字列中の、エスケープされていない strEnclosure のすべての位置を返す。
	indicesOfStrEnclosure() {
		
		return this.indicesOfUnescaped(this.constructor.strEnclosure);
		
	}
	// 文字列中の、エスケープされていない第一引数 chr のすべての位置を返す。
	indicesOfUnescaped(chr) {
		
		if (Array.isArray(chr)) return chr;
		
		typeof chr === 'string' || (chr = '' + chr);
		
		const { cache: { unescaped }, str } = this;
		
		if (chr in unescaped) return unescaped[chr];
		
		const indices = unescaped[chr] = [], chrLength = chr.length;
		let i, searchedIndex;
		
		i = -1
		for (const v of this.indexingOfUnescaped(chr)) v[2] || (v.length = 2, indices[++i] = v);
		
		return indices;
		
		//i = -1;
		//while (searchedIndex = this.indexOfUnescaped(chr, (indices[i]?.[1] ?? -chrLength) + chrLength))
		//	indices[++i] = searchedIndex;
		//
		//return indices;
		
	}
	// 文字列中の、エスケープされていない第一引数 chr の、第二引数 fromIndex からの最短の位置を返す。
	// 位置は配列に列挙され、0番目の要素は直前のエスケープシーケンスの連なりの開始位置、1番目の要素は chr の位置になる。
	// chr が存在しなかった場合は null を返す。
	indexOfUnescaped(chr, fromIndex = 0) {
		
		return this.indexingOfUnescaped(chr, fromIndex) || null;
		
		//const { escapeChr } = MicroParser, { str } = this, escLength = escapeChr.length, chrLength = chr.length;
		//let i, escIndex, searchedIndex;
		//
		//while ((searchedIndex = escIndex = str.indexOf(chr, fromIndex)) !== -1) {
		//	
		//	while (str.substr(escIndex -= escLength, escLength) === escapeChr);
		//	
		//	if (!((searchedIndex - (escIndex += escLength)) % 2)) {
		//		
		//		return [ escIndex, searchedIndex ];
		//	
		//	}
		//	
		//	//fromIndex ||= lastIndex, lastIndex = searchedIndex + escLength;
		//	fromIndex = searchedIndex + chrLength;
		//	
		//}
		//
		//return null;
		
	}
	// indexOfUnescaped の本体。
	// 第一引数 chr を未指定にするか、エスケープ文字を指定すると特殊な動作になり、
	// 文字列中のすべてのエスケープ文字の位置を、通常とは逆に、昇順で返す。
	*indexingOfUnescaped(chr = this.constructor.escapeChr, fromIndex = 0) {
		
		const	{ cache: { escaped } } = this;
		
		if (chr in escaped) {
			
			const indices = escaped[chr], l = indices.length;
			let i, index;
			
			i = -1;
			while (++i < l) if ((index = indices[i])[1] >= fromIndex) yield index;
			
			return;
			
		}
		const	{ escapeChr } = MicroParser,
				{ str } = this,
				escLength = escapeChr.length, chrLength = chr.length,
				indices = escaped[chr] = [],
				escMode = chr === escapeChr,
				searchMethod = escMode ? 'lastIndexOf' : 'indexOf';
		let i, escIndex, searchedIndex, even;
		
		i = -1, escMode && (fromIndex = str.length - fromIndex);
		while ((searchedIndex = escIndex = str[searchMethod](chr, fromIndex)) !== -1) {
			
			while ((escIndex -= escLength) > -1 && str.substr(escIndex, escLength) === escapeChr);
			
			even = !!((searchedIndex - (escIndex += escLength)) % 2),
			
			yield indices[++i] = [ escIndex, searchedIndex, even ];
			
			if ((fromIndex = escMode ? --escIndex : searchedIndex + chrLength) < 0 && escMode) return;
			
		}
		return;
		
	}
	
	// 文字列中の、第一引数 chr の位置から、第二引数 unescapedIndices に指定した、特定の文字位置の範囲を列挙する配列内の要素に収まるものを返す。
	// unescapedIndices は、メソッド indicesOfUnescaped() の戻り値を想定している。
	// 例えばそれが strEnclosure だった場合、"" 内に存在する chr の位置のみを列挙した配列をこのメソッドは返す。
	// 第三引数 inverts に true を指定すると、unescapedIndices が示す範囲外の chr の位置を列挙した配列を返す。
	// 対象の chr が存在しない場合、要素数が 0 の配列を返す。
	enclosedIndicesOf(chr, unescapedIndices, inverts) {
		
		unescapedIndices = this.indicesOfUnescaped(unescapedIndices);
		
		const chrLength = chr.length, indices = [];
		let i, index;
		
		i = -1, index = -chrLength;
		//while ((index = str.indexOf(chr, (index ?? -chrLength) + chrLength)) !== -1)
		//	method(unescapedIndices, index) && (indices[++i] = index);
		while ((index = this.enclosedIndexOf(chr, index + chrLength, unescapedIndices, inverts)) !== -1)
			indices[++i] = index;
		// 広域のブロックの設定の試行
		
		return indices;
		
	}
	// 文字列中の、第一引数 chr に指定した文字列を、第二引数 fromIndex に指定した位置から最短のものを返す。
	// 戻り値の位置は、第三引数 unescapedIndices に指定した、特定の文字列の範囲を列挙した要素のいずれかに収まる。
	// chr が存在しない場合は -1 が返る。
	// 第四引数 inverts が true の時は、unescapedIndices が示す範囲に収まらない chr の位置を返す。
	enclosedIndexOf(chr, fromIndex, unescapedIndices, inverts) {
		
		unescapedIndices = this.indicesOfUnescaped(unescapedIndices);
		
		const	{ str } = this, l = unescapedIndices.length;
		let i, searchedIndex, shiftedFromIndex;
		
		i = -2, searchedIndex = str.indexOf(chr, fromIndex);
		while	(
					searchedIndex !== -1 &&
					(i += 2) < l &&
					(
						searchedIndex > unescapedIndices[i + 1][0] ||
						(inverts ? searchedIndex > unescapedIndices[i][1] : searchedIndex < unescapedIndices[i][1])
					)
				)	fromIndex < (shiftedFromIndex = unescapedIndices[inverts ? i + 1 : i][1]) &&
						(searchedIndex = str.indexOf(chr, fromIndex = shiftedFromIndex), inverts || (i -= 2));
		
		return searchedIndex;
		
		//if (inverts) {
		//	
		//} else {
		//	
		//	while	(
		//				searchedIndex !== -1 &&
		//				(i += 2) < l &&
		//				(
		//					searchedIndex > unescapedIndices[i + 1][0] ||
		//					searchedIndex < unescapedIndices[i][1]
		//				)
		//			) fromIndex < (fromIndex = unescapedIndices[i][1]) && (searchedIndex = str.indexOf(chr, fromIndex);
		//	
		//	//while ((i += 2) < l && (searchedIndex < unescapedIndices[i][1] || searchedIndex > unescapedIndices[i + 1][0]));
		//	
		//	return searchedIndex;
		//	
		//}
		
	}
	// 文字列中から、strEnclosure に囲まれた第一引数 chr に指定した文字列を、第二引数 fromIndex に指定した位置から最短の位置のものを返す。
	// 第三引数 inverts に true を指定していると、strEnclosure に囲まれていない chr の位置を返す。
	enclosedIndexWithStrOf(chr, fromIndex, inverts) {
		
		return this.enclosedIndexOf(chr, fromIndex, this.indicesOfStrEnclosure(), inverts);
		
	}
	
	// 第一引数 bracketL に指定した特定の文字の位置を列挙した配列を括弧の左側として、
	// 第二引数 bracketR に指定した特定の文字の位置を列挙した配列を括弧の右側として、
	// それらを対応する二つを一組として順に列挙した配列を返す。
	// それらの位置の中で、第三引数 unescapedIndice が示す、特定の文字列範囲内に収まるものは、戻り値に含まれない。
	composeBracketIndices(bracketL, bracketR, unescapedIndices) {
		
		const	lIndices = this.enclosedIndicesOf(bracketL, unescapedIndices, true),
				rIndices = this.enclosedIndicesOf(bracketR, unescapedIndices, true),
				rLength = rIndices.length,
				confirmed = [],
				indices = [];
		let i,l,i0,l0,i1,i2, lIndex;
		
		i = lIndices.length, i1 = i2 = -1;
		while (--i > -1) {
			
			i0 = -1, lIndex = lIndices[i];
			while(++i0 < rLength && (lIndex > rIndices[i0] || confirmed.indexOf(i0) !== -1));
			
			if (i0 === rLength) {
				
				throw SyntaxError(`Unexpected token: "${bracketL}".`);
				
			}
			
			indices[++i1] = [ lIndex, rIndices[confirmed[++i2] = i0] ];
			
		}
		
		if (confirmed.length < rLength) {
			
			throw SyntaxError(`Unexpected token: "${bracketR}".`);
			
		}
		
		indices.sort((a,b) => a[0] - b[0]);
		
		return indices;
		
		//i = i0 = i1 = -1, l = lIndices.length, l0 = rIndices.length;
		//while (++i < l) {
		//	
		//	lIndex = lIndices[i];
		//	while(++i0 < l0 && lIndex > rIndices[i0]);
		//	
		//	if (i0 === l0) {
		//		
		//		throw SyntaxError(`Unexpected token: "${this.constructor.bracketL}".`);
		//		
		//	}
		//	
		//	indices[++i1] = [ lIndex, rIndices[i0] ];
		//	
		//}
		//
		//return indices;
		
	}
	
	// 文字列から、name(value, value0, value1, ..., valueN) で示されるすべての文字列を特定し、
	// それらの成分をオブジェクト内のプロパティに分解し、配列に列挙して返す。
	// 例えば文字列が 'a(0,1,2) b("hi")' だった場合、
	// 戻り値は [ { name: 'a', values: [ 0,1,2 ] }, { name: 'b', values: [ 'hi' ] } ] になる。
	// 括弧の前の文字列は、括弧が示す値群の名前、括弧内はカンマ , で区切られる値として考えることができる。
	// 値は数値と文字列、真偽値、undefined, null が指定できる。
	// この中で、文字列だけは二重引用符で囲う必要がある。
	// カンマで区切られた中に指定できる値はそれぞれひとつだけで、例えば式などは使えない。
	// 文字列内では任意の文字を指定することができるが、" を使う場合は、\\ でエスケープする必要がある。
	exec() {
		
		const { cache } = this;
		
		if (cache.params) return cache.params;
		
		const seIndices = this.indicesOfStrEnclosure();
		
		if (seIndices.length % 2) throw new SyntaxError('Not terminated " literal.');
		
		const	{ bracketL, bracketR, blockL, blockR, separator } = MicroParser,
				{ str } = this,
				blcLIndices = this.indicesOfUnescaped(blockL, seIndices, true),
				blcRIndices = this.indicesOfUnescaped(blockR, seIndices, true),
				bLLength = bracketL.length,
				bRLength = bracketR.length,
				bIndices = this.composeBracketIndices(bracketL, bracketR, seIndices),
				bl = bIndices.length,
				sIndices = this.enclosedIndicesOf(separator, seIndices, true),
				sl = sIndices.length,
				params = [];
		let i,l,i0,i1,i2, fromIndex,bIndex,sIndex, values, bound,lastBound,lastBIndex;
		
		const indices = this.indicesOfUnescaped(this.constructor.strEnclosure);
		
		i = i2 = -1;
		while (++i < bl) {
			
			i0 = i1 = -1, fromIndex = (bIndex = bIndices[i])[0], values = [];
			while (++i0 < sl)	(sIndex = sIndices[i0]) > bIndex[0] && sIndex < bIndex[1] &&
				(values[++i1] = this.extract(fromIndex + 1, sIndex), fromIndex = sIndex);
			
			values[++i1] = this.extract(fromIndex + 1, bIndex[1]),
			
			bound = i && (lastBIndex[0] < bIndex[0] && lastBIndex[1] < bIndex[0] ? lastBIndex[1] + bRLength : lastBIndex[0] + bLLength),
			bound === lastBIndex?.[0] + bLLength || (lastBIndex = bIndex);
			
			params[++i2] = { name: str.substring(bound, bIndex[0]).trim(), values };
			
		}
		
		return cache.params = params;
		
	}
	
	escape() {
		
		const { constructor: { escapeChr }, str } = this, escLength = escapeChr.length, result = [];
		let i, startIndex, endIndex;
		
		i = -1, startIndex = endIndex = str.length;
		for (const v of this.indexingOfUnescaped()) {
			
			result[++i] =	str.substring((startIndex = v[1]) + escLength, endIndex),
			result[++i] =	str.substring((endIndex = v[0]), startIndex).
									slice(0, (startIndex - endIndex) / 2 + (v[2] && escLength));
			
		}
		
		result[++i] =	str.substring(0, endIndex);
		
		return result.reverse().join('');
		
	}
	
	// 文字列中の、第一引数 fromIndex、第二引数 endIndex で示される範囲の文字列から、
	// 文字列をそれぞれ値として、対応する型に変換して返す。基本的には内部処理用。
	extract(fromIndex, endIndex) {
		
		const	{ constructor: { bracketL, bracketR, escapeChr, strEnclosure }, str } = this,
				seLength = strEnclosure.length,
				v = str.substring(fromIndex, endIndex).trim();
		
		if (v[0] === strEnclosure && v[v.length - seLength] === strEnclosure) {
			
			return new MicroParser(v.slice(seLength, -seLength)).escape();
			
		} else if (v[0] === bracketL && v[v.length - seLength] === bracketR) {
			
			const value = new MicroParser(v).exec();
			
			if (value.length !== 1)
				throw new SyntaxError(`An argument must have only 1 value. ${value.length} value(s).`);
			
			return value[0];
			
		} else {
			
			const { isSafeInteger, isNaN } = Number, v0 = Number(v);
			
			if (isNaN(v0)) {
				
				switch (v) {
					
					case 'true': case 'false':
					return v === 'true';
					
					case 'null':
					return null;
					
					case 'undefined':
					return undefined;
					
					default:
					throw new SyntaxError(`Caught an unknown value "${v}"`);
					
				}
				
			}
			
			return isSafeInteger(v0) ? v0 : parseFloat(v0);
			
		}
		
	}
	
	get str() {
		
		return this[MicroParser.$str];
		
	}
	set str(v) {
		
		const { isArray } = Array, { cache } = this;
		let k,k0, c;
		
		for (k in cache) {
			
			if (isArray(c = cache[k])) {
				
				c.length = 0;
				
			} else if (c && typeof c === 'object') {
				
				for (k0 in c) delete c[k0];
				
			} else delete cache[k];
			
		}
		
		this[MicroParser.$str] = v;
		
	}
	
}