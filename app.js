(function () {
  "use strict";

  var ALL = "すべて";
  var selectedCategory = ALL;
  var searchText = "";
  var openIds = {};

  var searchInput = document.getElementById("search-input");
  var categoryFilter = document.getElementById("category-filter");
  var resultCount = document.getElementById("result-count");
  var faqList = document.getElementById("faq-list");
  var emptyMessage = document.getElementById("empty-message");

  // **太字** と `コード` を DOM ノードに変換して parent に追加する
  function appendInline(parent, text) {
    var pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    var parts = text.split(pattern);
    parts.forEach(function (part) {
      if (!part) {
        return;
      }
      var node;
      if (part.indexOf("**") === 0 && part.lastIndexOf("**") === part.length - 2 && part.length > 4) {
        node = document.createElement("strong");
        node.textContent = part.slice(2, -2);
      } else if (part.charAt(0) === "`" && part.charAt(part.length - 1) === "`" && part.length > 2) {
        node = document.createElement("code");
        node.textContent = part.slice(1, -1);
      } else {
        node = document.createTextNode(part);
      }
      parent.appendChild(node);
    });
  }

  // 検索対象用に記法を除去したプレーンテキストを返す
  function plain(text) {
    return text.replace(/\*\*/g, "").replace(/`/g, "");
  }

  function answerText(item) {
    return item.answer.map(function (block) {
      return block.type === "ul" ? block.items.map(plain).join(" ") : plain(block.text);
    }).join(" ");
  }

  function matches(item) {
    if (selectedCategory !== ALL && item.category !== selectedCategory) {
      return false;
    }
    if (searchText === "") {
      return true;
    }
    var target = (item.question + " " + answerText(item)).toLowerCase();
    return target.indexOf(searchText) !== -1;
  }

  function renderCategoryButtons() {
    var categories = [ALL];
    FAQ_DATA.forEach(function (item) {
      if (categories.indexOf(item.category) === -1) {
        categories.push(item.category);
      }
    });
    categories.forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.setAttribute("aria-pressed", name === selectedCategory ? "true" : "false");
      button.addEventListener("click", function () {
        selectedCategory = name;
        Array.prototype.forEach.call(categoryFilter.children, function (b) {
          b.setAttribute("aria-pressed", b === button ? "true" : "false");
        });
        render();
      });
      categoryFilter.appendChild(button);
    });
  }

  function buildItem(item, index) {
    var wrapper = document.createElement("div");
    wrapper.className = "faq-item";

    var questionId = "faq-q-" + index;
    var answerId = "faq-a-" + index;
    var isOpen = !!openIds[index];

    var button = document.createElement("button");
    button.type = "button";
    button.className = "faq-question";
    button.id = questionId;
    button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    button.setAttribute("aria-controls", answerId);

    var label = document.createElement("span");
    var category = document.createElement("span");
    category.className = "faq-category";
    category.textContent = item.category;
    label.appendChild(category);
    label.appendChild(document.createTextNode(item.question));

    var arrow = document.createElement("span");
    arrow.className = "faq-arrow";
    arrow.setAttribute("aria-hidden", "true");

    button.appendChild(label);
    button.appendChild(arrow);

    var panel = document.createElement("div");
    panel.className = "faq-answer";
    panel.id = answerId;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", questionId);
    panel.hidden = !isOpen;

    item.answer.forEach(function (block) {
      if (block.type === "ul") {
        var ul = document.createElement("ul");
        block.items.forEach(function (text) {
          var li = document.createElement("li");
          appendInline(li, text);
          ul.appendChild(li);
        });
        panel.appendChild(ul);
      } else {
        var p = document.createElement("p");
        appendInline(p, block.text);
        panel.appendChild(p);
      }
    });

    button.addEventListener("click", function () {
      var expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", expanded ? "false" : "true");
      panel.hidden = expanded;
      openIds[index] = !expanded;
    });

    wrapper.appendChild(button);
    wrapper.appendChild(panel);
    return wrapper;
  }

  function render() {
    faqList.textContent = "";
    var count = 0;
    FAQ_DATA.forEach(function (item, index) {
      if (matches(item)) {
        faqList.appendChild(buildItem(item, index));
        count++;
      }
    });
    resultCount.textContent = count + "件の質問";
    emptyMessage.hidden = count !== 0;
  }

  searchInput.addEventListener("input", function () {
    searchText = searchInput.value.trim().toLowerCase();
    render();
  });

  renderCategoryButtons();
  render();

  // テーマ切替
  var themeToggle = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
      themeToggle.setAttribute("aria-label", theme === "dark" ? "ライトテーマに切り替え" : "ダークテーマに切り替え");
    }
  }

  // 初期テーマ: OS設定を参照
  var initialTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }
})();
