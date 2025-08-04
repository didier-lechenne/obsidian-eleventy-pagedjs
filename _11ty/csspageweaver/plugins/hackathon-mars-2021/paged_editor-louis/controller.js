let total_number_of_pages = false;
let current_page = 1;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ShowOnlyOnePage extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  layoutNode(node) {}

  afterPageLayout(pageElement, page, breakToken) {
    pageElement.style.display = "none";
  }

  afterRendered(pages) {
    total_number_of_pages = pages.length;
  }

  renderNode(node, sourceNode) {
    // node.style.display = "none";
  }
  afterPreview(pages) {
    document.querySelector("._controller").classList.remove("is--loading");

    updateNavMenu();
    setNavFromPaged();
  }
}
Paged.registerHandlers(ShowOnlyOnePage);

ready.then(async function () {
  await sleep(100);

  document.querySelector("._controller").classList.add("is--loading");
  // copier le contenu du template dans le controller
  const template_content = document.querySelector("template").innerHTML;
  document.querySelector(
    "._controller--menu--template"
  ).innerHTML = template_content;

  document.querySelector("#js--prevbtn").addEventListener("click", navPrev);
  document.querySelector("#js--nextbtn").addEventListener("click", navNext);
  document.querySelector("#js--reflow").addEventListener("click", () => {
    window.reflowText();
  });
});

//
window.reflowText = function () {
  // État de loading
  document.querySelector("._controller").classList.add("is--loading");
  
  // Nettoyer complètement avant reflow
  document.querySelectorAll(".pagedjs_page").forEach(page => page.remove());
  
  const new_content = document.querySelector("._controller--menu--template").innerHTML;
  let flowText = document.querySelector("#flow");
  flowText.innerHTML = new_content;
  
  // Régénérer les IDs
  setIDforAllInnermostChildren(flowText.content);
  
  paged.preview(flowText.content).then((flow) => {
    current_page = 1; // Reset à page 1
    total_number_of_pages = flow.total; // Mettre à jour le total
    updateNavMenu();
    document.querySelector("._controller").classList.remove("is--loading");
  }).catch((error) => {
    console.error("Erreur reflow:", error);
    document.querySelector("._controller").classList.remove("is--loading");
  });
};

function setNavMenu() {
  document.querySelector("#js--pageNav").innerHTML =
    current_page + "/" + total_number_of_pages;
}

function updateNavMenu() {
  setNavMenu();
  navToPage();
}

function navNext() {
  if (current_page < total_number_of_pages) {
    current_page++;
    updateNavMenu();
  }
}

function navPrev() {
  if (current_page > 1) {
    current_page--;
    updateNavMenu();
  }
}

function navToPage() {
  document.querySelectorAll(".pagedjs_page")
    .forEach((page) => (page.style.display = "none"));
  
  const targetPage = document.querySelector(
    `.pagedjs_page[data-page-number="${current_page}"]`
  );
  if (targetPage) {
    targetPage.style.display = "block";
  }
}

function setNavFromPaged() {
  document.addEventListener("click", (event) => {
    if (
      event.target.id &&
      document.querySelector(".pagedjs_pages") &&
      document.querySelector("._controller--menu--template")
    ) {
      event.target.classList.add("is--highlighted");
      setTimeout(() => {
        event.target.classList.remove("is--highlighted");
      }, 1000);

      // check if click on a page
      if (document.querySelector(".pagedjs_pages").contains(event.target)) {
        // nav inside menu--template to same id, also highlight it
        // try to find
        const id_to_find = event.target.id;
        const elem = document.querySelector(
          `._controller--menu--template #${id_to_find}`
        );
        if (elem) scrollAndFlashText(elem);
      } else if (
        document
          .querySelector("._controller--menu--template")
          .contains(event.target)
      ) {
        // try to find
        const id_to_find = event.target.id;
        const elem = document.querySelector(`.pagedjs_pages #${id_to_find}`);
        if (elem) pageAndFlashText(elem);
      }
    }
  });
}

function scrollAndFlashText(elem) {
  elem.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
  elem.classList.add("is--highlighted");
  setTimeout(() => {
    elem.classList.remove("is--highlighted");
  }, 1000);
}

function pageAndFlashText(elem) {
  // find right page to show
  const parent_page = elem.closest(".pagedjs_page");
  if (!parent_page) return false;

  current_page = parseInt(parent_page.dataset.pageNumber, 10); // Conversion explicite
  updateNavMenu();

  elem.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });

  elem.classList.add("is--highlighted");
  setTimeout(() => {
    elem.classList.remove("is--highlighted");
  }, 1000);
}
