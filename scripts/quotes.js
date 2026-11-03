// Quotes and attributions supplied for this portfolio.
// The provisional attribution and excerpt notes are displayed with their quotes.
const quotes = [
    {
        "text": "A man chooses. A slave obeys.",
        "author": "Andrew Ryan",
        "work": "BioShock (2007)",
        "credit": ""
    },
    {
        "text": "I chose the impossible.",
        "author": "Andrew Ryan",
        "work": "BioShock (2007)",
        "credit": "Introductory recording"
    },
    {
        "text": "What is better—to be born good, or to overcome your evil nature through great effort?",
        "author": "Paarthurnax",
        "work": "The Elder Scrolls V: Skyrim (2011)",
        "credit": ""
    },
    {
        "text": "If not us, then who?",
        "author": "Spartan Rangers’ motto",
        "work": "Metro video-game series",
        "credit": ""
    },
    {
        "text": "I craved the strength and certainty of steel.",
        "author": "Magos-Dominus Reditus",
        "work": "Warhammer 40,000: Mechanicus (2018)",
        "credit": "Teaser-trailer monologue"
    },
    {
        "text": "Even the waves of fate can break upon the shores of will.",
        "author": "Elminster Aumar",
        "work": "Baldur’s Gate 3 (2023)",
        "credit": ""
    },
    {
        "text": "Do not be sorry. Be better.",
        "author": "Kratos",
        "work": "God of War (2018)",
        "credit": ""
    },
    {
        "text": "I came to this place to build the impossible.",
        "author": "Andrew Ryan",
        "work": "BioShock (2007)",
        "credit": "Arcadia radio message"
    },
    {
        "text": "Life is not measured in years, but by the deeds of men.",
        "author": "Unattributed Imperial quotation",
        "work": "Warhammer 40,000: Rogue Trader (1987)",
        "credit": "Tabletop rulebook, p. 113"
    },
    {
        "text": "Courage is to look your fear in the eye and know that it has no dominion over you!",
        "author": "Will Anthonio Zeppeli",
        "work": "JoJo’s Bizarre Adventure (2012), episode 4, “Overdrive”",
        "credit": "English dub"
    },
    {
        "text": "The sheer impossibility of a quest is no reason to abandon it.",
        "author": "Ignace Karkasy",
        "work": "False Gods",
        "credit": "Graham McNeill",
        "note": "Excerpt from a longer sentence."
    },
    {
        "text": "Not because I can win, but because it is right.",
        "author": "Sanguinius",
        "work": "Echoes of Eternity",
        "credit": "Aaron Dembski-Bowden"
    },
    {
        "text": "All we need do is make a good choice, see it through and accept the consequences.",
        "author": "Solomon Demeter",
        "work": "Fulgrim",
        "credit": "Graham McNeill"
    },
    {
        "text": "Death comes for us all. What we do while it approaches is the only freedom we have.",
        "author": "Speaker not established",
        "work": "Belisarius Cawl: The Great Work",
        "credit": "Guy Haley",
        "note": "Provisional attribution: the book attribution has not been verified against the novel."
    },
    {
        "text": "Ten thousand victories have started with a retreat. The only dishonour is in not coming back.",
        "author": "Vorgha Khan, White Scars 8th Company",
        "work": "Codex Supplement: White Scars (8th edition)",
        "credit": "p. 19"
    },
    {
        "text": "We cannot avoid risk, my friend, for if we do, we achieve nothing.",
        "author": "Horus Lupercal",
        "work": "False Gods",
        "credit": "Graham McNeill"
    },
    {
        "text": "The only good is knowledge and the only evil is ignorance.",
        "author": "Ahzek Ahriman",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "note": "Credited to Ahriman in the book’s epigraph."
    },
    {
        "text": "Cage your mind with the possible and you have stolen your own future.",
        "author": "Magnus the Red",
        "work": "Ahriman: Sorcerer",
        "credit": "John French"
    },
    {
        "text": "Every experience is an opportunity to learn.",
        "author": "Ahzek Ahriman",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill"
    },
    {
        "text": "Hard-won knowledge is of no value unless it is put into practice.",
        "author": "Magnus the Red",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill"
    },
    {
        "text": "Were I to await perfection, my work would never be finished.",
        "author": "Ostian Delafour",
        "work": "Fulgrim",
        "credit": "Graham McNeill"
    },
    {
        "text": "If I am guilty of anything, it is the simple pursuit of knowledge.",
        "author": "Magnus the Red",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill"
    },
    {
        "text": "It is not simplicity, … It is clarity of purpose.",
        "author": "Magnus the Red",
        "work": "A Thousand Sons",
        "credit": "Graham McNeill",
        "note": "The ellipsis omits intervening narration."
    },
    {
        "text": "Wicked phenomenon, yes? But, you know, it’s not any more \"evil\" than, say… fire. It all depends on your point of view. Try to get a better understanding of things before you make your judgement.",
        "author": "Khan",
        "work": "Metro 2033 (video game)",
        "credit": "“Anomaly” level"
    }
];

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
    quoteHeading.textContent = "Featured Quote";
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
