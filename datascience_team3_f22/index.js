// The svg
const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

// Map and projection
const path = d3.geoPath();
const projection = d3.geoMercator().scale(150).center([0, 20]);

// Data and color scale
const data = new Map();
const colorScale = d3
  .scaleThreshold()
  .domain([1, 5, 10, 20, 40, 100])
  .range(d3.schemeBlues[7]);

// Load external data and boot
Promise.all([
  d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  ),
  d3.csv(
    "https://datasci-general.s3.amazonaws.com/SYB64_1_202110_Population%2C%2BSurface%2BArea%2Band%2BDensity_cleaned.csv",
    function (d) {
      if (d.Series === "Population mid-year estimates (millions)") {
        data.set(d.Country, +d.Value);
      }
    }
  ),
]).then(function (loadData) {
  let topo = loadData[0];

  let mouseOver = function (d) {
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.5);
    d3.select(this).transition().duration(200).style("opacity", 1);
  };

  let mouseLeave = function (d) {
    d3.selectAll(".Country").transition().duration(200).style("opacity", 0.8);
  };

  svg
    .append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("d", d3.geoPath().projection(projection))
    .attr("fill", function (d) {
      d.total = data.get(d.properties.name) || 0;
      return colorScale(d.total);
    })
    .style("stroke", "transparent")
    .attr("class", function (d) {
      return "Country";
    })
    .style("opacity", 0.8)
    .on("mouseover", mouseOver)
    .on("mouseleave", mouseLeave);
});

d3.select("#opts").on("change", function () {
  var newData = eval(d3.select(this).property("value"));
});
