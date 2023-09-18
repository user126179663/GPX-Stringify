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
		
		return a.l.chrIndex - b.l.chrIndex;
		
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
	
	static $afx = Symbol('MicroParser.afx');
	static $bkt = Symbol('MicroParser.bkt');
	static $cap = Symbol('MicroParser.cap');
	static $enc = Symbol('MicroParser.enc');
	static $exc = Symbol('MicroParser.exc');
	static $gc = Symbol('MicroParser.gc');
	static $parse = Symbol('MicroParser.parse');
	static $sep = Symbol('MicroParser.sep');
	
	static affixL = '[';
	static affixR = ']';
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
			globals[++gi] = bound, i += (i0 - i) - 1;
			//indices.splice(i + 1, i0 = i0 - 1 - i), i -= i0, l -= i0;
			
		}
		
		return globals;
		
	}
	
	static getExcluded(chrIndices, ...bounds) {
		
		const bl = bounds.length && (bounds = MicroParser.getGlobalBounds(...bounds)).length;
		
		if (bl) {
			
			const cl = chrIndices.length, excluded = [];
			let i, ci,cIdx,cEnd, bi,bi0,bIdx,bEnd, ei, lastBIdxREnd;
			//const dev = chrIndices?.[0]?.executor[MicroParser.$str] === 'points("d", "0%", "date")';
			
			i = bi = bi0 = ei = -1;
			while (++i < cl) {
				
				cEnd = (cIdx = chrIndices[i]).end, lastBIdxREnd = -1;
				
				// このループから抜ける時は、現在のセパレーターの位置が、文字列中に存在するすべての括弧外にあり、かつ左方に存在している。
				while (++bi < bl && (cEnd > (bIdx = bounds[bi]).l.end || cEnd < lastBIdxREnd)) lastBIdxREnd = bIdx.r.end;
				//while (++bi < bl && ((cEnd > (bIdx = bounds[bi]).l.end && cEnd < bIdx.r.end) || cEnd > bIdx.r.end));
				
				
				//if (bi !== bl) {
				if (bi < bl) {
					
					bi > bl && (bi = bl);
					while (++bi0 < bi) excluded[++ei] = bounds[bi0];
					--bi, --bi0, excluded[++ei] = cIdx, ci = undefined;
					
				} else {
					
					bounds[bl - 1].r.end < cEnd && (ci = --i);
					break;
					
				}
				
			}
			//hi(cl,bi,bi0,bl, bi0 === -1 || bi0 !== bi,excluded,chrIndices,bounds);
			//if ((!cl && (bi = bl)) || bi0 === -1 || bi0-- !== bi) while (++bi0 < bi) excluded[++ei] = bounds[bi0];
			if ((!cl && (bi = bl)) || bi0 === -1 || bi0 !== bl) while (++bi0 < bl) excluded[++ei] = bounds[bi0];
			
			//if (ci-- !== undefined) while (++ci < cl) excluded[++ei] = chrIndices[ci];
			if (ci !== undefined) while (++ci < cl) excluded[++ei] = chrIndices[ci];
			
			return excluded;
			
		}
		
		return [ ...chrIndices ];
		
	}
	
	// パースに使われる記号は主に以下のコンストラクターの gc に指定されたものを共有する。
	// 引数 gc にはオブジェクト GlobalCapturer のインスタンスを指定するが、未指定の場合は同オブジェクトの既定値でインスタンスが作られる。
	// メソッド update を通じて gc を別のインスタンスに置き換えると、パースに使われる他のオブジェクトの記号も同じものに置き換わる。
	// update を通じた変更であれば上記のようにインスタンス全体に反映されるが、
	// gc に指定したインスタンスのプロパティやメソッドを使って個別に変更してもそれはこのオブジェクトの他のインスタンスには反映されない。
	
	constructor(str, gc, bracketL, bracketR, affixL, affixR, sep) {
		
		super(str);
		
		const	{ $afx, $bkt, $cap, $enc, $gc, $sep } = MicroParser,
				{ constructor: { affixL: afxL, affixR: afxR, bracketL: bktL, bracketR: bktR, separator: _sep } } = this;
		
		this[$gc] = gc = gc instanceof GlobalCapturer ? gc : new GlobalCapturer(str),
		
		this[$enc] = new MicroEnclosure(str, gc.enc, gc.esc),
		this[$cap] = new MicroCapturer(str, gc.L, gc.R, gc.esc),
		this[$bkt] = new MicroCapturer(str, bracketL || bktL, bracketR || bktR, gc.esc),
		this[$afx] = new MicroCapturer(str, affixL || afxL, affixR || afxR, gc.esc),
		this[$sep] = sep || _sep;
		
	}
	
	// CO = MicroCoParser
	createCO(coOrMp = this, str) {
		
		if (!(coOrMp instanceof MicroParser)) throw new TypeError();
		
		const	{ $afx, $bkt } = MicroParser,
				{ cache: { co } } = this,
				l = co.length,
				{ L: bracketL, R: bracketR } = this[$bkt],
				{ L: affixL, R: affixR } = this[$afx],
				gc = this.createGCFromMP(coOrMp, str);
		let i, c;
		
		i = -1;
		while	(
					++i < l &&
					!(
						(c = co[i]).gc === gc &&
						c.bracketL === bracketL &&
						c.bracketR === bracketR &&
						c.affixL === affixL &&
						c.affixR === affixR
					)
				);
		
		return i === l ?	(co[i] = { $: new MicroCoParser(str, gc, bracketL, bracketR, affixL, affixR), gc, bracketL, bracketR, affixL, affixR }).$ :
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
			
			const { L, R, enc, esc } = mp[MicroParser.$gc];
			
			return (gc[i] = { $: new GlobalCapturer(str, L, R, enc, esc), mp }).$;
			
		} else return arguments.length > 1 ? (gc[i].str = str, gc[i].$) : gc[i].$;
		
	}
	
	// MP = MicroParser
	createMP(mp = this, str) {
		
		if (!(mp instanceof MicroParser)) throw new TypeError();
		
		const	{ $afx, $bkt, $sep } = MicroParser,
				{ cache: { mp: cached } } = this,
				l = cached.length,
				{ L: bracketL, R: bracketR } = mp[$bkt],
				{ L: affixL, R: affixR } = mp[$afx],
				gc = this.createGCFromMP(mp, str),
				sep = mp[$sep];
		let i, m;
		
		i = -1;
		while	(
					++i < l &&
					!(
						(m = cached[i]).gc === gc &&
						m.bracketL === bracketL && m.bracketR === bracketR &&
						m.affixL === affixL && m.affixR === affixR &&
						m.sep === sep
					)
				);
		
		return	i === l ?
						(
							cached[i] =	{
												$: new MicroParser(str, gc, bracketL, bracketR, affixL, affixR, mp[$sep]),
												gc,
												bracketL, bracketR,
												affixL, affixR,
												sep
											}
						).$ :
						arguments.length > 1 ? (m.$.str = str, m.$) : m.$;
		
	}
	
	exc(str) {
		
		const { cache: { executed } } = this;
		
		return	executed?.[str = arguments.length ? (this.str = str) : (str = this.str)] ??
						(executed[str] = this[MicroParser.$exc]());
		
	}
	
	parse() {
		
		return this[MicroParser.$parse]();
		
	}
	_split() {
		
		const { $afx, $bkt, $cap, $enc, $gc, $sep, $str, getExcluded } = MicroParser,
				sep = this[$sep],
				sepIndices =	getExcluded(
										this[$gc].escape(sep, undefined, undefined, true),
										...this[$enc].enclose(),
										...this[$cap].capture(undefined, true),
										...this[$bkt].capture(undefined, true),
										...this[$afx].capture(undefined, true)
									),
				l = sepIndices.length,
				str = this[$str],
				splitted = [],
				dev = str.indexOf(',,') > -1 || str === 'points("d", "0%", "date")';
		let i,i0, indexStart, sepIndex, sliced, dev0,dev1, lastBoundEndIndex;
		//coco "{0 1 2}" が [ "0", "1", "2" ] にならない [ "0", "", "1", "", "2" ] のようになる。
		i = i0 = -1, indexStart = 0;
		while (++i < l)	'l' in (sepIndex = sepIndices[i]) ?
									(
										(sliced = str.slice(indexStart, lastBoundEndIndex = sepIndex.l.chrIndex).trim()) &&
											(splitted[++i0] = sliced),
										(sliced = str.slice(lastBoundEndIndex, lastBoundEndIndex = sepIndex.r.end).trim()) &&
											(splitted[++i0] = sliced),
										dev && hi('brk', indexStart, lastBoundEndIndex)
									) :
									// 以下の処理はセパレーターによって区切られた部分を切り出している。恐らく原則空文字が入る。
									// これによって例えば [ 0, 1, , 3, ] などで三番目と五番目の要素がパース上認識できるようになると思われる。
									//(splitted[++i0] = str.slice(indexStart, (sepIndex = sepIndices[i]).chrIndex).trim(), hi(sepIndices,splitted,str,indexStart,sepIndex.chrIndex)),
									(
										hi('sep', str, indexStart, sepIndices[i].chrIndex, indexStart === sepIndices[i].chrIndex),
										(lastBoundEndIndex === undefined || lastBoundEndIndex === sepIndex.chrIndex) &&
												(
													splitted[++i0] = str.slice(indexStart, sepIndex.chrIndex).trim(),
													lastBoundEndIndex = undefined
												)
									),
								indexStart = sepIndex.end;
		(sliced = str.slice(indexStart).trim()) && (splitted[++i0] = sliced);
		dev && hi(str,splitted,sepIndices);
		return splitted;
		
	}
	split() {
		
		const { $afx, $bkt, $cap, $enc, $gc, $sep, $str, getExcluded } = MicroParser,
				sep = this[$sep],
				sepIndices =	getExcluded(
										this[$gc].escape(sep, undefined, undefined, true),
										...this[$enc].enclose(),
										...this[$cap].capture(undefined, true),
										...this[$bkt].capture(undefined, true),
										...this[$afx].capture(undefined, true)
									),
				l = sepIndices.length,
				str = this[$str],
				splitted = [],
				dev = str.indexOf(',,') > -1 || str === 'points("d", "0%", "date")';
		let i,i0, indexStart, sepIndex,sepBoundEndIndex, sliced;
		//coco "{0 1 2}" が [ "0", "1", "2" ] にならない [ "0", "", "1", "", "2" ] のようになる。
		i = i0 = -1, indexStart = 0;
		while (++i < l)	'l' in (sepIndex = sepIndices[i]) ?
									// 以下の処理は、一番外側の境界に収まっている部分を切り出している。
									(
										(sliced = str.slice(indexStart, (sepBoundEndIndex = sepIndex.l.chrIndex)).trim()) &&
											(splitted[++i0] = sliced),
										(sliced = str.slice(sepBoundEndIndex, sepBoundEndIndex = sepIndex.r.end).trim()) &&
											(splitted[++i0] = sliced),
										//dev && hi('brk', indexStart, sepBoundEndIndex),
										indexStart = sepBoundEndIndex
									) :
									// 以下の処理はセパレーターによって区切られた部分を切り出している。恐らく原則空文字が入る。
									// これによって例えば [ 0, 1, , 3, ] などで三番目と五番目の要素がパース上認識できるようになると思われる。
									//(splitted[++i0] = str.slice(indexStart, (sepIndex = sepIndices[i]).chrIndex).trim(), hi(sepIndices,splitted,str,indexStart,sepIndex.chrIndex)),
									(
										//hi('sep', str, indexStart, sepBoundEndIndex, sepIndex.chrIndex, indexStart=== sepIndex.chrIndex),
										(sepBoundEndIndex === undefined || sepBoundEndIndex !== indexStart) &&
											(splitted[++i0] = str.slice(indexStart, sepIndex.chrIndex).trim()),
										sepBoundEndIndex = undefined,
										indexStart = sepIndex.end
									);
		
		((sliced = str.slice(indexStart).trim()) || !('l' in sepIndex)) && (splitted[++i0] = sliced);
		//dev && hi(str,splitted,sepIndices);
		return splitted;
		
	}
	
	// このメソッドを通じて各値を変更した場合、例えば引数に現在使われてる値と同じ値を指定してもキャッシュの初期化が発生するように、
	// 引数の指定がキャッシュの初期化を引き起こすトリガーになっており、厳密に値の変化に追従しない点に注意が必要。
	update(gc, bracketL, bracketR, affixL, affixR, esc, disablesStructure) {
		
		const { $afx, $bkt, $gc } = MicroParser, { cache: { co, mp } } = this;
		let i,l, cached, structures;
		
		if (gc instanceof GlobalCapturer && gc !== this[$gc]) {
			
			this[$gc] = gc;
			
			const	{ $cap, $enc } = MicroParser,
					{ L, R, enc: E, esc } = gc,
					afx = this[$afx],
					bkt = this[$bkt],
					cap = this[$cap],
					enc = this[$enc],
					{ str } = this;
			
			enc instanceof MicroEnclosure && (enc.enc = E, enc.esc = esc),
			cap instanceof MicroCapturer && (cap.L = L, cap.R = R, cap.esc = esc),
			bkt instanceof MicroCapturer && (bkt.esc = esc),
			afx instanceof MicroCapturer && (afx.esc = esc),
			
			structures = !disablesStructure;
			
		}
		
		if (bracketL || bracketR) {
			
			const bkt = this[$bkt];
			
			bracketL && (bkt.L = bracketL), bracketR && (bkt.R = bracketR),
			
			structures ||= !disablesStructure;
			
		}
		
		if (affixL || affixR) {
			
			const afx = this[$afx];
			
			affixL && (afx.L = affixL), affixR && (afx.R = affixR),
			
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
			
			const { $afx, $bkt, $cap, $enc } = MicroParser, { cache: { co, gc, mp } } = this;
			let i,l, cached;
			
			this[$enc].esc = this[$cap].esc = this[$bkt].esc = this[$afx].esc = gc.esc = esc,
			
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
		
		const { $str } = MicroCore, { $afx, $bkt, $cap, $enc, $gc } = MicroParser;
		
		this[$str] = str,
		this[$enc] && (this[$enc].str = str),
		this[$cap] && (this[$cap].str = str),
		this[$bkt] && (this[$bkt].str = str),
		this[$afx] && (this[$afx].str = str),
		this[$gc] && (this[$gc].str = str),
		
		this.structureCache();
		
	}
	
	get affixL() {
		
		return this[MicroParser.$afx].L;
		
	}
	set affixL(v) {
		
		this.update(undefined, undefined, undefined, v);
		
	}
	get affixR() {
		
		return this[MicroParser.$afx].R;
		
	}
	set affixR(v) {
		
		this.update(undefined, undefined, undefined, undefined, v);
		
	}
	get afx() {
		
		return this[MicroParser.$afx];
		
	}
	get bracketL() {
		
		return this[MicroParser.$bkt].L;
		
	}
	set bracketL(v) {
		
		this.update(undefined, v);
		
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
			{ isNaN } = Number,
			{ afx: { L: afxL, R: afxR }, bkt: { L: bktL, R: bktR }, cap: { L: capL, R: capR }, enc: { enc }, esc } = this,
			bktLL = bktL.length, bktRL = bktR.length,
			afxLL = afxL.length, afxRL = afxR.length,
			capLL = capL.length, capRL = capR.length,
			encLength = enc.length,
			params = this.split(),
			executed = [];
	let i,l, p,p0, ei, labeled, args;
	
	i = ei = -1, l = params.length;
	while (++i < l) {
		
		if ((p = params[i]).slice(0, bktLL) === bktL && p.slice(-bktRL) === bktR) {
			
			args = this.createCO(this, p.slice(bktLL, -bktRL)).exc(),
			labeled && !('args' in labeled) ?	(labeled.args = args, labeled = null) :
															(executed[++ei] = { args }, labeled = null);
			
		} else if (p.slice(0, afxLL) === afxL && p.slice(-afxRL) === afxR) {
			
			args = this.createCO(this, p.slice(afxLL, -afxRL)).exc(),
			labeled && !('args' in labeled) ?
				('affix' in labeled ? labeled.affix[labeled.affix.length] = args : labeled.affix = [ args ]) :
				(executed[++ei] = args, labeled = null);
			
		} else if (p.slice(0, capLL) === capL && p.slice(-capRL) === capR) {
			
			labeled = null,
			//executed[++ei] = this.createMP(this, p.slice(capLL, -capRL)).exc();
			executed[++ei] = this.createMP(this, p.slice(capLL, -capRL));
			
		} else if (p.slice(0, encLength) === enc && p.slice(-encLength) === enc) {
			
			labeled = null,
			executed[++ei] = p.slice(encLength, -encLength);
			
		} else if (p) {
			
			switch (p) {
				case 'true': case 'false':
				executed[++ei] = p === 'true';
				break;
				case 'null':
				executed[++ei] = null;
				break;
				case 'undefined':
				executed[++ei] = undefined;
				break;
				default:
				p && (executed[++ei] = isNaN(p0 = Number(p)) ? (labeled = { label: p }) : p0);
			}
			
			(executed[ei] && typeof executed[ei] === 'object') || (labeled = null);
			
		}
		
	}
	
	return executed;
	
},
MicroParser.prototype[MicroParser.$parse] = function () {
	
	const parsed = this[MicroParser.$gc].exc(), l = parsed.length;
	let i, p;
	
	i = -1;
	while (++i < l) typeof (p = parsed[i]) === 'object' && (parsed[i] = this.createMP(this, ''+p).exc());
	
	return parsed;
	
};
class MicroCoParser extends MicroParser {
	
	static separator = ',';
	
	constructor() {
		
		super(...arguments);
		
	}
	
	[MicroParser.$exc]() {
		
		const	{ isNaN } = Number,
				{ restore } = MicroEscaper,
				{ afx: { L: afxL, R: afxR }, bkt: { L: bktL, R: bktR }, cap: { L: capL, R: capR }, enc: { enc }, esc } = this,
				bktLL = bktL.length, bktRL = bktR.length,
				afxLL = afxL.length, afxRL = afxR.length,
				capLL = capL.length, capRL = capR.length,
				encL = enc.length,
				params = this.split(),
				executed = [];
		let i,l,i0, v, p;
		
		i = i0 = -1, l = params.length;
		while (++i < l) {
			
			if ((p = params[i]).slice(0, bktLL) === bktL && p.slice(-bktRL) === bktR) {
				
				const { co } = this;
				
				v =	(co instanceof MicroCoParser ? co : (this.co = new MicroCoParser(undefined, esc))).
							exc(p.slice(bktLL, -bktRL));
				
			} else if (p.slice(0, afxLL) === afxL && p.slice(-afxRL) === afxR) {
				
				const { co } = this;
				
				v =	(co instanceof MicroCoParser ? co : (this.co = new MicroCoParser(undefined, esc))).
							exc(p.slice(afxLL, -afxRL));
				
			} else if (p.slice(0, capLL) === capL && p.slice(-capRL) === capR) {
				
				const { mp } = this;
				
				v =	(mp instanceof MicroParser ? mp : (this.mp = new MicroParser(undefined, esc))).
							exc(p.slice(capLL, -capRL));
				
			} else if (p.slice(0, encL) === enc && p.slice(-encL) === enc) {
				
				v = restore(p.slice(encL, -encL), esc);
				
			} else /*if (p)*/ {
				
				switch (p) {
					
					case 'true': case 'false':
					v = p === 'true';
					break;
					
					case 'null':
					v = null;
					break;
					
					case 'undefined':
					v = undefined;
					break;
					
					default:
					//if (isNaN(v = Number(p))) throw new TypeError();
					//params[i] = v;
					v = p === '' ? undefined : isNaN(v = Number(p)) ? new TypeError() : v;
					//params[i] = p === '' ? ++i0 && (i0 = -1, undefined) : isNaN(v = Number(p)) ? new TypeError() : v;
					
				}
				
			}// else params.splice(i--, 1), --l;
			
			
			executed[++i0] = v;
			
		}
		//hi(params,executed);
		return executed;
		
	}
	
}