// ==UserScript==
// @name         Euro-Ole cart
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Dodaje przycisk do dodawania produktów do koszyka Euro
// @author       You
// @match        https://*.oleole.pl/*
// @match        https://*.euro.com.pl/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=euro.com.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  const buttonCfg = [
    { name: "btnDobry", outletCategory: 29888140193, offset: 60, categoryName: "dobry" },
    { name: "btnDoskonaly", outletCategory: 29888140185, offset: 10, categoryName: "doskonały" },
    {
      name: "btnDostateczny",
      outletCategory: 37177506729,
      offset: 110,
      categoryName: "dostateczny",
      needsHuCode: true,
    },
  ];

  // Funkcja dodawania produktu do koszyka
  const addToCartDywersant = async (productId, outletCategory, huCode) => {
    try {
      const response = await fetch(`https://${window.location.hostname}/rest/api/carts/`, {
        headers: {
          accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.5",
          "content-type": "application/json",
        },
        referrer: `https://${window.location.hostname}/`,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `{\"product\":\"${productId}\",\"addedFrom\":\"PRODUCT_CARD\",\"cameFrom\":\"string\",\"services\":[],\"outletCategory\":${outletCategory}${
          huCode ? `,\"huCode\":\"${huCode}\"` : ""
        }}`,
        method: "POST",
        mode: "cors",
      });

      if (response.status === 200) {
        console.log("\n\nAdded to cart\n\n");
        showNotification("✅ Produkt dodany do koszyka!", "success");
      } else {
        const responseData = await response.json();
        console.log(responseData.message);
        showNotification("❌ Błąd: " + responseData.reasonCode, "error");
      }
    } catch (error) {
      console.error("Błąd podczas dodawania produktu:", error);
      showNotification("❌ Wystąpił błąd podczas dodawania produktu", "error");
    }
  };

  const getHuCode = async (productId) => {
    if (!productId || window.location.hostname != "www.oleole.pl") return;
    let huCode;
    try {
      const response = await fetch(`https://www.oleole.pl/rest/api/products/${productId}/outlet-details`, {
        headers: {
          accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.5",
          "content-type": "application/json",
        },
        referrer: `https://www.oleole.pl/`,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        // credentials: "omit",
        // "credentials": "include",
        mode: "cors",
      });

      const responseData = await response.json();
      if (response.status === 200) {
        responseData.forEach((item) => {
          if (item.individualOutletProducts.length) huCode = item.individualOutletProducts[0].huCode;
        });
        // if (huCode) showNotification(`✅ Dostępny stan dostateczny: ${huCode}`, "success");
      } else {
        console.log(responseData.message);
        showNotification("❌ Błąd: " + responseData.reasonCode, "error");
      }
    } catch (error) {
      // console.error("Błąd podczas dodawania produktu:", error);
      showNotification("❌ Wystąpił błąd podczas zapytania outlet-details", "error");
    }
    return huCode;
  };

  // Funkcja wyświetlania powiadomień
  const showNotification = (message, type) => {
    // Usuń poprzednie powiadomienie jeśli istnieje
    const existingNotification = document.getElementById("dywersant-notification");
    if (existingNotification) existingNotification.remove();

    // Stwórz nowe powiadomienie
    const notification = document.createElement("div");
    notification.id = "dywersant-notification";
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 160px;
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

    const sel = document.querySelector(".product-page .product-information__codes");
    if (!sel) {
      console.log("❌ Nie znaleziono ID produktu");
      return null;
    }

    return +sel.textContent.replace(/\D/g, "");
  };

  // Funkcja dodawania przycisku
  const addDywersantButton = (btnConfig, productId) => {
    const oldButton = document.getElementById(btnConfig.name);
    if (!productId) {
      if (oldButton) oldButton.remove();
      return;
    }
    console.log("🚀 Próba dodania przycisku...");
    if (oldButton) {
      console.log("⚠️ Przycisk już istnieje");
      return;
    }

    // Stwórz przycisk
    const button = document.createElement("button");
    button.id = btnConfig.name;
    button.textContent = productId
      ? `🛒 Do koszyka (Stan: ${btnConfig.categoryName})`
      : "🛒 PRZYCISK TESTOWY - Nie znaleziono ID produktu";

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
            top: ${btnConfig.offset}px;
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

      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "⏳ Dodawanie...";

      const getProp = (name) => {
        for (let i of buttonCfg) {
          if (i.name == name) return i;
        }
      };
      let huCode;
      if (getProp(button.id).needsHuCode) huCode = await getHuCode(productId);

      await addToCartDywersant(productId, btnConfig.outletCategory, huCode);

      setTimeout(() => {
        button.disabled = false;
        button.textContent = originalText;
      }, 1000);
    });

    // Wstaw przycisk
    document.body.appendChild(button);
  };

  // Inicjalizacja
  const init = async () => {
    console.log("🔧 Inicjalizacja Tampermonkey script...");
    console.log("URL:", window.location.href);
    console.log("Ready state:", document.readyState);

    const productId = getProductId();

    // Dodaj przycisk od razu
    buttonCfg.forEach((btn) => addDywersantButton(btn, productId));
  };

  // Uruchom inicjalizację
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
    });
  } else {
    init();
  }

  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      console.log("🔄 Zmiana URL wykryta:", url);
      // Usuń stary przycisk jeśli istnieje
      buttonCfg.forEach((btn) => {
        const oldButton = document.getElementById(btn.name);
        if (oldButton) {
          oldButton.remove();
        }
      });

      // Dodaj nowy przycisk po chwili
      setTimeout(init, 1000);
    }
  });

  urlObserver.observe(document, { subtree: true, childList: true });
})();
