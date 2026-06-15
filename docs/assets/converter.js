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
      placement: "none",
      phraseHadSpace: /\s/.test(String(query || "").trim()),
      tip: "",
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
    result.placement = tokenPlacement(working);
    if (result.tokenCount > 1) {
      result.message =
        "Heads up: the phrase appeared more than once, so the template has more than one %s. " +
        "Usually only the first should stay. Edit the template if needed.";
    } else if (result.placement === "path") {
      result.message =
        "Template ready. This site puts the query in the address path, so spaces will be " +
        "written as %20 automatically — nothing for you to change.";
    } else {
      result.message = "Template ready.";
    }
    if (result.ok && !result.phraseHadSpace) {
      result.tip =
        "Tip: searching a two-word phrase (with a space) gives a more reliable result — " +
        "it is easier to find in the address and confirms how the site handles spaces.";
    }
    return result;
  }

  // Where does the (first) %s sit? "query" if inside the query string (after ? and before
  // any #), otherwise "path". Used only to give the user a friendly note; the actual
  // encoding decision is made the same way at apply time.
  function tokenPlacement(template) {
    var t = String(template || "");
    var offset = t.indexOf(TOKEN);
    if (offset === -1) return "none";
    var hashIndex = t.indexOf("#");
    var qIndex = t.indexOf("?");
    var queryStart = (qIndex !== -1 && (hashIndex === -1 || qIndex < hashIndex)) ? qIndex : -1;
    var queryEnd = hashIndex === -1 ? t.length : hashIndex;
    return (queryStart !== -1 && offset > queryStart && offset < queryEnd) ? "query" : "path";
  }

  // Encode a query for a URL. Uses + for spaces, which is correct and conventional
  // inside a query string (the part after ?). Kept for callers that want the classic style.
  function encodeQuery(query) {
    return encodeURIComponent(String(query || "").trim()).replace(/%20/g, "+");
  }

  // Strict percent-encoding (spaces as %20). Correct inside a URL path segment, where a
  // literal + would NOT mean a space.
  function encodePath(query) {
    return encodeURIComponent(String(query || "").trim());
  }

  // Apply a template to a real query for previews and the exported page. The %s token is
  // encoded according to WHERE it sits in the URL:
  //   - in the query string (after ? and before any #)  -> + for spaces (form style)
  //   - anywhere else (path, or fragment after #)        -> %20 (strict percent-encoding)
  // This keeps the familiar climate+migration look for the common case while staying
  // correct for path-based searches (e.g. Substack) and fragment-based ones.
  function applyTemplate(template, query) {
    var t = String(template || "");
    var hashIndex = t.indexOf("#");
    var qIndex = t.indexOf("?");
    // A ? only starts the query string if it appears before any fragment.
    var queryStart = (qIndex !== -1 && (hashIndex === -1 || qIndex < hashIndex)) ? qIndex : -1;
    var queryEnd = hashIndex === -1 ? t.length : hashIndex;
    return t.replace(/%s/g, function (match, offset) {
      var inQueryString = queryStart !== -1 && offset > queryStart && offset < queryEnd;
      return inQueryString ? encodeQuery(query) : encodePath(query);
    });
  }

  // Build a Google site-search template for a domain, e.g. economist.com ->
  // https://www.google.com/search?q=site:economist.com+%s . This is how you search
  // any site that has poor or no search of its own.
  function siteSearchTemplate(domain, opts) {
    opts = opts || {};
    var d = String(domain || "").trim();
    if (!d) return { ok: false, template: "", message: "Type a website address, e.g. economist.com" };
    // strip scheme, path, leading www. and trailing slashes
    d = d.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "").replace(/\/+$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d)) {
      return { ok: false, template: "", message: "That does not look like a website address. Try something like guardian.com or bbc.co.uk." };
    }
    var google = opts.uk ? "https://www.google.co.uk/search" : "https://www.google.com/search";
    var extra = opts.pdf ? "+pdf" : "";
    return {
      ok: true,
      domain: d,
      template: google + "?q=site:" + d + extra + "+" + TOKEN,
      message: "Site search ready."
    };
  }

  // Best-effort label suggestion. For a Google site: search, name it after the target
  // site (site:economist.com -> "Economist"); otherwise use the hostname.
  function suggestLabel(url) {
    try {
      var u = String(url || "");
      var siteMatch = u.match(/[?&]q=site:([a-z0-9.-]+)/i);
      var host;
      if (siteMatch) {
        host = siteMatch[1];
      } else {
        host = new URL(u).hostname;
      }
      host = host.replace(/^www\./, "");
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
  // A complete destination URL with no query token — a static link, always live.
  function isStaticLink(template) {
    var t = String(template || "");
    return /^https?:\/\//i.test(t) && t.indexOf(TOKEN) === -1;
  }
  // Any link the page can use: a search template (%s) or a static destination URL.
  function isUsableLink(template) {
    return isValidTemplate(template) || isStaticLink(template);
  }

  var api = {
    TOKEN: TOKEN,
    convert: convert,
    applyTemplate: applyTemplate,
    encodeQuery: encodeQuery,
    encodePath: encodePath,
    siteSearchTemplate: siteSearchTemplate,
    queryVariants: queryVariants,
    tokenPlacement: tokenPlacement,
    suggestLabel: suggestLabel,
    isValidTemplate: isValidTemplate,
    isStaticLink: isStaticLink,
    isUsableLink: isUsableLink
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.SuperSearchEngine = api;
  }
})(typeof window !== "undefined" ? window : this);
