module.exports = function (eleventyConfig) {
  eleventyConfig.on("afterBuild", () => {
    console.log("✅ Site généré avec succès (avec start) !");
    const port = 3000;
    console.log(`-------`);
    console.log(
      `Screen at http://192.168.1.7:${port}/ or http://localhost:${port}/`
    );
    console.log(
      `Print at http://192.168.1.7:${port}/print.html or http://localhost:${port}/print.html`
    );
    console.log(`-------`);
  });
};