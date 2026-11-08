/* Акулёнок: интерактив демо-страницы. Бэкенда нет, отправка имитируется. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------- мобильное меню */

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");

  function closeNav() {
    if (!nav || !navToggle) { return; }
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") { closeNav(); }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { closeNav(); }
    });
  }

  /* ------------------------------------------------------- активный пункт */

  var sections = document.querySelectorAll("main section[id]");

  if (sections.length && "IntersectionObserver" in window) {
    var navLinks = {};
    document.querySelectorAll('.nav a[href^="#"]').forEach(function (link) {
      navLinks[link.getAttribute("href").slice(1)] = link;
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navLinks[entry.target.id];
        if (!link) { return; }
        if (entry.isIntersecting) {
          Object.keys(navLinks).forEach(function (key) {
            navLinks[key].removeAttribute("aria-current");
          });
          link.setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ------------------------------------------------- подсветка сегодняшнего дня */

  var hoursRows = document.querySelectorAll(".hours-row[data-day]");

  if (hoursRows.length) {
    var today = new Date().getDay() || 7;
    hoursRows.forEach(function (row) {
      if (Number(row.getAttribute("data-day")) === today) {
        row.classList.add("is-today");
        row.setAttribute("aria-current", "true");
      }
    });
  }

  /* ---------------------------------------------------------- появление */

  var revealGroups = [
    { selector: ".section-head", step: 60 },
    { selector: ".feature-list .feature", step: 70 },
    { selector: ".spec-panel", step: 90 },
    { selector: ".plans .plan", step: 90 },
    { selector: ".plan .pack", step: 60 },
    { selector: ".contacts li", step: 60 },
    { selector: ".contact-info > *", step: 80 },
    { selector: ".map-block", step: 60 },
    { selector: ".form-card", step: 60 },
    { selector: ".footer-inner > *", step: 60 }
  ];

  revealGroups.forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el, index) {
      el.classList.add("reveal");
      el.style.setProperty("--d", (index * group.step) + "ms");
    });
  });

  ["hero-copy", "hero-visual"].forEach(function (selector) {
    var el = document.querySelector("." + selector);
    if (el) { el.classList.add("reveal"); }
  });

  var revealTargets = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    revealTargets.forEach(function (el) { observer.observe(el); });

    window.requestAnimationFrame(function () {
      document.querySelectorAll(".hero .reveal").forEach(function (el) {
        el.classList.add("is-in");
      });
    });
  }

  /* ------------------------------------------------------ выбор пакета */

  var packageField = document.getElementById("package");
  var contactSection = document.getElementById("contact");
  var formCard = document.querySelector(".form-card");

  document.querySelectorAll("[data-pick]").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-pick");

      if (packageField) {
        packageField.value = value;
        packageField.classList.add("is-highlight");
        window.setTimeout(function () {
          packageField.classList.remove("is-highlight");
        }, 1600);
      }

      if (formCard) {
        formCard.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });
      } else if (contactSection) {
        contactSection.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start"
        });
      }

      window.setTimeout(function () {
        if (packageField) { packageField.focus({ preventScroll: true }); }
      }, reduceMotion ? 0 : 450);
    });
  });

  /* ------------------------------------------------------ отправка формы */

  var form = document.getElementById("signup");

  function setError(field, messageId, message) {
    var error = messageId ? document.getElementById(messageId) : null;
    if (message) {
      field.setAttribute("aria-invalid", "true");
      if (error) {
        error.textContent = message;
        error.hidden = false;
      }
    } else {
      field.removeAttribute("aria-invalid");
      if (error) {
        error.hidden = true;
      }
    }
  }

  function clearFieldError(event) {
    var field = event.target;
    if (field.getAttribute && field.getAttribute("aria-invalid") === "true") {
      setError(field, field.id + "-error", "");
    }
  }

  if (form) {
    var submitButton = form.querySelector('button[type="submit"]');
    var submitLabel = submitButton ? submitButton.getAttribute("data-label") || submitButton.textContent : "";

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = document.getElementById("name");
      var phone = document.getElementById("phone");
      var age = document.getElementById("age");
      var pack = document.getElementById("package");

      var nameError = name && name.value.trim() ? "" : "Введите имя";
      var phoneError = !phone ? "Введите телефон" :
        (phone.value.replace(/\D/g, "").length < 10 ? "Введите телефон полностью" : "");
      var ageError = age && age.value ? "" : "Выберите возраст ребёнка";
      var packError = pack && pack.value ? "" : "Пожалуйста, выберите пакет занятий";

      if (name) { setError(name, "name-error", nameError); }
      if (phone) { setError(phone, "phone-error", phoneError); }
      if (age) { setError(age, "age-error", ageError); }
      if (pack) { setError(pack, "package-error", packError); }

      var firstInvalid = [name, phone, age, pack].filter(function (field) {
        return field && field.getAttribute("aria-invalid") === "true";
      })[0];

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var chosen = pack && pack.options[pack.selectedIndex]
        ? pack.options[pack.selectedIndex].text
        : "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Отправляем заявку";
      }

      window.setTimeout(function () {
        alert("Спасибо! Мы свяжемся с вами в ближайшее время.\n\nПакет: " + chosen);

        form.reset();
        if (packageField) { packageField.value = ""; }
        [name, phone, age, pack].forEach(function (field) {
          if (field) { setError(field, field.id + "-error", ""); }
        });
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = submitLabel;
        }
      }, 500);
    });

    form.addEventListener("input", clearFieldError);
    form.addEventListener("change", clearFieldError);
  }
})();
