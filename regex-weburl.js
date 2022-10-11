//
// Regular Expression for URL validation
//
// Author: Diego Perini
// Created: 2010/12/05
// Updated: 2018/09/12
// License: MIT
//
// Copyright (c) 2010-2018 Diego Perini (http://www.iport.it)
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
//
// the regular expression composed & commented
// could be easily tweaked for RFC compliance,
// it was expressly modified to fit & satisfy
// these test for an URL shortener:
//
//   http://mathiasbynens.be/demo/url-regex
//
// Notes on possible differences from a standard/generic validation:
//
// - utf-8 char class take in consideration the full Unicode range
// - TLDs have been made mandatory so single names like "localhost" fails
// - protocols have been restricted to ftp, http and https only as requested
//
// Changes:
//
// - IP address dotted notation validation, range: 1.0.0.0 - 223.255.255.255
//   first and last IP address of each class is considered invalid
//   (since they are broadcast/network addresses)
//
// - Added exclusion of private, reserved and/or local networks ranges
// - Made starting path slash optional (http://example.com?foo=bar)
// - Allow a dot (.) at the end of hostnames (http://example.com.)
// - Allow an underscore (_) character in host/domain names
// - Check dot delimited parts length and total length
// - Made protocol optional, allowed short syntax //
//
// Compressed one-line versions:
//
// Javascript regex version
//
// /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i
//
// PHP version (uses % symbol as delimiter)
//
// %^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\x{00a1}-\x{ffff}][a-z0-9\x{00a1}-\x{ffff}_-]{0,62})?[a-z0-9\x{00a1}-\x{ffff}]\.)+(?:[a-z\x{00a1}-\x{ffff}]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$%iuS
//
//var re_weburl = new RegExp(
//  "^" +
//    // protocol identifier (optional)
//    // short syntax // still required
//    "(?:(?:(?:https?|ftp):)?\\/\\/)" +
//    // user:pass BasicAuth (optional)
//    "(?:\\S+(?::\\S*)?@)?" +
//    "(?:" +
//      // IP address exclusion
//      // private & local networks
//      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
//      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
//      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
//      // IP address dotted notation octets
//      // excludes loopback network 0.0.0.0
//      // excludes reserved space >= 224.0.0.0
//      // excludes network & broadcast addresses
//      // (first & last IP address of each class)
//      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
//      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
//      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
//    "|" +
//      // host & domain names, may end with dot
//      // can be replaced by a shortest alternative
//      // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
//      "(?:" +
//        "(?:" +
//          "[a-z0-9\\u00a1-\\uffff]" +
//          "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
//        ")?" +
//        "[a-z0-9\\u00a1-\\uffff]\\." +
//      ")+" +
//      // TLD identifier name, may end with dot
//      "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
//    ")" +
//    // port number (optional)
//    "(?::\\d{2,5})?" +
//    // resource path (optional)
//    "(?:[/?#]\\S*)?" +
//  "$", "i"
//);

// dperini/regex-weburl.js - https://gist.github.com/dperini/729294
// unicode正規表現サンプル - https://qiita.com/nwsoyogi/items/ab87b82ed41932095a21
// unicode表 - https://www.tamasoft.co.jp/ja/general-info/unicode.html
// unicode-変換ツール - https://www.astworks.com/tools/unicode-converter
// 正規表現文字クラス - https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes
const	fullchrs = '\\u00a1-\\u167f\\u1681-\\u180d\\u180f-\\u1fff\\u200b-\\u2027\\u202a-\\u202e\\u2030-\\u205e\\u2060-\\u2fff\\u3041-\\u31ff\\u3400-\\ufefe\\uff00-\\uff20\\uff3b-\\uff40\\uff5b-\\uffff',
		// 確認しきれていないが、ドメイン名に使える文字として全角スペース(\u3000)は含まないことにする。
		// fullchrs は、ドメインに使える全角文字の正規表現だが、非常に不完全。
		// 全角ハイフンと正規表現の文字クラス \s に含まれる文字、また目視で確認した範囲での全角の記号が集まるブロックを避けているが、到底厳密なものとは言えない。
		
		re_weburl_mod = new RegExp(
	    // protocol identifier (optional)
	    // short syntax // still required
	    "(?:(?:(?:(?:h?t)?tps?|ftp)?:)?\\/\\/)?" +
	    // user:pass BasicAuth (optional)
	    "(?:\\S+(?::\\S*)?@)?" +
	    "(?:" +
	      // IP address exclusion
	      // private & local networks
	      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
	      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
	      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
	      // IP address dotted notation octets
	      // excludes loopback network 0.0.0.0
	      // excludes reserved space >= 224.0.0.0
	      // excludes network & broadcast addresses
	      // (first & last IP address of each class)
	      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
	      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
	      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
	    "|" +
	      // host & domain names, may end with dot
	      // can be replaced by a shortest alternative
	      // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
	      "(?:" +
	        "(?:" +
	          `[a-z0-9${fullchrs}]` +
	          `[a-z0-9${fullchrs}_-]{0,62}` +
	        ")?" +
	        `[a-z0-9${fullchrs}]\\.` +
	      ")+" +
	      // TLD identifier name, may end with dot
	      `(?:[a-z${fullchrs}]{2,}\\.?)` +
	    ")" +
	    // port number (optional)
	    "(?::\\d{2,5})?" +
	    // resource path (optional)
	    "(?:[/?#]\\S*)?",
	    "gi"
	);