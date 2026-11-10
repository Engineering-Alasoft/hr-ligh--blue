/* Hiringresource
   Menu, scroll state, in-page focus, and the inquiry form.
   The form validates in the browser. deliverInquiry() is the hook for a
   real mailbox. Until that hook sends data, the confirmation says so. */

(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelectorAll(".site-nav ul a");
  var sections = document.querySelectorAll("main section[id]");
  var ticking = false;

  function menuIsCollapsible() {
    return window.getComputedStyle(toggle).display !== "none";
  }

  function openMenu() {
    header.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    var firstLink = header.querySelector(".site-nav a");
    if (firstLink) firstLink.focus();
  }

  function closeMenu(returnFocus) {
    var wasOpen = header.classList.contains("is-open");
    header.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    if (wasOpen && returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", function () {
    if (header.classList.contains("is-open")) closeMenu(false);
    else openMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      closeMenu(true);
    }
  });

  document.addEventListener("click", function (event) {
    if (!header.classList.contains("is-open")) return;
    if (header.contains(event.target)) return;
    closeMenu(false);
  });

  window.addEventListener("resize", function () {
    if (!menuIsCollapsible() && header.classList.contains("is-open")) {
      closeMenu(false);
    }
  });

  /* In-page links: let the browser scroll, then move focus to the target
     so keyboard and screen reader users land on the section, not the raw page. */
  document.addEventListener("click", function (event) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest("a[href^='#']");
    if (!link) return;
    var id = link.getAttribute("href").slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (!target) return;
    if (header.classList.contains("is-open")) closeMenu(false);
    target.setAttribute("tabindex", "-1");
    window.requestAnimationFrame(function () {
      target.focus({ preventScroll: true });
    });
  });

  function onScroll() {
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");

    var marker = window.scrollY + header.offsetHeight + 80;
    var currentId = "";
    sections.forEach(function (section) {
      var top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) currentId = section.id;
    });

    navLinks.forEach(function (link) {
      if (currentId && link.getAttribute("href") === "#" + currentId) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });

  onScroll();

  /* Inquiry form
     Rules live here so the messages can be specific. The required attributes
     in the HTML remain as a fallback, but this script turns native bubbles off. */

  var form = document.getElementById("inquiry-form");
  var success = document.getElementById("form-success");
  var successTitle = document.getElementById("success-title");
  var successCopy = document.getElementById("success-copy");
  var formError = document.getElementById("form-error");
  var another = document.getElementById("another-inquiry");

  if (!form || !success) return;

  form.noValidate = true;

  function fieldError(id) {
    return document.getElementById(id + "-error");
  }

  function setInvalid(field, message) {
    field.setAttribute("aria-invalid", "true");
    var slot = fieldError(field.id);
    if (slot) slot.textContent = message;
  }

  function clearInvalid(field) {
    field.removeAttribute("aria-invalid");
    var slot = fieldError(field.id);
    if (slot) slot.textContent = "";
  }

  function clearAllErrors() {
    form.querySelectorAll("input, select, textarea").forEach(clearInvalid);
    formError.hidden = true;
    formError.textContent = "";
  }

  form.addEventListener("input", function (event) {
    var field = event.target;
    if (field.matches("input, select, textarea")) clearInvalid(field);
  });

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function digitCount(value) {
    var matches = value.match(/\d/g);
    return matches ? matches.length : 0;
  }

  function validate(data) {
    var fields = [];

    if (data.name.length < 2 || !/[A-Za-z]/.test(data.name)) {
      fields.push(["full-name", "Please enter your name."]);
    }
    if (!isEmail(data.email)) {
      fields.push(["email", "Please enter an email address we can reply to."]);
    }
    if (data.phone && digitCount(data.phone) < 7) {
      fields.push(["phone", "Please enter a phone number we can dial, or leave this blank."]);
    }
    if (!data.audience) {
      fields.push(["audience", "Please tell us how you are contacting the firm."]);
    }
    if (!data.region) {
      fields.push(["region", "Please choose the region you are writing from."]);
    }
    if (!data.topic) {
      fields.push(["topic", "Please choose a topic, even if you are not sure yet."]);
    }
    if (data.message.length < 12) {
      fields.push(["message", "Please tell us a little more. Two sentences is enough."]);
    }
    if (!data.consent) {
      fields.push(["consent", "Please confirm that we may use your details to reply."]);
    }

    return fields;
  }

  /* Replace the body of this function with a real request when the site
     goes live. Resolve only after the mailbox accepts the inquiry, and
     reject if it does not, so the confirmation stays honest.

     return fetch("/api/inquiries", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload)
     }).then(function (response) {
       if (!response.ok) throw new Error("The inquiry could not be delivered.");
     });
  */
  function deliverInquiry(payload) {
    return Promise.resolve(payload);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function showSuccess(name) {
    successTitle.textContent = name ? "Thank you, " + name + "." : "Thank you.";
    successCopy.textContent = "Your note is complete, and it has not been sent. This preview keeps the inquiry in the browser. To reach the firm now, call +1 312 555 0148.";
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center"
    });
    successTitle.focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearAllErrors();

    var data = {
      name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      country: form.country.value.trim(),
      region: form.region.value,
      audience: form.audience.value,
      topic: form.topic.value,
      message: form.message.value.trim(),
      consent: form.consent.checked
    };

    var problems = validate(data);
    if (problems.length) {
      problems.forEach(function (problem) {
        var field = document.getElementById(problem[0]);
        if (field) setInvalid(field, problem[1]);
      });
      var first = document.getElementById(problems[0][0]);
      if (first) first.focus();
      return;
    }

    var payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      region: data.region,
      audience: data.audience,
      topic: data.topic,
      message: data.message
    };

    deliverInquiry(payload).then(function () {
      showSuccess(data.name);
    }).catch(function () {
      formError.hidden = false;
      formError.textContent = "The inquiry could not be recorded. Please call +1 312 555 0148 or email inquiries@hiringresource.com.";
      formError.focus();
    });
  });

  another.addEventListener("click", function () {
    form.reset();
    clearAllErrors();
    success.hidden = true;
    form.hidden = false;
    form.full_name.focus();
  });
})();
