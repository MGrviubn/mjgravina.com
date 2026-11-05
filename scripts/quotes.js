// Homepage controls use the shared collection in quote-data.js.
(() => {
    const quoteText = document.querySelector("#quote-text");
    const quoteAuthor = document.querySelector("#quote-author");
    const quoteWork = document.querySelector("#quote-work");
    const quoteCredit = document.querySelector("#quote-credit");
    const quoteNote = document.querySelector("#quote-note");
    const quoteHeading = document.querySelector("#quote-heading");
    const nextQuoteButton = document.querySelector("#next-quote");

    // Keep the button visible and explain when the shared data cannot load.
    if (typeof quotes === "undefined" || !Array.isArray(quotes) || quotes.length === 0) {
        nextQuoteButton.disabled = true;
        quoteNote.textContent = "Unable to load quotes. Refresh.";
        quoteNote.hidden = false;
        return;
    }

    // There is no current quote until the first random selection.
    let quoteIndex = -1;

    function showQuote() {
        const quote = quotes[quoteIndex];

        quoteText.textContent = quote.text;
        quoteAuthor.textContent = quote.author;
        quoteWork.textContent = quote.work;
        quoteCredit.textContent = quote.credit ? ", " + quote.credit : "";
        quoteNote.textContent = quote.note || "";
        quoteNote.hidden = !quote.note;
        quoteHeading.textContent = "One of my favorite quotes.";
    }

    function showRandomQuote() {
        let randomIndex;

        // Pick again if the result matches the quote currently on screen.
        do {
            randomIndex = Math.floor(Math.random() * quotes.length);
        } while (quotes.length > 1 && randomIndex === quoteIndex);

        quoteIndex = randomIndex;
        showQuote();
    }

    nextQuoteButton.addEventListener("click", showRandomQuote);

    // Choose a random quote whenever the homepage loads.
    showRandomQuote();
})();
