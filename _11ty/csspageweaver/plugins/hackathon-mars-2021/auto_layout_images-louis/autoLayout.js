// spread variables ----------------------------------------
var classElemAutoLayout = "auto-layout";

function isOverflown(element) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

class autoLayout extends Paged.Handler {
  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
  }

  beforePageLayout(page) {}

  renderNode(clone, node) {
    if (node.nodeType == 1 && node.classList.contains(classElemAutoLayout)) {
      // when all images have loaded
      // get their sizes
      node.style.margin = 0;

      const all_images = node.querySelectorAll("img");
      all_images.forEach((img) => (img.style.position = "absolute"));

      Promise.all(
        Array.from(all_images)
          .filter((img) => !img.complete)
          .map(
            (img) =>
              new Promise((resolve) => {
                img.onload = img.onerror = resolve;
              })
          )
      ).then(() => {
        node.style.height = node.parentElement.offsetHeight + "px";
        node.style.width = node.parentElement.offsetWidth + "px";
        // get image ratio, start with image width === container width
        let boxes = Array.from(all_images).map((img) => {
          const ratio = img.height / img.width;
          return {
            w: node.parentElement.offsetWidth,
            h: node.parentElement.offsetWidth * ratio,
          };
        });

        let potpack_props = potpack(boxes);

        while (
          potpack_props.w > node.parentElement.offsetWidth ||
          potpack_props.h > node.parentElement.offsetHeight
        ) {
          boxes = boxes.map((box) => {
            return {
              w: box.w * 0.9,
              h: box.h * 0.9,
            };
          });
          potpack_props = potpack(boxes);
        }

        boxes.map((box, index) => {
          all_images[index].style.left = box.x + "px";
          all_images[index].style.top = box.y + "px";
          all_images[index].style.width = box.w + "px";
          all_images[index].style.height = box.h + "px";
        });
      });
    }
  }

  afterPageLayout(pageElement, page, breakToken, chunker) {}
}
Paged.registerHandlers(autoLayout);
