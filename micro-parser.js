class MicroCore {
	
	static $str = Symbol('MicroCore.str');
	static cache = {};
	
	// 循環参照には非対応
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
			
		}
		
	}
	
	static objectKeys(object) {
		
		return object?.constructor === Object ? [ ...Object.keys(object), ...Object.getOwnPropertySymbols(object) ] : [];
		
	}
	
	constructor(str) {
		
		this.str = str;
		
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
class MicroEscaper extends MicroCore {
	
	static $esc = Symbol('MicroEscaper.esc');
	
	static cache = { [MicroEscaper.$esc]: {} };
	
	static esc = '\\';
	
	constructor(str) {
		
		super(str);
		
	}
	
	//escape(chr, fromIndex = 0) {
	//	
	//	const	{ cache } = this;
	//	
	//	if (!(chr in cache)) for (const v of this.escaping(chr, fromIndex));
	//	
	//	return cache[chr];
	//	
	//}
	
	escape(chr = this.constructor.esc, fromIndex = 0, toIndex, includes) {
		
		const	{ $esc } = MicroEscaper, { cache } = this, cch = cache[$esc];
		let i,i0, indices, startIndex, index;
		
		if (chr in cch)
			indices = cch[chr][includes ? 'included' : 'excluded'];
		else {
			
			const	{ sort } = MicroEscaper,
					{ constructor: { esc }, str } = this,
					escLength = esc.length,
					chrLength = chr.length,
					escMode = esc === chr,
					findMethod = escMode ? 'lastIndexOf' : 'indexOf',
					included = [],
					excluded = [];
			let currentIndex, escIndex, foundIndex, escaped;
			
			i = i0 = -1, currentIndex = escMode ? str.length : 0, cch[chr] = { included, excluded };
			while ((foundIndex = escIndex = str[findMethod](chr, currentIndex)) !== -1) {
				
				while ((escIndex -= escLength) > -1 && str.substr(escIndex, escLength) === esc);
				
				(escaped = ((foundIndex - (escIndex += escLength)) % 2)),
				
				included[++i] = { chr, end: foundIndex, esc, escaped, executor: this, start: escIndex },
				escaped || (excluded[++i0] = included[i]);
				
				if ((currentIndex = escMode ? --escIndex : foundIndex + chrLength) < 0 && escMode) break;
				
			}
			
			escMode && (included.reverse(), excluded.reverse()), indices = includes ? included : excluded;
			
		}
		
		const l = indices.length;
		
		i = i0 = -1, toIndex ??= Infinity, fromIndex > toIndex && (toIndex = fromIndex);
		while (++i < l && (index = indices[i]).end <= toIndex) startIndex ?? (fromIndex <= index.end && (startIndex = i));
		
		return indices.slice(startIndex, i);
		
	}
	
}
class GlobalCapturer extends MicroEscaper {
	
	static L = '{';
	static R = '}';
	static enc = '"';
	
	constructor(str) {
		
		super(str);
		
	}
	
	exc() {
		
		const { constructor: { L }, str } = this, lIds = this.escape(L), lIdsLength = lIds.length;
		
		if (!lIdsLength) return str;
		
		const { constructor: { R } } = this, rIds = this.escape(R), rIdsLength = rIds.length
		
		if (!rIdsLength) return str;
		
		const	{ constructor: { enc } } = this,
				encIndices = this.escape(enc, lIds[0].end, rIds[rIdsLength - 1].start),
				encIndicesLength = encIndices.length,
				sealedLIndices = [],
				sealedRIndices = [],
				skippedLIndices = [],
				skippedRIndices = [],
				parsed = [];
		let i,l,i0,l0,i1,i2, sldLIdsI,sldRIdsI,skpLIdsI,skpRIdsI, esci, lIdx,lIdx0,lIdx0End,rIdx, pi, result;
		
		// todo: 出力前のエスケープ文字の処理。
		
		// ルールは、エスケープが必要な文字は、ブロック外ではブロックの両端を示す { }、ブロック内では原則必要ないが、
		// 文字列を示す " で囲んだ中では、" をエスケープする必要がある。それら以外は、ブロック内でも外でもエスケープする必要はない。
		// そのため、プログラム上でブロックを認識するには、限られた情報からその境界を定めなくてはならない。
		// またひとつのテキスト中で任意の数のブロックを埋め込むことができる。さらにブロックはネストも許容する。
		
		// 基本的なアイデアは、どんなテキストでも、エスケープされていない最初の { は最初のブロックの左端境界であることが確定していると言うことである。
		// ブロックのキャプチャ処理は、このアイデアに基づいて、またそれを起点として行なわれる。
		
		// 一番最初の { は " で囲われていないことが論理上確定しているので処理の起点としてそのまま使われる。
		// ただしループの二周目以降の { は、それ以前の処理を通じて " で囲われていないことを確認しておく必要がある。
		i = sldLIdsI = sldRIdsI = skpLIdsI = skpRIdsI = pi = -1, parsed[++pi] = 0;
		while (++i < lIdsLength) {
			
			// 既に " で囲われてることが確認されている { はここで処理を回避する。
			i0 = -1, l0 = sldLIdsI + 1;
			while (++i0 < l0 && sealedLIndices[i0] !== i);
			if (i0 < l0) continue;
			
			// 現在の { を境界左端と仮定した状態で、それと対になる } を配列の先頭から検索する。
			i0 = -1, lIdx = lIds[i];
			while (++i0 < rIdsLength) {
				
				// このループで重要な点として、現在の { が左の境界と言うことが確定しているとすれば、
				// その内部に " が存在していれば、最初の " のあとに現われる " は、自動的に対とすることができると言う仮定を用いている。
				// そうでなければ、{ } の中にエスケープされていない " が単体で存在することは許されないためシンタックスエラーになることを意味する。
				// そのため、現在の { を左端として仮定するのと同じように、最初とその次に現われる " をペアとして仮定する。
				// すると、{ のあとに現われる } が " の前に存在していれば、それが現在の { とペアになるかはともかく、どこかしらの境界と判断できる。
				// またペアになった " の中に存在していればそれは文字列で無視できる。
				// " のあとに存在していれば、それは境界の可能性があるが、仮定した " のペアの、まだ存在が確認されていない次のペア内に存在する可能性があるため、
				// 現在の } のまま、" のペアだけ次に移す処理をしてこのループ内の処理をやり直す。
				// そうした結果、ペアと仮定した " の前に } があることを確認できれば、次はその } の直前に現われる { を検索する。
				// ここまでの処理で、現在の } の前に存在する " のペアは確認できているため、その { がそれらの中に存在しないことを確認して、
				// もしループの最初の { よりも前に " に囲まれていない { を見つけたら、
				// それは現在の } とペアと考えることはできるが、現在は最初の { とペアになる } を探しているため、
				// その { }  は、最初の { の中にネストするペアとして、{ は今後確認する必要がないものとして記録して、
				// 再度 } のループの最初からやり直す。この時、} は最初に使った } の次の } に移している。
				// そうして { が最初の { の直近にある " よりも前に存在して、さらにそれが最初の { と一致していれば、
				// 現在の } と、ループの最初の { が一番外側のペアとして確定させられる。
				// 仮に { よりも前に別の { が存在していれば、やはり次の } からループをやり直す。
				// 結果、外側のテキストと内部の書式の境界が完全に確定する。
				// これは同時に、確定した境界以前の " のペアも境界で隔てることができるようになったことを意味する。
				// 次のループから始まる { は自動的に次のブロックの左端境界であることが確定しているので、
				// 今確定したブロックと現在の { の間にあるテキスト内に " が存在していても、それは通常の文字列であることが確定させられる。
				
				// 現在の } が文字列であるかどうかの確認。その場合、何も処理せずにループを次に進める。
				i1 = -1, l0 = sldRIdsI + 1;
				while (++i1 < l0 && sealedRIndices[i1] !== i0);
				if (i1 < l0) continue;
				i1 = -1, l0 = skpRIdsI + 1;
				while (++i1 < l0 && skippedRIndices[i1] !== i0);
				if (i1 < l0) continue;
				
				rIdx = rIds[i0];
				
				// テキスト中に " が存在しないか、現在の } が、現在の " の左端境界よりも前方に存在している場合。
				// この時のみ、ブロックの境界確定判定処理に入れる。
				if	(!encIndicesLength || rIdx.end < encIndices[esci].end) {
					
					// { を後方から走査し、現在の } の直前に現われる { を検索する。
					i1 = lIdsLength;
					while (--i1 > i - 1) {
						
						// 上記 { が存在すれば、それは現在の } とのペア候補となる。
						if	(
								(lIdx0 = lIds[i1]).end < rIdx.end &&
								sealedLIndices.indexOf(i1) === -1 &&
								skippedLIndices.indexOf(i1) === -1
							)
						{
							//hi(i,i1,i0);
							if (encIndicesLength && lIdx0 !== lIds[i]) {
								
								// 現在の } とペアになり得る { が、いずれかの " 内の文字列であるかどうかを後方から確認する。
								// そうであった場合、このループは途中で処理を打ち切られ、
								// ペアの候補だった { は対象外とされ、外側のループに戻り次の { の検索を再開する。。
								// そうでなかった場合、このループは終端で止まり、外側のループを強制的に抜け出し、ペアの候補を今のループ内の { で確定する。
								// この時、確定するのは候補であることだけで、まだ実際のペアであるかどうかの確定は保留されている。
								
								i2 = esci, lIdx0End = lIdx0.end;
								while ((i2 -= 2) > -1 && (lIdx0End < encIndices[i2].end || lIdx0End > encIndices[i2 + 1].end));
								
								// 候補の { が " で囲まれていた場合、それは文字列として記録し、ループを次の { に進めてやり直す。
								
								if (i2 > -1) {
									
									sealedLIndices[++sldLIdsI] = i1;
									continue;
									
								}
								
								//if (i2 < 0) break; else (sealedLIndices[sealedLIndices.length] = i1);
								
							}
							
							// これまでの処理で候補として確定した { が、一番外側のループ処理の対象となっている現在の { と同じものであれば
							// 現在の } ペアとしてブロックの境界が確定する。
							// 異なるものだった場合、それは文字列として今後も候補の対象としないように記録した上で、ループを次の { に進める。
							
							if (lIdx0 === lIdx) {
								
								// こうして確定したブロックの内部の文字列は、その外側のテキストとは切り離して、
								// ブロックの境界をまたぐ際のルールに制約されることなくパースを行なうことができるようになる。
								
								// parsed[parsed.length] = new MicroParser(this.str.slice(lIds[i].end + 1, rIds[i].start)).exc(),
								//parsed[++pi] = str.slice(0, lIdx.end),
								//parsed[++pi] = str.slice(rIdx.end + 1),
								parsed[++pi] = lIdx.end,
								parsed[++pi] = str.slice(lIdx.end + 1, rIdx.end),
								parsed[++pi] = rIdx.end + 1,
								
								sealedLIndices[++sldLIdsI] = i,
								sealedRIndices[++sldRIdsI] = i0,
								
								skippedLIndices.length = skippedRIndices.length = 0,
								skpLIdsI = skpRIdsI = -1;
								
							} else {
								
								sealedLIndices[++sldLIdsI] = i1,
								sealedRIndices[++sldRIdsI] = i0;
								
							}
							//hi(i,i1,i0,skippedLIndices,skippedRIndices);
							break;
							
							// // 現在の } とペアになり得る { が、いずれかの " 内の文字列であるかどうかを後方から確認する。
							// // そうであった場合、このループは途中で処理を打ち切られ、
							// // ペアの候補だった { は対象外とされ、外側のループに戻り次の { の検索を再開する。。
							// // そうでなかった場合、このループは終端で止まり、外側のループを強制的に抜け出し、ペアの候補を今のループ内の { で確定する。
							// // この時、確定するのは候補であることだけで、まだ実際のペアであるかどうかの確定は保留されている。
							// i2 = esci, lIdx0End = lIdx0.end;
							// while ((i2 -= 2) > -1 && lIdx0End > (encIdxEnd = encIndices[i2]).end && lIdx0End < encIdxEnd);
							// 
							// //if (i2 < 0) break; else (sealedLIndices[sealedLIndices.length] = i1);
							// 
							// // 上記ループ内で候補として確定した { が、一番外側のループ処理の対象となっている現在の { と同じものであれば
							// // 現在の } ペアとしてブロックの境界が確定する。
							// // 異なるものだった場合、それは文字列として今後も候補の対象としないように記録した上で、
							// // ループをやり直し別の候補を検索し直す。
							// if (i2 < 0 && lIdx0 === lIds[i]) {
							// 	
							// 	// こうして確定したブロックの内部の文字列は、その外側のテキストとは切り離して、
							// 	// ブロックの境界をまたぐ際のルールに制約されることなくパースを行なうことができるようになる。
							// 	
							// 	parsed[parsed.length] = new MicroParser(this.str.slice(lIds[i].end + 1, rIds[i].start)).exc();
							// 	
							// 	break;
							// 	
							// } else lIdx0 && (sealedLIndices[++sldLIdsI] = i1);
							
						}
						
					}
					
					//if (lIds[i1] !== lIds[i]) {
					//	
					//	sealedLIndices[sealedLIndices.length] = i1;
					//	continue;
					//	
					//}
					
					
				} else {
					
					// このブロックに入った場合、現在の } は、現在の { のあとにある " 内の文字列であるか、それよりも後方にあると判断される。
					// 現在の " よりも後方だった場合、" を現在のものから次の " のペアに移した上で、現在の } まま、今のループをやり直す。
					// 文字列だった場合、それを記録してループを次の } に進める。
					
					rIdx.end > escIndices[esci + 1].end ? (esci += 2, --i0) : (sealedRIndices[++sldRIdsI] = i0);
					
				}
				
				if (lIdx0 === lIdx) break;
				
			}
			
			//if (capR[i0].end < escIndices[esci].end) {
			//	
			//	
			//} else if (capR[i0].end > escIndices[esci + 1].end) {
			//}
			//escIndices[esci]
			//
			//cL = capL[li = i], l0 = (cR = capR[++ri]).end;
			//while (++li < capLLength && capL[li].end < cR.end) conL.indexOf(li);
			//
			//if (i !== li) {
			//	--i;
			//	continue;
			//}
			//
			//i0 = -1, cL = capL[i];
			//while (++i0 < capRLength && ((cR = capR[i0]).escaped || (cL.end > cR.end && confirmed.indexOf(i0) !== -1)));
			//
			//if (i0 < capRLength) {
			//	
			//	this.enc.
			//	
			//}
			
		}
		
		parsed[++pi] = str.length;
		
		i = -2, l = pi + 1, result = '';
		while ((i += 2) < l) result += typeof parsed[i] === 'string' ? (--i, '') : str.slice(parsed[i], parsed[i + 1]);
		hi(str, parsed);
		return result;
		
	}
	
}
class MicroCapturer extends MicroEscaper {
	
	static capL = '{';
	static capR = '}';
	
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
	
	constructor(str) {
		
		super(str);
		
	}
	
	exec() {
		
		const	{ constructor: { esc, capL, capR } } = this;
		
	}
	
	capture(structures, unescapes, updates) {
		
		const	{ cache } = this,
				cacheKey = `${structures ? 'structured' : 'serialized'}-${(unescapes ? 'unescaped' : 'escaped')}`;
		
		if (!updates && cacheKey in cache) return cache[cacheKey];
		
		const	{ constructor: { capL, capR, sort, structure } } = this,
				lIndices = this.escape(capL),
				rIndices = this.escape(capR),
				rLength = rIndices.length,
				confirmed = [],
				indices = [];
		let i,i0,i1,i2, lIndex,rIndex;
		
		i = lIndices.length, i1 = i2 = -1;
		while (++i > -1) {
			
			if (unescapes && (lIndex = lIndices[i]).escaped) continue;
			
			i0 = -1, lIndex = lIndices[i];
			while	(
						++i0 < rLength &&
						!(unescapes && (rIndex = rIndices[i0]).escaped) &&
						lIndex.start < rIndex.start &&
						confirmed.indexOf(i0) === -1
					);
			
			if (i0 === rLength) throw SyntaxError(`Unexpected token: "${capL}".`);
			
			indices[++i1] = { l: lIndex, r: rIndices[confirmed[++i2] = i0] };
			
		}
		
		if (++i2 < rLength) throw SyntaxError(`Unexpected token: "${bracketR}".`);
		
		return cache[cacheKey] = structures ? structure(indices) : indices.sort(sort);
		
	}
	
}
class MicroEnclosure extends MicroEscaper {
	
	static enc = '"';
	
	constructor(str) {
		
		super(str);
		
	}
	
	enclose() {
		
		const	{ constructor: { enc } } = this,
				indices = this.escape(enc);
		
		//coco 例えば 'abc"def{a(0,1,"{a",2)}g"h{b("a\\"b}cd")}i"j' と言うケースに耐え得る設計
		
		
		
	}
	
	enclosing() {
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