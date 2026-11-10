/* Hiringresource
   Menu, scroll state, in-page focus, and the inquiry form.
   The form validates in the browser. deliverInquiry() is the hook for a
   real mailbox. Until that hook sends data, the confirmation says so. */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

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
    var filter = link.getAttribute("data-filter");
    if (filter) applyFilter(filter);
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

  var toTop = document.querySelector(".to-top");

  function onScroll() {
    if (window.scrollY > 8) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");

    if (toTop) toTop.hidden = window.scrollY < 700;

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

  /* Live clocks, scroll entrance, service filter, and region handoff. */

  function paintClocks() {
    var now = new Date();
    document.querySelectorAll(".clock time[data-zone]").forEach(function (node) {
      var zone = node.getAttribute("data-zone");
      try {
        node.textContent = new Intl.DateTimeFormat("en-GB", {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23"
        }).format(now);
        node.setAttribute("datetime", now.toISOString());
      } catch (error) {
        node.textContent = "--:--";
      }
    });
  }

  paintClocks();
  window.setInterval(paintClocks, 1000);

  var revealNodes = document.querySelectorAll(
    ".section-head, .audience article, .principle, .value, .region, .service, .step, .clock, .about-quote, .about-story, .contact-card, .contact-form-wrap"
  );
  var siblingCount = new Map();

  revealNodes.forEach(function (node) {
    var count = siblingCount.get(node.parentElement) || 0;
    siblingCount.set(node.parentElement, count + 1);
    node.style.transitionDelay = Math.min(count, 5) * 70 + "ms";
  });

  function showReveal(node) {
    node.classList.add("is-visible");
  }

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    revealNodes.forEach(showReveal);
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        showReveal(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revealNodes.forEach(function (node) {
      revealObserver.observe(node);
    });
  }

  var filterButtons = document.querySelectorAll(".filters .filter");
  var serviceItems = document.querySelectorAll(".service");
  var serviceList = document.querySelector(".service-list");
  var filterStatus = document.getElementById("filter-status");

  function applyFilter(name) {
    var shown = 0;
    serviceItems.forEach(function (item) {
      var match = name === "all" || item.getAttribute("data-audience") === name;
      item.hidden = !match;
      if (match) {
        shown += 1;
        item.classList.add("is-visible");
      }
    });
    filterButtons.forEach(function (button) {
      var on = button.getAttribute("data-filter") === name;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (serviceList) serviceList.classList.toggle("is-single", shown === 1);
    if (filterStatus) {
      if (name === "employers") filterStatus.textContent = "Three engagements for employers.";
      else if (name === "professionals") filterStatus.textContent = "Career coaching for professionals.";
      else filterStatus.textContent = "Four engagements.";
    }
    return shown;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyFilter(button.getAttribute("data-filter"));
    });
  });

  var regionField = document.getElementById("region");
  document.querySelectorAll("[data-region]").forEach(function (button) {
    button.addEventListener("click", function () {
      var value = button.getAttribute("data-region");
      document.querySelectorAll(".region").forEach(function (card) {
        card.classList.toggle("is-picked", card.contains(button));
      });
      if (regionField) {
        regionField.value = value;
        regionField.dispatchEvent(new Event("input", { bubbles: true }));
      }
      var contact = document.getElementById("contact");
      if (contact) {
        contact.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start"
        });
        if (regionField) regionField.focus({ preventScroll: true });
      }
    });
  });

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

  var messageField = document.getElementById("message");
  var messageCount = document.getElementById("message-count");

  function paintCount() {
    if (!messageField || !messageCount) return;
    var length = messageField.value.length;
    messageCount.textContent = length + " / 1500";
    messageCount.classList.toggle("is-near", length > 1200);
  }

  if (messageField) messageField.addEventListener("input", paintCount);
  paintCount();

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
