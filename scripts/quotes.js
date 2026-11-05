// Homepage controls use the shared collection in quote-data.js.
const quoteText = document.querySelector("#quote-text");
const quoteAuthor = document.querySelector("#quote-author");
const quoteWork = document.querySelector("#quote-work");
const quoteCredit = document.querySelector("#quote-credit");
const quoteNote = document.querySelector("#quote-note");
const quoteHeading = document.querySelector("#quote-heading");
const nextQuoteButton = document.querySelector("#next-quote");

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
nextQuoteButton.hidden = false;
