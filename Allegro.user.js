// ==UserScript==
// @name         Allegro cart
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Dodaje przycisk do dodawania produktów do koszyka Allegro
// @author       You
// @match        https://*.allegro.pl/oferta/*
// @match        https://*.allegro.pl/produkt/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=allegro.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  console.log("📜 Tampermonkey script Allegro Dywersant został załadowany!");

  // Funkcja dodawania produktu do koszyka
  const addToCartDywersant = async (productId) => {
    try {
      var body = `{"items":[{"itemId":"${productId}","delta":1,"navTree":"navigation-pl"}]}`;
      var jsonType = "application/vnd.allegro.public.v5+json";
      var req = new XMLHttpRequest();
      req.open("POST", "//edge." + window.location.host + "/carts/changeQuantityCommand", true);
      req.setRequestHeader("Content-Type", jsonType);
      req.setRequestHeader("Accept", jsonType);
      req.withCredentials = true;
      req.onload = function () {
        window.location.assign("/koszyk");
      };
      req.send(body);
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
            top: 150px;
            left: 20px;
            background: ${type === "success" ? "#4CAF50" : "#f44336"};
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-width: 200px;
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
    }, 2000);
  };

  // Funkcja pobierania ID produktu ze strony
  const getProductId = () => {
    console.log("🔍 Szukam ID produktu...");

    // Szukaj meta tag z property="t_offer_id"
    const href = window.location.href.split("?")[0].split("-");
    const id = href[href.length - 1].replace(/[^.0-9]/g, "");
    if (id) {
      console.log("✅ Znaleziono ID z meta tag:", id);
      return id;
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
      if (oldButton) oldButton.remove();
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
    button.textContent = productId ? `🛒 Do koszyka (ID: ${productId})` : "🛒 PRZYCISK TESTOWY - Nie znaleziono ID produktu";

    button.style.cssText = `
            background: ${productId ? "#e74c3c" : "#orange"};
            color: white;
            border: none;
            padding: 8px 18px;
            font-size: 11px;
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
