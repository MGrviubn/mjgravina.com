// Visible messages are kept here so Matthew can supply replacement wording.
const quoteMessages = {
    missingReason: "Personal explanation not added yet.",
    reasonHeading: "I chose this quote because…",
    loadError: "Unable to load quotes. Refresh.",
    allCount: (total) => `Showing all ${total} quotes.`,
    filteredCount: (shown, total) => `Showing ${shown} of ${total} quotes.`
};

const quoteSearchForm = document.querySelector("#quote-search");
const quoteQuery = document.querySelector("#quote-query");
const showAllQuotesButton = document.querySelector("#show-all-quotes");
const quoteList = document.querySelector("#quote-list");
const quoteStatus = document.querySelector("#quote-status");
const quoteEmpty = document.querySelector("#quote-empty");
const quoteSearchControls = document.querySelector("#quote-search-controls");

// Treat curly apostrophes and long dashes like their keyboard equivalents.
function normalizeQuoteSearch(value) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[–—]/g, "-")
        .toLowerCase();
}

function matchesQuote(quote, terms) {
    const normalizedText = normalizeQuoteSearch(quote.text);
    return terms.every((term) => normalizedText.includes(term));
}

function makeQuoteCard(quote) {
    const item = document.createElement("li");
    const article = document.createElement("article");
    article.className = "quote-entry";
    article.id = quote.id;
    article.setAttribute("aria-labelledby", `${quote.id}-heading`);

    const heading = document.createElement("h2");
    heading.id = `${quote.id}-heading`;
    heading.textContent = `Quote ${quote.id.slice(1)}`;

    const figure = document.createElement("figure");
    const blockquote = document.createElement("blockquote");
    const text = document.createElement("p");
    text.textContent = quote.text;
    blockquote.append(text);

    const attribution = document.createElement("figcaption");
    const work = document.createElement("cite");
    work.textContent = quote.work;
    attribution.append(`${quote.author} — `, work);
    if (quote.credit) {
        attribution.append(`, ${quote.credit}`);
    }
    if (quote.note) {
        const note = document.createElement("span");
        note.className = "quote-note";
        note.textContent = quote.note;
        attribution.append(note);
    }
    figure.append(blockquote, attribution);

    const comment = document.createElement("section");
    comment.className = "quote-comment";
    comment.setAttribute("aria-labelledby", `${quote.id}-comment-heading`);
    const reasonHeading = document.createElement("h3");
    reasonHeading.id = `${quote.id}-comment-heading`;
    reasonHeading.textContent = quoteMessages.reasonHeading;
    const reason = document.createElement("p");
    reason.className = "quote-reason";
    reason.textContent = quote.reason || quoteMessages.missingReason;

    comment.append(reasonHeading, reason);
    article.append(heading, figure, comment);
    item.append(article);
    return item;
}

function displayQuotes(results, isSearch) {
    const cards = results.map(makeQuoteCard);
    quoteList.replaceChildren(...cards);
    quoteEmpty.hidden = results.length !== 0;
    quoteStatus.textContent = isSearch
        ? quoteMessages.filteredCount(results.length, quotes.length)
        : quoteMessages.allCount(quotes.length);
}

quoteSearchForm.addEventListener("submit", (event) => {
    // Keep the search in this browser; do not submit it to GitHub Pages.
    event.preventDefault();
    const terms = normalizeQuoteSearch(quoteQuery.value).trim().split(/\s+/).filter(Boolean);
    const results = quotes.filter((quote) => matchesQuote(quote, terms));
    displayQuotes(results, terms.length > 0);
});

showAllQuotesButton.addEventListener("click", () => {
    // Clear the query before restoring the collection.
    quoteSearchForm.reset();
    displayQuotes(quotes, false);
});

if (typeof quotes === "undefined" || !Array.isArray(quotes)) {
    quoteStatus.textContent = quoteMessages.loadError;
} else {
    displayQuotes(quotes, false);
    quoteSearchControls.disabled = false;
}
