// ==UserScript==
// @name         MediaExpert Dywersant
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Dodaje przycisk do dodawania produktów do koszyka MediaExpert
// @author       You
// @match        https://*.mediaexpert.pl/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mediaexpert.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  console.log("📜 Tampermonkey script MediaExpert Dywersant został załadowany!");

  // Funkcja dodawania produktu do koszyka
  const addToCartDywersant = async (productId) => {
    try {
      const response = await fetch("https://www.mediaexpert.pl/api/carts/items", {
        headers: {
          accept: "application/vnd.enp.api+json;version=v3",
          "cart-v2": "false",
          "content-type": "application/json",
          "content-website": "4",
          "x-spark": "hybrid",
        },
        body: `{"offer_id":${productId},"quantity":1}`,
        method: "PUT",
      });

      if (response.status === 201) {
        console.log("\n\nAdded to cart\n\n");
        showNotification("✅ Produkt dodany do koszyka!", "success");
      } else {
        const responseData = await response.json();
        console.log(responseData.message);
        showNotification("❌ Błąd: " + responseData.message, "error");
      }
    } catch (error) {
      console.error("Błąd podczas dodawania produktu:", error);
      showNotification("❌ Wystąpił błąd podczas dodawania produktu", "error");
    }
  };

  // Funkcja wyświetlania powiadomień
  const showNotification = (message, type) => {
    // Usuń poprzednie powiadomienie jeśli istnieje
    const existingNotification = document.getElementById("dywersant-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Stwórz nowe powiadomienie
    const notification = document.createElement("div");
    notification.id = "dywersant-notification";
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#4CAF50" : "#f44336"};
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 10px;
            max-width: 150px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease;
        `;

    // Dodaj animację CSS
    if (!document.getElementById("dywersant-styles")) {
      const style = document.createElement("style");
      style.id = "dywersant-styles";
      style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Usuń powiadomienie po 3 sekundach
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Funkcja pobierania ID produktu ze strony
  const getProductId = () => {
    console.log("🔍 Szukam ID produktu...");

    // Szukaj meta tag z property="t_offer_id"
    const metaTag = document.querySelector('meta[property="t_offer_id"]');
    console.log("Meta tag t_offer_id:", metaTag);
    if (metaTag && metaTag.content) {
      console.log("✅ Znaleziono ID z meta tag:", metaTag.content);
      return metaTag.content;
    }

    console.log("❌ Nie znaleziono ID produktu");
    return null;
  };

  // Funkcja dodawania przycisku
  const addDywersantButton = () => {
    console.log("🚀 Próba dodania przycisku...");

    const productId = getProductId();
    console.log("Product ID:", productId);

    // Sprawdź czy przycisk już istnieje
    const oldButton = document.getElementById("dywersant-button");
    if (!productId) {
      oldButton || oldButton.remove();
      return;
    }
    if (oldButton) {
      console.log("⚠️ Przycisk już istnieje");
      return;
    }

    console.log("🔍 Szukam miejsca na przycisk...");

    // Stwórz przycisk
    const button = document.createElement("button");
    button.id = "dywersant-button";
    button.textContent = productId
      ? `🛒 Dodaj produkt do koszyka (ID: ${productId})`
      : "🛒 PRZYCISK TESTOWY - Nie znaleziono ID produktu";

    button.style.cssText = `
            background: ${productId ? "#e74c3c" : "#orange"};
            color: white;
            border: none;
            padding: 8px 18px;
            font-size: 9px;
            font-weight: bold;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 9999;
            max-width: 200px;
            word-wrap: break-word;
        `;

    // Efekty hover
    button.addEventListener("mouseenter", () => {
      button.style.background = productId ? "#c0392b" : "#ff8c00";
      button.style.transform = "translateY(-2px)";
      button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = productId ? "#e74c3c" : "#orange";
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    });

    // Obsługa kliknięcia
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!productId) {
        showNotification("❌ Nie znaleziono ID produktu na tej stronie!", "error");
        console.log("Sprawdź konsolę przeglądarki (F12) aby zobaczyć logi.");
        return;
      }

      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "⏳ Dodawanie...";

      await addToCartDywersant(productId);

      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 1000);
    });

    // Wstaw przycisk
    document.body.appendChild(button);

    console.log(`✅ Dodano przycisk dywersanta${productId ? ` dla produktu ID: ${productId}` : " (testowy)"}`);
  };

  // Inicjalizacja
  const init = () => {
    // Dodaj przycisk od razu
    addDywersantButton();

    //         // Poczekaj chwilę na załadowanie się strony i spróbuj ponownie
    //         setTimeout(() => {
    //             console.log('⏰ Próba ponowna po 1 sekundzie...');
    //             addDywersantButton();
    //         }, 1000);

    //         // Jeszcze jedna próba po 3 sekundach
    //         setTimeout(() => {
    //             console.log('⏰ Próba ponowna po 3 sekundach...');
    //             addDywersantButton();
    //         }, 3000);
  };

  // Uruchom inicjalizację
  console.log("Document ready state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ Strona się ładuje, czekam na DOMContentLoaded...");
    document.addEventListener("DOMContentLoaded", () => {
      console.log("✅ DOM załadowany!");
      init();
    });
  } else {
    console.log("✅ DOM już gotowy, uruchamiam init...");
    init();
  }

  // Obsługa nawigacji SPA (Single Page Application)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("🔄 Zmiana URL wykryta:", url);

      // Usuń stary przycisk jeśli istnieje
      const oldButton = document.getElementById("dywersant-button");
      if (oldButton) {
        oldButton.remove();
      }

      // Dodaj nowy przycisk po chwili
      setTimeout(init, 1000);
    }
  });

  urlObserver.observe(document, { subtree: true, childList: true });
})();
