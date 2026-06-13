/*
  Super Search Builder — shared search-template engine
  ----------------------------------------------------
  Turns a real search-results URL plus the phrase the user searched for into a
  reusable template URL containing a single %s token. Designed for the varying
  patterns real engines use:
    - query string with different param names: ?q= ?Query= ?search= ?term= ?search_query= ?AllField=
    - + encoding (climate+migration) or %20 encoding (climate%20migration)
    - the phrase sitting in the path rather than the query string
    - extra parameters before/after the phrase, which are preserved

  No dependencies. Works in the browser (window.SuperSearchEngine) and under Node
  (module.exports) so it can be unit tested.
*/
(function (root) {
  "use strict";

  var TOKEN = "%s";

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Every plausible encoding of the searched phrase, longest first so the most
  // specific form is replaced before a looser one.
  function queryVariants(query) {
    var q = String(query || "").trim();
    if (!q) return [];
    var enc = encodeURIComponent(q); // climate%20migration
    var plus = enc.replace(/%20/g, "+"); // climate+migration
    var lower = q.toLowerCase();
    var encLower = encodeURIComponent(lower);
    var plusLower = encLower.replace(/%20/g, "+");
    var list = [enc, plus, q, lower, encLower, plusLower];
    var seen = {};
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var v = list[i];
      if (v && !seen[v]) {
        seen[v] = true;
        out.push(v);
      }
    }
    out.sort(function (a, b) {
      return b.length - a.length;
    });
    return out;
  }

  // Main conversion. Returns { ok, template, original, matchedForm, tokenCount, message }.
  function convert(url, query) {
    var original = String(url || "").trim();
    var result = {
      ok: false,
      template: original,
      original: original,
      matchedForm: null,
      tokenCount: 0,
      message: ""
    };

    if (!original) {
      result.message = "Paste a search results URL first.";
      return result;
    }
    if (!/^https?:\/\//i.test(original)) {
      result.message = "That does not look like a web address. It should start with http:// or https://.";
      return result;
    }
    if (original.indexOf(TOKEN) !== -1) {
      // Already a template — accept as-is.
      result.ok = true;
      result.template = original;
      result.matchedForm = TOKEN;
      result.tokenCount = (original.match(/%s/g) || []).length;
      result.message = "This URL already contains a %s token, so it is ready to use.";
      return result;
    }

    var variants = queryVariants(query);
    if (!variants.length) {
      result.message = "Type the exact phrase you searched for so it can be found in the URL.";
      return result;
    }

    var working = original;
    var matched = null;
    for (var i = 0; i < variants.length; i++) {
      var v = variants[i];
      var re = new RegExp(escapeRegExp(v), "gi");
      if (re.test(working)) {
        working = working.replace(re, TOKEN);
        matched = v;
        break; // replace the single most specific encoding only
      }
    }

    if (!matched) {
      result.message =
        "Could not find that phrase in the URL. Check the spelling matches what you typed into the search box, " +
        "or paste the URL straight from the address bar after running the search.";
      return result;
    }

    result.ok = true;
    result.template = working;
    result.matchedForm = matched;
    result.tokenCount = (working.match(/%s/g) || []).length;
    if (result.tokenCount > 1) {
      result.message =
        "Heads up: the phrase appeared more than once, so the template has more than one %s. " +
        "Usually only the first should stay. Edit the template if needed.";
    } else {
      result.message = "Template ready.";
    }
    return result;
  }

  // Apply a template to a real query, for previews and the exported page.
  function applyTemplate(template, query) {
    var enc = encodeURIComponent(String(query || "").trim());
    return String(template || "").split(TOKEN).join(enc);
  }

  // Best-effort label suggestion from the hostname, e.g. scholar.google.com -> "Scholar Google".
  function suggestLabel(url) {
    try {
      var host = new URL(url).hostname.replace(/^www\./, "");
      var core = host.split(".");
      if (core.length > 2) core = core.slice(0, core.length - 1);
      core = core.filter(function (p) {
        return ["com", "org", "net", "co", "uk", "gov", "edu", "ac", "io"].indexOf(p) === -1;
      });
      var name = core.join(" ").replace(/[-_]/g, " ");
      return name.replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      }).trim();
    } catch (e) {
      return "";
    }
  }

  function isValidTemplate(template) {
    var t = String(template || "");
    return /^https?:\/\//i.test(t) && t.indexOf(TOKEN) !== -1;
  }

  var api = {
    TOKEN: TOKEN,
    convert: convert,
    applyTemplate: applyTemplate,
    queryVariants: queryVariants,
    suggestLabel: suggestLabel,
    isValidTemplate: isValidTemplate
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.SuperSearchEngine = api;
  }
})(typeof window !== "undefined" ? window : this);
