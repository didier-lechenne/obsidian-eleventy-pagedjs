ready.then(async function () {
  let flowText = document.querySelector("#flow");

  let t0 = performance.now();

  let paged = new Paged.Previewer();

  paged.preview(flowText.content).then((flow) => {
    let t1 = performance.now();
    console.log(
      "Rendering " + flow.total + " pages took " + (t1 - t0) + " milliseconds."
    );
  });

  let resizer = () => {
    let pages = document.querySelector(".pagedjs_pages");

    if (pages) {
      let scale = (window.innerWidth * 0.9) / pages.offsetWidth;
      if (scale < 1) {
        pages.style.transform = `scale(${scale}) translate(${
          window.innerWidth / 2 - (pages.offsetWidth * scale) / 2
        }px, 0)`;
      } else {
        pages.style.transform = "none";
      }
    }
  };
  // resizer();
  // window.addEventListener("resize", resizer, false);
  // paged.on("rendering", () => {
  //   resizer();
  // });
});
