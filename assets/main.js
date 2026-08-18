(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  document.querySelectorAll("a[data-tg]").forEach(function (link) {
    link.setAttribute("href", APP_CONFIG.telegramLink);
    if (link.textContent.indexOf("@") !== -1) {
      link.textContent = "@" + APP_CONFIG.telegramUsername;
    }
  });

  document.querySelectorAll("a[data-max]").forEach(function (link) {
    link.setAttribute("href", APP_CONFIG.maxLink);
  });

  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  burger.addEventListener("click", function () {
    nav.classList.toggle("open");
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
    });
  });

  var toTop = document.getElementById("to-top");
  if (toTop) {
    toTop.addEventListener("click", function (event) {
      event.preventDefault();
      if ("scrollBehavior" in document.documentElement.style) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  var gallery = document.getElementById("reviews-gallery");
  if (gallery) {
    var track = document.getElementById("gallery-track");
    var prevBtn = gallery.querySelector(".gallery__btn--prev");
    var nextBtn = gallery.querySelector(".gallery__btn--next");
    var imgs = track.querySelectorAll("img");

    function updateGalleryButtons() {
      if (!track) return;
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll < 1) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }
      prevBtn.disabled = track.scrollLeft <= 1;
      nextBtn.disabled = maxScroll - track.scrollLeft <= 1;
    }

    function galleryStep(dir) {
      var slides = Array.prototype.slice.call(track.querySelectorAll(".gallery__slide"));
      var pos = track.scrollLeft;
      var step = dir > 0 ? 1 : -1;
      var target = null;
      for (var i = 0; i < slides.length; i++) {
        var left = slides[i].offsetLeft;
        if (step > 0 && left > pos + 4 && (target === null || left < target)) target = left;
        if (step < 0 && left < pos - 4 && (target === null || left > target)) target = left;
      }
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (target === null) target = step > 0 ? maxScroll : 0;
      if (target < 0) target = 0;
      if (target > maxScroll) target = maxScroll;
      track.scrollTo({ left: target, behavior: "smooth" });
    }

    prevBtn.addEventListener("click", function () {
      galleryStep(-1);
    });
    nextBtn.addEventListener("click", function () {
      galleryStep(1);
    });
    track.addEventListener("scroll", updateGalleryButtons, { passive: true });
    window.addEventListener("resize", updateGalleryButtons);
    window.addEventListener("load", updateGalleryButtons);
    imgs.forEach(function (img) {
      img.addEventListener("load", updateGalleryButtons);
      if (img.complete) updateGalleryButtons();
    });
    setTimeout(updateGalleryButtons, 500);
  }

  var forms = document.querySelectorAll("form");
  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var button = form.querySelector("button[type=submit]");
      var successBox = form.querySelector(".lead-card__success");
      var originalText = button.textContent;

      var data = {};
      form.querySelectorAll("input").forEach(function (input) {
        data[input.name] = input.value.trim();
      });

      var messageLines = [
        "Новая заявка с сайта",
        "---",
        "Имя: " + (data.name || "не указано"),
        "Контакт: " + (data.contact || "не указано"),
      ];
      if (data.sphere) messageLines.push("Сфера: " + data.sphere);
      if (data.budget) messageLines.push("Бюджет: " + data.budget);

      var sendToTelegram = APP_CONFIG.telegramBotToken && APP_CONFIG.telegramChatId;

      if (!sendToTelegram) {
        showSuccess(form, successBox, button, originalText);
        return;
      }

      button.textContent = "Отправляем...";
      button.disabled = true;

      fetch(
        "https://api.telegram.org/bot" +
          APP_CONFIG.telegramBotToken +
          "/sendMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: APP_CONFIG.telegramChatId,
            text: messageLines.join("\n"),
          }),
        }
      )
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (result.ok) {
            showSuccess(form, successBox, button, originalText);
          } else {
            button.textContent = originalText;
            button.disabled = false;
            alert("Не удалось отправить заявку. Попробуйте ещё раз или напишите в Telegram.");
          }
        })
        .catch(function () {
          button.textContent = originalText;
          button.disabled = false;
          alert("Ошибка соединения. Попробуйте ещё раз или напишите в Telegram.");
        });
    });
  });

  function showSuccess(form, successBox, button, originalText) {
    form.querySelectorAll("input").forEach(function (input) {
      input.value = "";
    });
    button.textContent = originalText;
    button.disabled = false;
    successBox.hidden = false;
    setTimeout(function () {
      successBox.hidden = true;
    }, 8000);
  }

  var lightbox = document.getElementById("lightbox");
  function openLightbox(src, alt) {
    if (!lightbox) return;
    var lightboxImg = lightbox.querySelector("img");
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.classList.add("lightbox--open");
    document.body.classList.add("lightbox-locked");
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("lightbox--open");
    document.body.classList.remove("lightbox-locked");
    lightbox.querySelector("img").src = "";
  }
  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox || event.target === lightbox.querySelector("img")) closeLightbox();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLightbox();
    });
  }

  document.querySelectorAll(".about__photo img, .case-card__shot img, .gallery__slide img").forEach(function (img) {
    img.style.cursor = "zoom-in";
    img.addEventListener("click", function () {
      openLightbox(img.currentSrc || img.src, img.alt);
    });
  });
})();
