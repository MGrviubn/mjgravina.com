// Show a visible backup without replacing meaningful image descriptions.
(() => {
    const message = "image failed to load";

    document.querySelectorAll("img").forEach((image) => {
        let fallback;

        function showFailure() {
            if (!fallback) {
                fallback = document.createElement("span");
                fallback.className = "image-fallback";
                fallback.textContent = message;

                const description = image.getAttribute("alt");
                if (description === "") {
                    // An intentionally decorative image remains decorative.
                    fallback.setAttribute("aria-hidden", "true");
                } else {
                    fallback.setAttribute("role", "img");
                    fallback.setAttribute("aria-label", description ? `${description} — ${message}` : message);
                }

                image.insertAdjacentElement("afterend", fallback);
            }

            image.classList.add("image-load-failed");
            fallback.hidden = false;
        }

        function showImage() {
            image.classList.remove("image-load-failed");
            if (fallback) {
                fallback.hidden = true;
            }
        }

        image.addEventListener("error", showFailure);
        image.addEventListener("load", showImage);

        // Deferred scripts also need to catch failures that happened earlier.
        if (image.complete && image.naturalWidth === 0) {
            showFailure();
        }
    });
})();
