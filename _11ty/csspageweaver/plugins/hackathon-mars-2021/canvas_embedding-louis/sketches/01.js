(function () {
  var canvas = document.getElementById("01.js");
  var ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  function draw() {
    if (canvas.getContext) {
      for (var i = 0; i <= canvas.width; i += canvas.width / 10) {
        ctx.fillRect(i, 0, 20, 20);
      }
    }
  }

  function loadWeatherData() {
    fetch(
      "https://api.openweathermap.org/data/2.5/forecast/daily?q=Paris&appid=ad6e239ec0ac58d0a9836e942aac97eb&cnt=16&units=metric"
    )
      .then((response) => response.json())
      .then((data) => {
        ctx.stroke();
        try {
          ctx.font = "48px serif";
          ctx.fillStyle = "white";
          ctx.fillText(data.list[0].weather[0].description, 50, 70);

          ctx.font = "14px serif";

          data.list.map((l, index) => {
            ctx.fillText(
              JSON.stringify(data.list[index + 1].weather[0].description),
              50,
              90 + index * 24
            );
          });
        } catch (e) {}
      });
  }

  loadWeatherData();
  window.requestAnimationFrame(draw);
})();
